# Quit

A personal, installable web app for tapering off cigarettes or vaping and staying quit.
No account, no server: everything is stored in the browser on the device you use it on.

## What it does

- **Taper engine.** You set a baseline, a quit date and your waking hours. The app sets a daily
  allowance that steps down to zero on quit day and spaces each use evenly through the day
  ("next one at 2:40 PM"). After quit day it flips to a smoke-free timer.
- **Craving SOS.** One tap: rate the urge, 3 minutes of paced breathing with acceptance prompts,
  your own reasons and live stats, distraction cards and a tap game, then log how it went.
- **Progress.** Money kept, uses avoided, cravings beaten, streaks, a daily chart against the
  taper target, cravings by hour and by trigger, a health recovery timeline and badges.
- **Program.** 10 short "Reduce" lessons during the taper and 28 "Stay quit" lessons from quit day,
  each with one written task. Cognitive-behavioural and acceptance-based content.
- **Rewards that feel like rewards.** A plant that grows with clean days, milestone celebrations,
  encouragement that changes daily, and prompts to spend some of the saved money on yourself.

## Run it locally

Any static file server works. With Python:

```bash
python -m http.server 8765
```

Then open http://localhost:8765. Opening `index.html` directly from disk works for a look, but
the service worker (offline mode, install prompt) needs http or https.

Run the math tests with `node run-tests.mjs` or by opening `tests.html`.

## Put it on your phone

The simplest route is GitHub Pages:

1. Create a GitHub repository and push this folder to it.
2. In the repository settings, under Pages, choose "Deploy from a branch", branch `main`, folder `/ (root)`.
3. After a minute the app is at `https://<your-user>.github.io/<repo>/`.
4. Open that URL on your phone. Android Chrome offers "Add to Home screen"; on iPhone use the
   Share button, then "Add to Home Screen". It then opens full-screen like a native app and works offline.

Your data never leaves the phone. Use Settings → Export to back it up or move it to another device.

## Files

| File | Purpose |
|---|---|
| `index.html`, `styles.css`, `app.js` | App shell, styling, screens and event wiring |
| `taper.js` | Allowance schedule and next-allowed-time math (pure functions) |
| `stats.js` | Money, units avoided, streaks, craving stats, milestones (pure functions) |
| `sos.js` | The craving SOS flow |
| `charts.js` | Inline SVG charts |
| `rewards.js` | Plant, celebrations, encouragement |
| `content/program.js` | Lesson text |
| `content/health.js` | Health milestones, badges, sources |
| `content/distractions.js` | Triggers, distraction cards, breathing prompts |
| `store.js` | localStorage persistence, export/import |
| `sw.js`, `manifest.webmanifest`, `icons/` | Installable / offline layer |
| `tests.js`, `tests.html`, `run-tests.mjs` | Unit tests for the math |
| `tools/make-icons.mjs` | Regenerates the icon PNGs |

## Evidence behind the design

- Structured reduction to a fixed quit date is about as effective as abrupt quitting (Cochrane, Lindson et al. 2019).
- Riding out urges with acceptance-based breathing is drawn from ACT-based quit programs (SmartQuit trial).
- Trigger mapping, permission-thought replies and if-then plans (implementation intentions) are standard CBT quit-program tools.
- Treating a slip as data rather than failure counters the abstinence violation effect.
- Health milestones: American Cancer Society, CDC, NHS (links in Settings).

This is a self-help tool, not medical advice. For nicotine replacement or medication, talk to a doctor
or pharmacist. In the US, 1-800-QUIT-NOW is free.
