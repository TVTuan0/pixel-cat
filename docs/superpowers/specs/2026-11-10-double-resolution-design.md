# Double-resolution pixel art

## Why
The game draws everything on a 160×120 grid and blows it up, so a cat is about 20 pixels wide and looks chunky next to the reference pictures in `D:\projects\image` (room.png, cats.png). The user wants the art redrawn at twice the resolution (320×240) so cats, furniture and the garden can show real detail: fur, eyes, shading, wood grain.

## What the user decided
- Redraw at **double resolution (320×240)** (option 1 of three offered), knowing it is a big job done in several rounds.
- Keep the current straight-on view of the room (decided earlier).
- Keep the style of the reference pictures: warm, shaded pixel art with soft shadows.
- Not to cut the reference pictures into the game (cancelled earlier); everything is drawn in code.

## My calls (the user can override these)
### Game logic stays on the 160×120 grid
All rules, spots where cats walk, item positions, taps, presents, contest rooms and the test panel keep using "room units" on the 160×120 grid. Only drawing changes:
- The room canvas becomes 320×240. `drawScene` scales the context by 2, so 1 room unit = 2 screen pixels.
- Existing drawing code keeps working and looks exactly the same.
- New, detailed art draws at **half-unit precision** (x, y, w, h in steps of 0.5), which lands on real pixels. Sprites can be defined at half size (`cell: 0.5`) the same way.
- All coordinates must stay on multiples of 0.5 so pixels stay sharp (no blur). Image smoothing stays off.

### Every place that draws a scene uses the same size
The main room, the adopt preview, contest pictures, snapshot cards and video clips all get the 320×240 size from one constant (`RES = 2`), so they all look the same.

### Rounds (each one ships on its own and can be deployed)
1. **Groundwork:** 320×240 canvases everywhere, half-unit drawing support, no visible change.
2. **Cats:** front (sitting, lying/sleeping, itching) and side (walking, jumping, crouching, leaping, scratching) for all 6 stages and 8 furs, with the breed details (tabby stripes, calico patches, tuxedo bib, Siamese points), hats and collars. Eyes with highlights, fur shading, whiskers, soft shadows.
3. **Room:** walls and wallpapers, floors, window with town, curtains, clock, door, every furniture item and its broken look, basic items, dirt and presents.
4. **Garden:** sky, clouds, weather, fence, house, grass, tree, flowers, butterflies.
5. **Small effects:** hearts, zzz, anger mark, sparkles, bug, arrow.

Out of scope: the mini game screens (Fish Catch, Mouse Catch) and shop icons stay as they are.

### How each round is checked
- All tests pass, the build works.
- Screenshots of every redrawn thing, at phone and computer size, compared with the round before (nothing missing or misplaced).
- A play-through with the test panel (adopt, buy everything, break things, garden, sleep) shows no page errors.

## Not doing
- No change to how the game plays.
- No isometric view.
- No images from the reference pictures inside the game.

## Left to the builder
- The exact pixel art, as long as it keeps the warm shaded style and every item stays recognizable and the same size and place as now.
