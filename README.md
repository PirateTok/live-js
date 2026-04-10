<p align="center">
  <img src="https://raw.githubusercontent.com/PirateTok/.github/main/profile/assets/og-banner-v2.png" alt="PirateTok" width="640" />
</p>

# piratetok-live-js

Connect to any TikTok Live stream and receive real-time events in Node.js/TypeScript. No signing server, no API keys, no authentication required.

```typescript
import { TikTokLiveClient, EventType } from "piratetok-live-js";

// Create client — no API key, no signing server, just a username
const client = new TikTokLiveClient("username_here");

// Register event handlers before connecting
client.on(EventType.chat, (data) => {
  console.log(`[chat] ${data.user?.nickname}: ${data.content}`);
});

client.on(EventType.gift, (data) => {
  const diamonds = data.gift?.diamondCount ?? 0;
  console.log(`[gift] ${data.user?.nickname} sent ${data.gift?.name} x${data.repeatCount} (${diamonds} diamonds)`);
});

client.on(EventType.like, (data) => {
  console.log(`[like] ${data.user?.nickname} (${data.total} total)`);
});

// Connect — resolves room ID, opens WSS, starts heartbeat
await client.connect();
```

## Install

```
npm install piratetok-live-js
```

Requires Node.js >= 18.

## Other languages

| Language | Install | Repo |
|:---------|:--------|:-----|
| **Rust** | `cargo add piratetok-live-rs` | [live-rs](https://github.com/PirateTok/live-rs) |
| **Go** | `go get github.com/PirateTok/live-go` | [live-go](https://github.com/PirateTok/live-go) |
| **Python** | `pip install piratetok-live-py` | [live-py](https://github.com/PirateTok/live-py) |
| **C#** | `dotnet add package PirateTok.Live` | [live-cs](https://github.com/PirateTok/live-cs) |
| **Java** | `com.piratetok:live` | [live-java](https://github.com/PirateTok/live-java) |
| **Lua** | `luarocks install piratetok-live-lua` | [live-lua](https://github.com/PirateTok/live-lua) |
| **Elixir** | `{:piratetok_live, "~> 0.1"}` | [live-ex](https://github.com/PirateTok/live-ex) |
| **Dart** | `dart pub add piratetok_live` | [live-dart](https://github.com/PirateTok/live-dart) |
| **C** | `#include "piratetok.h"` | [live-c](https://github.com/PirateTok/live-c) |
| **PowerShell** | `Install-Module PirateTok.Live` | [live-ps1](https://github.com/PirateTok/live-ps1) |
| **Shell** | `bpkg install PirateTok/live-sh` | [live-sh](https://github.com/PirateTok/live-sh) |

## Features

- **Zero signing dependency** — no API keys, no signing server, no external auth
- **64 decoded event types** — programmatic protobufjs schemas, no `.proto` files
- **Auto-reconnection** — stale detection, exponential backoff, self-healing auth
- **Enriched User data** — badges, gifter level, moderator status, follow info, fan club
- **Sub-routed convenience events** — `follow`, `share`, `join`, `liveEnded`
- **ESM + TypeScript** — full type definitions included
- **2 runtime deps** — `protobufjs` + `ws`

## Configuration

```typescript
const client = new TikTokLiveClient("username_here")
  .cdnEU()                                        // EU CDN endpoint
  .cdnUS()                                        // US CDN endpoint
  .cdn("webcast-ws.custom.tiktok.com")            // custom CDN host
  .timeout(15_000)                                 // HTTP timeout in ms (default 10000)
  .maxRetries(10)                                  // reconnect attempts (default 5)
  .staleTimeout(90_000)                            // reconnect after N ms of silence (default 60000)
  .proxy("socks5://host:port")                     // proxy URL (HTTP/HTTPS/SOCKS5)
  .compress(false)                                 // disable gzip compression for WSS payloads (default true)
  .userAgent("Mozilla/...")                        // override random UA rotation with a fixed user-agent
  .cookies("sessionid=xxx; sid_tt=xxx")            // session cookies for 18+ room info
  .language("en")                                  // override detected system language (two-letter code)
  .region("US");                                   // override detected system region (two-letter code)
```

## Room info (optional, separate call)

```typescript
import { checkOnline, fetchRoomInfo } from "piratetok-live-js";

const { roomId } = await checkOnline("username_here");
const info = await fetchRoomInfo(roomId);

// 18+ rooms
const info = await fetchRoomInfo(roomId, 10_000, "sessionid=abc; sid_tt=abc");
```

## Helpers

Three stateful helpers for common patterns. Exported from the main package, never imported by the core pipeline.

```typescript
import { GiftStreakTracker, LikeAccumulator, ProfileCache } from "piratetok-live-js";

// GiftStreakTracker — computes per-event gift deltas from TikTok's running totals
const tracker = new GiftStreakTracker();
client.on(EventType.gift, (data) => {
  const streak = tracker.process(data);
  // streak.eventGiftCount, streak.totalDiamondCount, streak.isFinal, ...
});

// LikeAccumulator — monotonizes TikTok's inconsistent total_like_count
const likes = new LikeAccumulator();
client.on(EventType.like, (data) => {
  const stats = likes.process(data);
  // stats.totalLikeCount (never goes backwards), stats.accumulatedCount
});

// ProfileCache — TTL-cached profile scraping with ttwid management
const cache = new ProfileCache({ ttlMs: 300_000, proxy: "socks5://host:port" });
const profile = await cache.fetch("username_here");
// profile.uniqueId, profile.nickname, profile.followerCount, ...
```

## Examples

```bash
node examples/basic-chat.js <username>       # connect + print chat events
node examples/online-check.js <username>     # check if user is live
node examples/stream-info.js <username>      # fetch room metadata + stream URLs
node examples/gift-tracker.js <username>     # track gifts with diamond totals
node examples/gift-streak.js <username>      # track gift streaks with GiftStreakTracker
node examples/profile-lookup.js <username>   # scrape profile via ProfileCache
```

## Replay testing

Deterministic cross-lib validation against binary WSS captures. Requires testdata from a separate repo:

```bash
git clone https://github.com/PirateTok/live-testdata testdata
npm test
```

Tests skip gracefully if testdata is not found. You can also set `PIRATETOK_TESTDATA` to point to a custom location.

## License

0BSD
