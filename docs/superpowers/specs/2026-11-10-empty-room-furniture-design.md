# Empty room, useful furniture, angry cats, Mouse Catch

## Why
Today a new player gets a fully furnished room on day one, and shop items only look nice. The user wants a sense of **building a home from nothing**: you adopt a cat into a shabby, empty room, earn coins with mini games, and buy furniture and better cat gear. Each piece helps the cat a little over time. If the player neglects the cat, it gets angry and breaks things, and the player pays to repair them. The game is not released yet, so old saves can simply be wiped.

## What the user decided
- **Start:** the first cat moves into an old, plain room with almost nothing in it.
- **Starting coins:** just enough to buy the basic cat supplies.
- **Furniture and better cat gear give lasting help:** each item makes one stat (or more) better over time, depending on the item.
- **Angry cat:** when a stat drops low enough, the cat gets angry, wrecks things, and items become **broken**.
- **Broken items stay in the room, look broken, and cost coins to repair.**
- **New mini game: Mouse Catch** (mice pop out of holes, tap them). Fish Catch stays.
- **Fresh start for everyone:** old saves are deleted, including trophies and stickers. The game is not released yet.

## My calls (the user can override these)
All numbers live in `src/config.js` so they are easy to tune.

### The empty room
- The wall and floor look old: faded, a few cracks and stains. Window, curtains and clock stay (they show time and weather).
- Sofa, bookshelf, cat tree, lamp and bed are **no longer always drawn**. They become shop items.
- Seasonal decorations that sat on the bookshelf (Christmas tree, etc.) move to a spot that is always there (window sill or wall), or are only drawn when the bookshelf is owned. Builder's choice, as long as seasons still show in an empty room.
- Wallpaper and floor shop items replace the old look, as now.

### Basic supplies
- **Bowl (5 coins), litter box (10), old cushion (10).** Start coins: **25**, exactly enough.
- They are needed for actions: no bowl → Feed says "buy a bowl first"; no litter box → Clean says the same; no cushion → the cat can still sleep (on the floor), so the player is never stuck.
- After adoption, a short hint points the player to the shop to buy the basics.
- Basic supplies **never break**, so the player can always feed and clean.

### Lasting help from items
- An item lowers how fast one or more stats drop. Example: cat tree = happiness drops 15% slower.
- Bonuses for the same stat add up, but **at most 40% slower** per stat.
- Only owned, **unbroken** items count. Help is shared by all cats in the room.
- Help applies in `applyElapsed` (time away) and during live play, the same way.
- The shop row shows the help in a short line, e.g. "😊 −15%".

Proposed list (prices are a first guess):

| Item | Kind | Price | Help |
|---|---|---|---|
| Bowl | basic | 5 | needed to feed |
| Litter box | basic | 10 | needed to clean |
| Old cushion | basic | 10 | sleep spot |
| Cat tree | cat gear | 40 | happiness 15% slower |
| Soft bed | cat gear | 45 | energy 15% slower |
| Auto feeder | cat gear | 60 | hunger 15% slower |
| Self-cleaning litter box | cat gear | 70 | cleanliness 15% slower |
| Sofa | furniture | 50 | happiness 10% slower |
| Bookshelf | furniture | 35 | happiness 5% slower |
| Lamp | furniture | 25 | energy 5% slower |
| Plant, rug, frame, fairy lights, beanbag, fishbowl (existing decor) | decor | as now | 5% slower on one stat each (rug, beanbag: energy; plant, frame, lights, fishbowl: happiness) |
| Yarn, toy mouse (existing toys) | toy | as now | happiness 5% slower |

Hats, collars, wallpaper and floors stay cosmetic (no help, never break).

- Upgrades (soft bed, auto feeder, self-cleaning litter box) sit next to the basic item in the room; the basic item stays.
- Cats only walk, sit or sleep on furniture spots (sofa, cat tree, bed, beanbag) when that item is owned and not broken. This uses the existing `needs` field on spots in `src/render/layout.js`.

### Angry cat
- A cat is **angry** when any of its stats is **below 10**. The face/mood shows it (reuse "grumpy" look plus a small anger mark).
- When a cat becomes angry it breaks **1 random working item** that can break (not basics, not hats/collars/wallpaper/floor). While it stays angry, it breaks **1 more every 6 hours**. Several angry cats each break things.
- This runs inside `applyElapsed`, so it also happens while the page is closed. The builder works out, from the stat drop rates, when each cat crossed below 10 during the away time.
- Coming back after a break shows a message naming what was broken ("Miu scratched the sofa!").
- A broken item: drawn with scratch marks / tilted, gives no help, cats don't use its spot.
- **Repair costs half the price** (rounded up), from the shop row ("Repair 25").
- If nothing breakable is left, nothing happens.

### Mouse Catch
- New file `src/minigame/mouse.js`, same shape as `fish.js` (`runMouseGame(canvas, { seconds, onTick, onCatch, onEnd })`).
- 30 seconds, 3×3 holes in a wall. Mice pop up for a short time; tap to catch. Pop-ups get a bit faster over time.
- Normal mouse +1 coin, golden mouse (about 1 in 8) +3, yarn ball pops up sometimes: tapping it −1 (score never below 0).
- Costs energy and gives happiness exactly like Fish Catch (reuse the same rule, e.g. rename `finishFishGame` to a shared `finishMiniGame(state, coins)`).
- The **Play** button opens a small choice: Fish Catch or Mouse Catch.
- New counter `mouse` for tasks/stickers: one daily task "catch 10 mice" and one sticker "catch 50 mice".

### Fresh start
- Raise `SAVE_VERSION` to 3. `loadState` drops any save that isn't version 3, so everyone sees the adoption screen. Remove the version-1 upgrade code.
- New state fields: `broken: []` (item ids). Basic supplies are normal `owned` ids.

### Other things to keep working
- Contest room pictures and snapshot cards draw the room from the state, so they show empty rooms and broken items too. `src/contestRoom.js` only sends items from certain slots (`DECOR`): add the new basic, cat-gear and furniture slots, and send `broken` too (the server must accept and check it the same way). Old test entries already stored for the contest may look empty; that is fine before release.
- Stickers like "shopper" and "decorator" still work. Add translations (English and Vietnamese) for every new text.
- Tests (Vitest) for: stat help and the 40% cap, broken items give no help, angry cat breaks items over time away (including the 6-hour repeat and "nothing left"), repair price and coins, feed/clean blocked without basics, old saves dropped, Mouse Catch scoring rule.

## Not doing
- No new stats, no cat running away or dying.
- No moving furniture around the room.
- No other new mini games (laser, boxes, memory) for now.

## Left to the builder
- Pixel art for the new items and broken versions, and the old-room look.
- Exact positions in the room, as long as items don't overlap and cats can still walk.
- Mouse Catch timing and art details.
