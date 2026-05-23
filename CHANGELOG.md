# Changelog

All notable changes to Jack's Potion Lab will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to incrementing service-worker cache versions on each release.

## [SW v22] — 2026-05-23

### Added
- Critical fix: question prompts are now narrated out loud (was silent for a pre-reader)
- Retry button on incorrect answers
- Hint surfaced after 5 seconds of inactivity
- Celebration narration on potion complete
- Room progress pip bar so Asher can see how close he is to the next room
- 12% lucky-reward chance per correct answer (variable reward)
- Lazy-loaded background images per room
- Structured analytics event hook

### Changed
- Kids-UI v2 depth pass: bevel, drop shadow, and idle bob on interactive elements
- Audio mix now runs through a DynamicsCompressor with music ducking under voice
- SES / lockdown hardening: inline PWA bootstrap moved into `main.js`, `new Image()` swapped for `createElement`, AudioContext wrapped in try/catch
- PWA banner buttons rewired through `_pwaInit` instead of inline `onclick=` handlers
