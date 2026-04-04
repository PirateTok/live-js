import { root } from "../proto/schema.js";
import { gunzipSync } from "node:zlib";

const PushFrame = root.lookupType("WebcastPushFrame");
const HeartbeatMsg = root.lookupType("HeartbeatMessage");
const EnterRoomMsg = root.lookupType("WebcastImEnterRoomMessage");

export function buildHeartbeat(roomId: string): Uint8Array {
  const hb = HeartbeatMsg.encode(HeartbeatMsg.create({ roomId })).finish();
  const frame = PushFrame.create({
    payloadEncoding: "pb",
    payloadType: "hb",
    payload: hb,
  });
  return PushFrame.encode(frame).finish();
}

export function buildEnterRoom(roomId: string): Uint8Array {
  const enter = EnterRoomMsg.encode(
    EnterRoomMsg.create({
      roomId,
      liveId: 12,
      identity: "audience",
      filterWelcomeMsg: "0",
    })
  ).finish();
  const frame = PushFrame.create({
    payloadEncoding: "pb",
    payloadType: "im_enter_room",
    payload: enter,
  });
  return PushFrame.encode(frame).finish();
}

export function buildAck(logId: number | Long, internalExt: Uint8Array): Uint8Array {
  const frame = PushFrame.create({
    payloadEncoding: "pb",
    payloadType: "ack",
    logId,
    payload: internalExt,
  });
  return PushFrame.encode(frame).finish();
}

export function decompressIfGzipped(data: Uint8Array): Uint8Array {
  if (data.length >= 2 && data[0] === 0x1f && data[1] === 0x8b) {
    return gunzipSync(data);
  }
  return data;
}

type Long = { low: number; high: number; unsigned: boolean };
