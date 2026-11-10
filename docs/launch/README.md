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
| `images/5-contest.png` | Screenshot: a "Which is cuter?" duel in the weekly contest |
| `images/6-contest-winners.png` | Screenshot: the contest screen with last week's winners |
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

Note: a cat adopted on itch.io lives separately from one adopted on the main site. They are different websites, so each keeps its own save. The weekly contest only runs on the main site, so the itch.io page text points players there.

### Page text (English)

> **Pixel Cat** – a cozy pixel kitten that lives in your browser.
>
> Adopt a kitten, pick its fur and give it a name. Feed it, pet it, clean its litter box and turn off the lights at bedtime. Your kitten moves into a shabby, empty room: play mini games to earn coins and turn it into a cozy home. Furniture and cat gear help your cat stay happy, but leave it hungry or bored too long and it gets angry and scratches things up.
>
> Come back every day: your cat grows from kitten to adult, and once it has grown a little you can adopt more kittens, up to 5 cats sharing one cozy room. You get a daily gift and new daily tasks, and there are 15 stickers to collect. Play Fish Catch and Mouse Catch to earn coins for furniture, toys, hats, collars and wallpapers.
>
> The weather outside changes daily, the clock shows your real time, and the room decorates itself for Tết, Mid-Autumn, Halloween and Christmas.
>
> **Weekly Cutest Room Contest:** enter your room and vote in "Which is cuter?" duels. The top 3 each week win a gold, silver or bronze trophy for their shelf. Join at pixel-cat-green.vercel.app.
>
> Works on phones and computers, in English and Vietnamese. No sign-up, no ads.

### Page text (Vietnamese)

> **Pixel Cat** – bé mèo pixel đáng yêu sống ngay trong trình duyệt.
>
> Nhận nuôi mèo con, chọn màu lông và đặt tên. Cho mèo ăn, vuốt ve, dọn hộp cát và tắt đèn khi tới giờ ngủ. Mèo dọn vào một căn phòng cũ trống trơn: chơi mini game kiếm xu để biến nó thành tổ ấm. Nội thất và đồ dùng giúp mèo luôn vui khỏe, nhưng để mèo đói hay buồn quá lâu thì mèo sẽ nổi giận và cào hỏng đồ.
>
> Ghé chơi mỗi ngày: mèo lớn dần từ mèo con thành mèo lớn, rồi bạn có thể nhận nuôi thêm, tối đa 5 bé mèo chung một căn phòng. Có quà mỗi ngày, nhiệm vụ mới mỗi ngày và 15 nhãn dán để sưu tầm. Chơi Bắt Cá và Bắt Chuột để kiếm xu mua nội thất, đồ chơi, mũ, vòng cổ và giấy dán tường.
>
> Thời tiết ngoài cửa sổ đổi theo ngày, đồng hồ chạy theo giờ thật, và căn phòng tự trang trí dịp Tết, Trung Thu, Halloween và Giáng Sinh.
>
> **Cuộc thi Phòng Mèo Dễ Thương mỗi tuần:** đăng ký phòng của bạn và bình chọn "Phòng nào dễ thương hơn?". Top 3 mỗi tuần nhận cúp vàng, bạc hoặc đồng đặt trên kệ. Tham gia tại pixel-cat-green.vercel.app.
>
> Chơi được trên điện thoại và máy tính, có tiếng Việt và tiếng Anh. Không cần đăng ký, không quảng cáo.

## Reddit

Good places: r/WebGames, r/incremental_games (as a "cozy idle" game), r/IndieGaming, r/cats (only with a cute clip, and read each subreddit's rules first). Post with a clip or `1-room.png`.

> **I made a tiny pixel cat you can raise in your browser**
>
> No sign-up, works on phones. Your kitten walks around its room, grows up over a week, and the room decorates itself for holidays. It starts in an empty room that you furnish with coins from little mini games (catch fish, catch mice), and a weekly contest where players vote for the cutest room.
>
> https://pixel-cat-green.vercel.app
>
> I'd love feedback on what would make you come back tomorrow.

## Weekly contest

The contest runs Monday to Sunday (UTC). In Vietnam that is Monday 7:00 to the next Monday 7:00. Duels need at least 3 rooms, because players never see their own, so ask a few friends to enter early each week. A simple weekly rhythm:

| When | Post | Image |
|------|------|-------|
| Monday | "New contest week! Enter your cat's room and vote for the cutest." | `5-contest.png` or a clip of your room |
| Thursday | "Halfway there – how many rooms can you judge?" | a duel screenshot |
| Sunday | "Last day to vote!" | a clip |
| Next Monday | "This week's winners" | a screenshot of the winners on the contest screen |

Post text, English:

> 🏆 **Cutest Room Contest is on!** Decorate your pixel cat's room, tap Enter, then vote in "Which is cuter?" duels. Top 3 win a trophy for their shelf. Ends Sunday. pixel-cat-green.vercel.app

Post text, Vietnamese:

> 🏆 **Cuộc thi Phòng Mèo Dễ Thương bắt đầu rồi!** Trang trí phòng cho mèo pixel, bấm Đăng ký rồi bình chọn "Phòng nào dễ thương hơn?". Top 3 nhận cúp đặt trên kệ. Kết thúc Chủ Nhật. pixel-cat-green.vercel.app

Only cat names and rooms are public. Players with a rude cat name show up as "Cat".

## TikTok / Reels / Facebook

Record clips in the game (**Share → Video clip**). Ideas that work well:

- "Day 1 vs Day 7": a kitten clip, then the grown-up cat in a decorated room.
- Room makeover: a plain room, then the same room fully decorated.
- "My cat's Tết room" during the season, when the lanterns and apricot blossom appear.
- Lights off at bedtime: the cat walks to its bed and curls up.
- Contest entry: "Vote for my room this week!", a clip of your decorated room with all your cats.
- Winners reveal: the trophy appearing on the shelf after a win.

Caption idea: `Nuôi mèo pixel mỗi ngày 🐱 link ở bio · pixel-cat-green.vercel.app #pixelart #meo #cozygames`

## Measuring

Counting is off until a GoatCounter code is set. To turn it on:

1. Make a free account at https://www.goatcounter.com and pick a code (for example `pixelcat`).
2. In Vercel: project **pixel-cat** → Settings → Environment Variables → add `VITE_GOATCOUNTER_CODE` = your code, for **Production**.
3. Deploy again. Visits and these events then show in GoatCounter: `adopt`, `return_day2`, `return_day7`, `share_card`, `clip`, `invite`, `install`, `fish_game`, `mouse_game`, `repair`, `task_done`, `sticker`, `buy_<item>`, `adopt_more` (a 2nd–5th cat), `contest_enter`, `contest_vote` (once per voting session), `contest_prize`.

The day-2 and day-7 returns compared with `adopt` show how many players come back. For the contest, `contest_enter` and `contest_vote` show how many players take part each week.
