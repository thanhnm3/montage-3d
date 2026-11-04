# Caveman Economics Short: "A home now costs 5 years of income" (ink-3D, no narrator on screen)

2026-11-04. Comp `remotion-composer/projects/caveman-houseyears-3d/HouseYears.tsx` (`HouseYears`); worker sheet: `HostTest`.
Replaces the "rich man's house" idea (kept in `caveman-richhouse-3d/` for reference). User's direction: real estate,
modern day only, no caveman, no host/narrator character; open on an exhausted office worker with bloodshot eyes.

## Script (EN, voiced; ~105 words, ~36-40 s)
| # | Role | Line | VI |
|---|---|---|---|
| 01 | HOOK | A home now costs 5 years of income. Every single dollar you earn. | Giờ một căn nhà tốn 5 năm thu nhập. Từng đồng bạn kiếm được. |
| 02 | | Not savings. Your household's entire income, for 5 years straight. | Không phải tiền tiết kiệm. Toàn bộ thu nhập cả nhà, 5 năm liền. |
| 03 | source + keyword | Harvard tracks this. It's called the home price to income ratio. | Harvard theo dõi chỉ số này: tỉ lệ giá nhà trên thu nhập. |
| 04 | | In the 1990s it sat around 3. Three years of income, long called affordable. | Thập niên 1990 nó quanh 3. Ba năm thu nhập, mức lâu nay coi là vừa túi tiền. |
| 05 | TURN | The 2005 bubble pushed it to a record. The crash dragged it back near 3. | Bong bóng 2005 đẩy lên kỷ lục. Cú sập kéo về gần 3. |
| 06 | | Then prices climbed again, year after year. | Rồi giá lại leo, năm này qua năm khác. |
| 07 | | In 2024 the median home hit 412,500 dollars. 5 times income. A tie with the bubble. | 2024 nhà trung vị chạm 412.500 đô. Gấp 5 thu nhập. Ngang thời bong bóng. |
| 08 | CTA | Follow for the real price of everyday life. | Theo dõi để biết giá thật của cuộc sống. |
| 09 | PAYOFF + LOOP | So keep those eyes open. The house is 5 years away. | Vậy thì mở to mắt ra. Căn nhà còn cách 5 năm. |

Unit everywhere: median home price / median household income (Harvard JCHS price-to-income ratio). Only that series.

## Sources
- JCHS, "Home Prices Surge to Five Times Median Income, Nearing Historic Highs": 2024 ratio 5.0, tying 2005; median
  existing single-family price $412,500 (NAR). https://www.jchs.harvard.edu/blog/home-prices-surge-five-times-median-income-nearing-historic-highs
- JCHS State of the Nation's Housing 2025 press release. https://www.jchs.harvard.edu/sites/default/files/interactive-item/files/Harvard_JCHS_State_of_the_Nations_Housing_2025_Press_Release.pdf
- 1990s average ~3.2 (State of the Nation's Housing 2026, via Enterprise). https://www.enterprisecommunity.org/story/five-key-takeaways-2026-state-nations-housing-report
- 2011 ~3.3, 2005 = highest since 1980 (JCHS). https://www.jchs.harvard.edu/blog/price-to-income-ratios-are-nearing-historic-highs
- "3 is traditionally considered affordable" (Daniel McCue, JCHS, first link).
Caveat: under JCHS's older method 2005 was 4.7, under the current one 5.0; the script says "a record" without a number.
jchs.harvard.edu is not reachable from the cloud container: checked through search results / coverage of JCHS.

## Visuals
- Office (night, monitor light): the worker (toon.ts card, seated, white shirt + loosened red tie, new `bloodshot` /
  `bloodshot_shock` faces: pink whites, red veins, purple bags). Hook pushes in to his eyes; beat 2 time-lapse: cups
  pile up, clock spins. CTA cranes up; payoff closes on the eyes and ends on the hook's first frame (loop).
- Stage (warm beige): a house whose ridge = the price, a tower of cash bricks (1 brick = 1 year of income), a dashed
  red price line, a ruler. Tower: 0→5 in the hook, 3.2 (1990s, AFFORDABLE), up to the record (red, wobbling), CRASH
  (bricks fly off) → 3.3, climbing with a year counter, 2024 = 5 with the $412,500 tag, "5× INCOME", "= 2005 BUBBLE".
- HUD top-left: era + ratio. Karaoke at y 1660.
Preview (estimated timing): `artifacts/preview_sheet_est.jpg`.

## Publish (draft)
Titles: "A House Now Costs 5 Years of Income" / "Your House Costs 5 Years of Your Life" / "Why a Home Costs 5 Years of Salary Now"
Description: A home now costs 5 years of income, by Harvard's home price to income ratio. In the 1990s it was about 3.
#housingcrisis #realestate #economics

## On the PC
1. Chirp voice from `scenes/dialog.txt` into `D:/youtube/tts/episodes/caveman-economics/shorts/2026-11-04-house-5-years`
   (`voice_post.py` reads `episode_audio_r03.wav` there; rename or edit).
2. `scenes/voice_post.py` → `scenes/build.py` → `artifacts/props.json` (warns on a missing anchor).
3. Bundle with `--public-dir=../projects/caveman-houseyears-3d/public`;
   `npx remotion render <bundle> HouseYears out.mp4 --props=../projects/caveman-houseyears-3d/artifacts/props.json --gl=angle --crf=16`.
4. Music (YouTube Audio Library) under the voice.
