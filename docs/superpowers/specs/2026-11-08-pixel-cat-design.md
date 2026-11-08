# Pixel Cat — virtual pet website

## Context
The repo (`My_Cat`, branch `build`) is empty. The user wants a website for "raising a cat". From our conversation, that means a **virtual pet game** for **friends and the public**: you adopt a pixel-art kitten, look after it, and come back each day. Success means a friend opens a link on their phone, meets the cat in seconds, and has a reason to come back tomorrow.

## What the user decided
- **Kind of thing:** a browser virtual-pet game, not a care guide or tracker.
- **Audience:** friends and the public, so it must feel polished and be easy to pick up.
- **Time away:** needs drop in real time, even while the page is closed. Coming back after 3 days shows a hungry, grumpy cat. Care brings it back. **The cat never dies or runs away.**
- **Sharing:** no accounts. Each cat lives in its owner's browser. A button makes a **snapshot card** (an image) to post or send.
- **Look:** original **pixel art** in a retro handheld-pet style.
- **First version includes:** naming and growing up (kitten → adult over real days), feeding and treats, a play mini-game, petting, cleaning the litter box, and sleep (lights off).
- **Language:** English and Vietnamese with a switch.
- **Must avoid:** bad phone experience, being boring after day 1, and annoying sounds.

## My calls (the user can override these)
- **Tech:** plain HTML + CSS + vanilla JavaScript (ES modules), built with **Vite**. No framework and no backend. Tests use **Vitest** and cover game logic only.
- **Hosting:** Vercel static deploy (the plugin is already installed). Deploy only when the user asks.
- **Save:** `localStorage` with one versioned JSON object. Clearing browser data resets the cat, and the Settings screen says so.
- **Pixel art:** sprites are written in code as small text grids (one character = one palette color) and drawn on a `<canvas>` with `image-rendering: pixelated`. No image files are needed.
- **Sound:** **off by default**. A clear mute toggle is always visible, and the setting is saved. Sounds are short and made in code with WebAudio (no audio files).
- **Phones first:** portrait layout, tap targets at least 48px, no page scroll on the main screen, and it also works on a laptop.
- **Mini-game:** "Fish Catch". Fish fall for 30 seconds and you slide a basket under them. It raises happiness and earns coins.

## Game rules
**Stats (0–100):** hunger, happiness, energy, cleanliness.
- Each stat drops at a set rate per hour (tunable constants in one file). While the cat sleeps, energy goes up instead of down.
- On load, the game works out how much time passed since the last save and applies the drops, capped at 0. The cat never dies.
- **Mood** comes from the lowest stats (happy / okay / hungry / sleepy / dirty / grumpy) and picks the face and the idle animation.

**Actions:**
- **Feed:** a menu of foods. Basic food is free. Treats cost coins and give more happiness. A full cat refuses food.
- **Pet:** tap the cat to see a purr animation and get a small happiness boost, limited per minute.
- **Clean:** clear the litter box (it fills over time) to raise cleanliness.
- **Sleep:** turn the lights off. The screen dims, the cat sleeps, and energy rises. The cat wakes when the lights go back on.
- **Play:** launches Fish Catch.

**Growth:** stage depends on real days since adoption. Kitten for days 0–2, young cat for days 3–6, adult from day 7. Each stage has its own sprite. Reaching a new stage shows a short celebration.

**Reasons to come back (so day 2 isn't boring):**
- Coins come from care actions and from Fish Catch.
- A small **shop** sells accessories (collar colors, 2–3 hats), toys and 2–3 room decorations. Bought items show on the cat or in the room and in the snapshot.
- A **daily gift** on the first visit each day, plus a care streak counter.
- Growth milestones on days 3 and 7.
- Random idle behaviors (stretch, yawn, chase its tail) so the cat feels alive.

**Snapshot card:** draws the cat with its accessories, room, name, age and mood into a PNG. On phones it uses the Web Share API, and elsewhere it falls back to a download.

**First run:** pick a name and the kitten appears. No other setup.

## File layout
```
index.html
src/main.js            – boot, game loop, wiring
src/config.js          – decay rates, prices, stage days (all tunable numbers)
src/state.js           – create / load / save / apply elapsed time
src/rules.js           – pure functions: actions, mood, growth stage, coins, streak
src/render/canvas.js   – draw sprites, room, animations
src/render/sprites.js  – pixel grids + palettes per stage, mood, accessory
src/ui.js              – buttons, menus, stat bars, shop, settings
src/minigame/fish.js   – Fish Catch
src/snapshot.js        – card image + share/download
src/sound.js           – WebAudio blips, mute state
src/i18n/{index,en,vi}.js – text lookup + language switch
styles.css
tests/rules.test.js, tests/state.test.js, tests/i18n.test.js
```
Keep the game logic (`rules.js`, `state.js`) as pure functions with no DOM, so it is easy to test.

## Build order
1. Scaffold the Vite project, add Vitest, add the spec at `docs/superpowers/specs/2026-11-08-pixel-cat-design.md` (this design), and commit. → verify: `npm run dev` serves a blank page and `npm test` runs.
2. `config.js` + `state.js` + `rules.js` written test-first: decay, the offline catch-up (3 days away leaves stats low but at least 0), mood, growth stage, actions, coins and streak. → verify: tests pass.
3. i18n with en/vi and a test that both languages have the same keys. → verify: test passes.
4. Sprites and canvas rendering: a kitten idle animation, mood faces, the room. → verify in the browser.
5. UI: stat bars, the action buttons, the naming screen, sleep dimming, settings (language, sound, reset). Phone-first layout. → verify at 375px width and on desktop.
6. Fish Catch mini-game (touch + mouse). → verify on a phone-size viewport.
7. Shop, accessories, daily gift, streak. Growth stage sprites and the celebration.
8. Snapshot card and sharing. Sound with mute (off by default).
9. Final pass: polish, mobile check, `npm run build`. Offer a Vercel deploy (only on the user's go-ahead).

## Verification
- `npm test`: all logic tests pass (decay, offline catch-up, never below 0, growth stage on day boundaries, actions, i18n key parity).
- `npm run dev`, then use the app in the browser at phone width (375×667) and desktop width. Name a cat, feed, pet, clean, sleep, play Fish Catch, buy an item, switch language, make a snapshot.
- Simulate time away by editing the saved `lastSeen` in localStorage to 3 days ago and reloading. The cat should look hungry and grumpy and recover with care.
- Confirm no sound plays until it is turned on.
- `npm run build` succeeds.

## Left to the builder
Exact decay numbers, sprite designs, palette, prices, item list (within the sizes above), and animation timing.
