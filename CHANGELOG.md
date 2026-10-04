# Changelog

## 0.3.0

### Breaking
- `connect()` resolves with the room ID once the first WSS handshake succeeds; the reconnect loop keeps running in the background (live-js #1, bug 2). Previously it resolved only after the whole session ended. It rejects if the user is not live or the loop gives up before any handshake.
- `connectWss()` rejects on socket errors instead of resolving after `onError`.
- `error` events are only emitted when an `error` listener is registered (an unheard `error` used to crash the loop).
- Node.js >= 22.19 (undici 8). New runtime deps: `undici`, `https-proxy-agent`, `socks-proxy-agent`.

### Fixed
- ttwid: a cookie-less tiktok.com response is retried up to 8 times, 750 ms apart (`TtwidMissingError` after that); transport errors are thrown immediately (live-js #1, bug 1).
- A ttwid fetch failure inside the reconnect loop is a failed attempt with backoff — it no longer rejects `connect()`.
- The ttwid + UA session is reused across reconnects and rotated only on `DEVICE_BLOCKED`, a failed ttwid fetch, or a connection that died within 30 s. The WSS now uses the same UA the ttwid was minted with.
- `maxRetries` counts consecutive failures: a session that stays up 30 s resets the budget, so long streams no longer die after `maxRetries` lifetime drops.
- `.proxy()` did nothing: the ESM build called `require()`, the ReferenceError was swallowed, and every HTTP call and the WSS went direct. HTTP now goes through undici `ProxyAgent` / `Socks5ProxyAgent`, WSS through `https-proxy-agent` / `socks-proxy-agent`. An unsupported scheme throws.

### Added
- `.heartbeatInterval(ms)` builder (default 10 000); also sent as the `heartbeat_duration` WSS param.
- `topViewers(roomUserSeq)` — the top-viewers box from `RoomUserSeq.ranksList`, sorted by rank.
- `fetchRoomAudience(roomId, anchorId?, cookies)` — full viewer roster from `/webcast/ranklist/online_audience/`. Login-gated: `SessionRequiredError` without session cookies. New `InvalidResponseError`.
- `checkOnline()` returns `anchorId` (streamer user ID).
- Gift events carry `isCombo`, `isStreakOver`, `diamondTotal`; the same helpers are exported as functions.
- `ProfileCache({ baseUrl })` — TikTok web origin override (default `https://www.tiktok.com`).
- `examples/audience.js`.
- Offline tests: ttwid retry (fake HTTP responder), reconnect loop (scripted sessions), local WSS handshake/heartbeat, audience fixtures, `topViewers`, gift helpers / sub-routing / unknown passthrough / enriched User, HTTP + SOCKS5 proxy for HTTP and WSS, check_online / room info mapping, all 64 Tier A+B types typed, needs_ack ack, stale timeout, client Reconnecting/Disconnected lifecycle, ProfileCache cache hit + negative cache.

### Tests
- Replay tests fail when testdata is missing instead of skipping. `PIRATETOK_TESTDATA` accepts a live-testdata checkout (`captures/manifests/`).

### Meta
- Homepage → https://piratetok.rosint.org, funding → https://piratetok.rosint.org/donate.html.
- 0.2.0 was tagged but never published to npm. 0.3.0 includes it (full proto schema parity).
