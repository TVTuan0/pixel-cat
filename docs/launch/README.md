# Launch kit

Everything needed to post Pixel Cat on itch.io, Reddit and TikTok. Posting is done by hand. Nothing here posts on its own.

Live game: https://pixel-cat-green.vercel.app

## Images

| File | Use |
|------|-----|
| `images/cover.png` | itch.io cover image (630×500) |
| `images/1-room.png` | Screenshot: a lived-in room |
| `images/2-adopt.png` | Screenshot: choosing fur when adopting |
| `images/3-tasks.png` | Screenshot: daily tasks and sticker book |
| `images/4-seasons.png` | Screenshot: seasonal decorations (Tết, Mid-Autumn, Halloween, Christmas) |
| `../../public/og.png` | Link preview picture (1200×630), already used by the site |

For a video, open the game, tap **Share → Video clip**. It records a 6-second vertical clip, ready for TikTok or Reels.

## itch.io

1. Run `npm run build:itch`. Then zip **the contents** of the `dist-itch` folder, so `index.html` is at the top of the zip (on Windows: open the folder, select everything, right-click → Send to → Compressed folder).
2. On itch.io: **Create new project**.
   - Kind of project: **HTML**
   - Upload the zip, tick **This file will be played in the browser**
   - Viewport: **400 × 760**, tick **Mobile friendly** and **Fullscreen button**
   - Classification: **Games**, genre **Simulation**
   - Tags: `cats`, `virtual-pet`, `pixel-art`, `cozy`, `cute`, `relaxing`, `idle`, `mobile`
   - Pricing: **No payments** (or "donations")
3. Cover image and screenshots: from the table above.

Note: a cat adopted on itch.io lives separately from one adopted on the main site. They are different websites, so each keeps its own save.

### Page text (English)

> **Pixel Cat** – a cozy pixel kitten that lives in your browser.
>
> Adopt a kitten, pick its fur and give it a name. Feed it, pet it, clean its litter box and turn off the lights at bedtime. It walks around its room, naps on the sofa and climbs its cat tree.
>
> Come back every day: your cat grows from kitten to adult, you get a daily gift and new daily tasks, and there are 12 stickers to collect. Play Fish Catch to earn coins for hats, collars, toys, wallpapers and furniture.
>
> The weather outside changes daily, the clock shows your real time, and the room decorates itself for Tết, Mid-Autumn, Halloween and Christmas.
>
> Works on phones and computers, in English and Vietnamese. No sign-up, no ads.

### Page text (Vietnamese)

> **Pixel Cat** – bé mèo pixel đáng yêu sống ngay trong trình duyệt.
>
> Nhận nuôi mèo con, chọn màu lông và đặt tên. Cho mèo ăn, vuốt ve, dọn hộp cát và tắt đèn khi tới giờ ngủ. Mèo tự đi dạo trong phòng, ngủ trên sofa và leo trụ cào.
>
> Ghé chơi mỗi ngày: mèo lớn dần từ mèo con thành mèo lớn, có quà mỗi ngày, nhiệm vụ mới mỗi ngày và 12 nhãn dán để sưu tầm. Chơi Bắt Cá để kiếm xu mua mũ, vòng cổ, đồ chơi, giấy dán tường và nội thất.
>
> Thời tiết ngoài cửa sổ đổi theo ngày, đồng hồ chạy theo giờ thật, và căn phòng tự trang trí dịp Tết, Trung Thu, Halloween và Giáng Sinh.
>
> Chơi được trên điện thoại và máy tính, có tiếng Việt và tiếng Anh. Không cần đăng ký, không quảng cáo.

## Reddit

Good places: r/WebGames, r/incremental_games (as a "cozy idle" game), r/IndieGaming, r/cats (only with a cute clip, and read each subreddit's rules first). Post with a clip or `1-room.png`.

> **I made a tiny pixel cat you can raise in your browser**
>
> No sign-up, works on phones. Your kitten walks around its room, grows up over a week, and the room decorates itself for holidays. There's a little fish-catching game to earn hats and furniture.
>
> https://pixel-cat-green.vercel.app
>
> I'd love feedback on what would make you come back tomorrow.

## TikTok / Reels / Facebook

Record clips in the game (**Share → Video clip**). Ideas that work well:

- "Day 1 vs Day 7": a kitten clip, then the grown-up cat in a decorated room.
- Room makeover: a plain room, then the same room fully decorated.
- "My cat's Tết room" during the season, when the lanterns and apricot blossom appear.
- Lights off at bedtime: the cat walks to its bed and curls up.

Caption idea: `Nuôi mèo pixel mỗi ngày 🐱 link ở bio · pixel-cat-green.vercel.app #pixelart #meo #cozygames`

## Measuring

Counting is off until a GoatCounter code is set. To turn it on:

1. Make a free account at https://www.goatcounter.com and pick a code (for example `pixelcat`).
2. In Vercel: project **pixel-cat** → Settings → Environment Variables → add `VITE_GOATCOUNTER_CODE` = your code, for **Production**.
3. Deploy again. Visits and these events then show in GoatCounter: `adopt`, `return_day2`, `return_day7`, `share_card`, `clip`, `invite`, `install`, `fish_game`, `task_done`, `sticker`, `buy_<item>`.

The day-2 and day-7 returns compared with `adopt` show how many players come back.
