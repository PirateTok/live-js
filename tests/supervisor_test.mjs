// Reconnect loop — offline, scripted fake sessions on a virtual clock.
//
// S1: ttwid fetch failure is a failed attempt (Reconnecting + backoff), not an abort
// S2: consecutive failures accumulate until max_retries, rotating ttwid each time
// S3: healthy sessions (≥30 s) reset the budget and reuse ttwid + UA
// S4: DEVICE_BLOCKED rotates ttwid + UA with the short 2 s delay
// S5: onOpen fires while the session is still running (connect() resolves on handshake)
// S6: abort stops the loop
//
// Run: node --test tests/supervisor_test.mjs

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  superviseSessions,
  reconnectBackoffMs,
  HEALTHY_SESSION_MS,
  DEVICE_BLOCKED_DELAY_MS,
} from "../dist/connection/supervisor.js";
import { DeviceBlockedError } from "../dist/http/api.js";

// script entries: "ttwid-fail" | { ms, end: "close" | "error" | "blocked" }
function harness(sessionScript, mintScript = []) {
  let clock = 0;
  let minted = 0;
  const log = { mints: 0, runs: [], reconnects: [], errors: 0, opens: 0 };
  const controller = new AbortController();
  const deps = {
    newSession: async () => {
      log.mints++;
      if (mintScript.shift() === "fail") throw new Error("ttwid: no ttwid cookie");
      minted++;
      return { ttwid: `ttwid-${minted}`, userAgent: `ua-${minted}` };
    },
    runSession: async (session, onOpen) => {
      const step = sessionScript.shift();
      if (!step) {
        controller.abort();
        return;
      }
      log.runs.push(session.ttwid);
      onOpen();
      clock += step.ms;
      if (step.end === "blocked") throw new DeviceBlockedError();
      if (step.end === "error") throw new Error("socket hang up");
    },
    sleep: async (ms) => { clock += ms; },
    now: () => clock,
  };
  const hooks = {
    onOpen: () => { log.opens++; },
    onReconnecting: (info) => log.reconnects.push(info),
    onError: () => { log.errors++; },
  };
  return { deps, hooks, log, controller };
}

describe("reconnect supervisor", () => {
  it("S1 ttwid failure → failed attempt, then recovers", async () => {
    const h = harness([{ ms: 1_000, end: "close" }], ["fail", "fail"]);
    await superviseSessions(h.deps, 5, h.controller.signal, h.hooks);
    assert.deepEqual(h.log.reconnects.slice(0, 2).map((r) => r.attempt), [1, 2]);
    assert.equal(h.log.reconnects[0].delayMs, reconnectBackoffMs(1));
    assert.equal(h.log.mints, 3);
    assert.deepEqual(h.log.runs, ["ttwid-1"]);
    assert.equal(h.log.errors, 2);
  });

  it("S2 short-lived failures accumulate to max_retries and rotate ttwid", async () => {
    const fail = { ms: 500, end: "error" };
    const h = harness([fail, fail, fail, fail, fail]);
    await superviseSessions(h.deps, 3, h.controller.signal, h.hooks);
    assert.deepEqual(h.log.reconnects.map((r) => r.attempt), [1, 2, 3]);
    assert.deepEqual(h.log.reconnects.map((r) => r.delayMs), [2_000, 4_000, 8_000]);
    assert.deepEqual(h.log.runs, ["ttwid-1", "ttwid-2", "ttwid-3", "ttwid-4"]);
    assert.ok(!h.controller.signal.aborted, "stopped by budget, not by script end");
  });

  it("S3 healthy sessions reset the budget and keep ttwid + UA", async () => {
    const healthy = { ms: HEALTHY_SESSION_MS + 1, end: "error" };
    const h = harness([healthy, healthy, healthy, healthy, healthy, healthy]);
    await superviseSessions(h.deps, 2, h.controller.signal, h.hooks);
    assert.equal(h.log.runs.length, 6, "outlived max_retries=2 lifetime drops");
    assert.ok(h.log.reconnects.every((r) => r.attempt === 1));
    assert.deepEqual([...new Set(h.log.runs)], ["ttwid-1"]);
    assert.equal(h.log.mints, 1);
  });

  it("S4 DEVICE_BLOCKED rotates with the short delay", async () => {
    const h = harness([{ ms: 100, end: "blocked" }, { ms: 100, end: "blocked" }, { ms: 1_000, end: "close" }]);
    await superviseSessions(h.deps, 5, h.controller.signal, h.hooks);
    assert.deepEqual(h.log.runs, ["ttwid-1", "ttwid-2", "ttwid-3"]);
    assert.deepEqual(h.log.reconnects.slice(0, 2).map((r) => [r.delayMs, r.deviceBlocked]),
      [[DEVICE_BLOCKED_DELAY_MS, true], [DEVICE_BLOCKED_DELAY_MS, true]]);
    assert.equal(h.log.errors, 0, "DEVICE_BLOCKED is not reported as an error");
  });

  it("S5 onOpen fires before the session ends", async () => {
    const controller = new AbortController();
    let release;
    let opened = false;
    let loopDone = false;
    const loop = superviseSessions({
      newSession: async () => ({ ttwid: "t", userAgent: "u" }),
      runSession: (_s, onOpen) => new Promise((resolve) => { release = resolve; onOpen(); }),
      sleep: async () => {},
      now: () => 0,
    }, 5, controller.signal, {
      onOpen: () => { opened = true; },
      onReconnecting: () => {},
      onError: () => {},
    }).then(() => { loopDone = true; });
    await new Promise((r) => setImmediate(r));
    assert.ok(opened, "handshake reported");
    assert.ok(!loopDone, "session still streaming");
    controller.abort();
    release();
    await loop;
    assert.ok(loopDone);
  });

  it("S6 abort stops the loop without reconnecting", async () => {
    const h = harness([{ ms: 10, end: "close" }]);
    h.controller.abort();
    await superviseSessions(h.deps, 5, h.controller.signal, h.hooks);
    assert.equal(h.log.runs.length, 0);
    assert.equal(h.log.reconnects.length, 0);
  });
});
