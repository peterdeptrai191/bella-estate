# Bella Estate — hướng dẫn cho Claude

## Mục tiêu game

**Bella Estate** — game cờ tỷ phú 3D chạy trên web, bàn cờ chủ đề "Vòng quanh thế giới" (desktop + mobile browser), 2–4 người chơi (người hoặc bot), ván ngắn 15–25 phút. Bàn cờ 32 ô, góc nhìn isometric cố định, low-poly, màu pastel, bóng đổ mềm. Điểm nhấn: **mua lại đất của đối thủ** và **nhiều cách thắng sớm** (độc quyền 3 nhóm màu, một cạnh bàn cờ, hoặc 4 khu du lịch). Kiếm tiền bằng IAP trang trí + rewarded ads, không pay-to-win.

MVP: luật đầy đủ, bàn cờ 3D, chơi offline với 1–3 bot. Multiplayer online ở v1.0.

**Luật chơi chi tiết, bảng kinh tế, thẻ Cơ Hội, bot AI, màn hình: xem `docs/GDD.md`.** Đó là nguồn sự thật duy nhất về luật chơi — đọc nó trước khi viết logic game, và đừng tự bịa luật. Nếu GDD chưa rõ, hỏi lại thay vì đoán.

## Stack

- Vite + React + TypeScript (strict)
- React Three Fiber + @react-three/drei cho 3D
- Zustand cho state
- Tailwind CSS v4 (qua `@tailwindcss/vite`) cho UI 2D
- Vitest cho test

Lệnh: `npm run dev` · `npm test` · `npm run typecheck` · `npm run build` · `npm run lint`

## Cấu trúc & quy tắc kiến trúc

```
src/
  game-core/  Luật chơi — TypeScript THUẦN
  config/     Hằng số kinh tế, dữ liệu bàn cờ, thông số đồ họa — dữ liệu THUẦN
  store/      Zustand store: nối game-core với UI/scene
  scene/      Mọi thứ 3D (R3F) + event player (scene/events)
  ui/         Giao diện 2D: HUD, popup, màn hình
  audio/      Phát âm thanh (Web Audio)
  net/        Giao thức client ↔ server (chỉ kiểu dữ liệu + hằng số)
  online/     Logic phòng online + API (chạy trên Vercel Function, dùng game-core)
api/estate.js Vercel Function — SINH TỰ ĐỘNG từ src/online bằng `npm run build:api`, đừng sửa tay
docs/GDD.md   Game design document
docs/MULTIPLAYER.md  Kiến trúc online + cách deploy
```

Hướng phụ thuộc chỉ đi một chiều:

```
ui, scene  →  store  →  game-core  →  config
online     →  game-core, config, net   (không import React/Three/store/ui/scene)
```

1. **`game-core` là TypeScript thuần.** Không import React, Three.js, Zustand, `ui/`, `scene/`, `store/`, không dùng DOM/`window`/`localStorage`. Mục đích: sau này chạy y nguyên trên server multiplayer. Được phép import `config/`.
2. **`config` là dữ liệu thuần.** Chỉ số, chuỗi, mảng/object. Không tạo object Three.js (màu là chuỗi hex, vị trí là tuple số).
3. **Luật chơi chỉ nằm trong `game-core`.** Store, UI và scene không tự tính tiền thuê, không tự quyết thắng thua — chúng gọi hàm của game-core và hiển thị kết quả.
4. **game-core xử lý trạng thái theo kiểu hàm thuần:** `(state, action) → state mới`, không mutate state đầu vào. Ngẫu nhiên (xúc xắc, thẻ) phải đi qua RNG truyền vào được (seed) để test tái lập được và server có thể kiểm tra.
5. **Không hardcode số kinh tế** trong code — lấy từ `src/config/economy.ts` (và dữ liệu bàn cờ trong `config/`).
6. `src/game-core/architecture.test.ts` kiểm tra tự động quy tắc 1–2. Đừng sửa test này để lách luật.

## game-core API

- `createGame(players, seed)` → `GameState`. `applyAction(state, action)` → `{ state, events }`; action sai luật ném `GameRuleError`.
- Mỗi action có `playerId`; chỉ người đang tới lượt được hành động. Lượt đi qua các bước `turn.step`: `ROLL` → `MOVE` → `ACT` → `END_TURN`. Việc bắt buộc (trả thuê, rút thẻ, trả nợ, Động Đất) nằm ở `turn.pending` và chặn `END_TURN`.
- `events` là nguồn để UI chạy animation. Không suy luận animation bằng cách so sánh state.
- `getLegalActions(state)` cho UI bật/tắt nút và cho bot. `getTimeoutAction(state)` dùng khi hết giờ lượt.
- Các chỗ GDD chưa rõ đã được quyết định ở `docs/RULES-DECISIONS.md`. Đổi luật thì cập nhật file đó.
- `npm run simulate -- --seed 42` chạy giả lập một ván và in log, dùng để kiểm tra luật bằng mắt.
- Bot AI: `chooseBotAction(state, level)` (`game-core/bot.ts`), 3 mức Dễ/Thường/Khó của GDD §7, hàm thuần (mức Dễ lấy "ngẫu nhiên" từ trạng thái RNG trong state). Thông số ở `config/bots.ts`.
- Nhịp lượt dùng chung cho client offline và server: `humanPrompt(state, playerId)` (người chơi cần quyết định gì) và `autoAction(state, isHuman, botLevel)` (việc tự làm) ở `game-core/flow.ts`.
- Hàm tính giá trị (`rentFor`, `buyoutPrice`, `sellValue`…) nhận `Ownership` (chỉ cần `tiles` + `festivalTile`) nên UI gọi được trên view đang hiển thị.

## Scene 3D

- Mọi thông số hình ảnh (màu, đèn, camera, kích thước ô, độ bo, AO…) nằm ở `src/config/visual.ts`. Không hardcode số hình ảnh trong component. Thêm thông số mới vào đó thì bảng leva tự có thêm thanh trượt.
- Component đọc thông số qua `useVisual()` (`src/store/visualStore.ts`), không import `VISUAL` trực tiếp, để bảng leva chỉnh được trực tiếp.
- Bảng leva (`src/ui/dev/VisualTuner.tsx`) chỉ nạp khi `import.meta.env.DEV`, không vào bản build.
- Canvas vẽ liên tục (có animation nhân vật, camera bám). Nếu sau này chuyển về `frameloop="demand"` để tiết kiệm pin thì mọi chỗ sửa trực tiếp object three phải gọi `invalidate()` (CameraRig, Lights đã có sẵn).
- Bóng: `shadows="percentage"` (PCFShadowMap + `shadow.radius`). Three r180+ đã bỏ PCFSoftShadowMap.
- Bố cục bàn cờ, chỗ đứng quân cờ, khung camera là toán thuần ở `src/scene/boardLayout.ts`; hướng xúc xắc ở `diceMath.ts` (có test).
- Asset (Kenney, CC0) ở `public/models/` và `public/sounds/`. Bảng âm thanh: `src/config/audio.ts`.

## Animation: event player

- game-core KHÔNG chờ animation. `gameStore.dispatch` cập nhật state ngay và đẩy `events` vào hàng đợi `animationStore`.
- `scene/events/EventPlayer.tsx` phát lần lượt từng event qua `eventPlayer.ts` (mỗi handler trả Promise: chạy animation + âm thanh rồi áp event lên view).
- Màn hình (quân cờ, chủ đất, nhà, tiền trên HUD) đọc **view** (`store/boardView.ts`), không đọc thẳng state game-core, nên luôn đi cùng animation. View chỉ đổi qua reducer thuần `applyEventToView`; `boardView.test.ts` bảo đảm phát hết event thì view khớp state game-core. Thêm event mới thì cập nhật reducer này.
- Xúc xắc: kết quả lấy từ event, animation chỉ diễn lại (không physics). Điều khiển bằng lệnh nằm ở `*Control.ts` (diceControl, pieceControl, fxControl, cameraControl).
- Thời lượng/biên độ mọi animation ở `visual.ts › animation`.
- Chế độ dev: `window.__bella` mở các store ra console (đẩy event mẫu: `__bella.animation.getState().enqueue([...])`).

## Giao diện 2D và điều phối ván

- Màn hình: `uiStore.screen` = `home` | `bots` | `friends` | `lobby` | `shop` | `maps` | `game`. Menu ở `ui/screens/` trên nền xanh `LandingBg` (trang chủ là landing page cuộn được, theo video tham khảo); bàn cờ 3D chỉ dựng khi `screen === 'game'`. Trong trận là `ui/Hud.tsx`. Bắt đầu/chơi lại/thoát: `ui/matchSetup.ts`.
- Thương hiệu: logo game Bella Estate và logo nhà phát hành Bella Game Studio ở `public/brand/` (đã tách nền). Mở game có màn hình giới thiệu nhà phát hành (`StudioSplash`).
- `gameStore` có 2 chế độ: `offline` (áp action ngay, bot chạy ở `store/matchDriver.ts`) và `online` (gửi ý định lên server qua `store/net.ts`, polling HTTP; state/event chỉ đến từ server). `seats` giữ tên, skin, người/bot, kết nối của từng ghế.
- `store/match.ts` (thuần, có test): `levelOptions` / `previewAfter` thử chính reducer để biết xây được tới cấp nào và giá bao nhiêu. Không viết luật mới ở đây.
- `store/matchDriver.ts` (chỉ offline): khi hàng đợi animation trống thì gửi action tự động sau một nhịp (`visual.ts › animation.botThinkDelay`), hoặc bật đồng hồ 20 giây (`ECONOMY.turnTimeLimitSec`) và hết giờ thì gửi `getTimeoutAction`. Online thì server làm việc này.
- `store/uiStore.ts`: trạng thái thuần giao diện (màn hình, ô đang xem, chế độ chọn ô trên bàn cờ, chữ lớn, thẻ đang lật, đồng hồ).
- Skin quân cờ: `config/skins.ts` (model + ảnh chân dung + giá Vàng). Hồ sơ người chơi (tên, skin, Vàng, skin đã mua) ở `store/profileStore.ts`, lưu localStorage vì chưa có tài khoản. Thưởng sau trận theo GDD §9 (`META` trong `config/skins.ts`).
- `ui/Hud.tsx` ghép mọi thứ; popup ở `ui/popups/`, khung người chơi + lớp prompt ở `ui/hud/`. Popup chỉ hiện khi animation đã xong. Nút gửi action qua `ui/act.ts`.
- Sau khi tung: số điểm nổi trên xúc xắc (`scene/DiceTotal.tsx`) và viền vàng ô sẽ dừng (`scene/TargetFrame.tsx`), lấy từ `uiStore.diceShown` / `targetTile` do eventPlayer đặt. Nút Tung xúc xắc nằm dưới xúc xắc giữa bàn cờ, theo toạ độ `uiStore.boardCenter` (`scene/BoardCenterTracker.tsx`). Khung người chơi có dải tài sản (đất, số nhà, thẻ đang giữ — `heldCards`/`rentDiscount` trong view). Nút ? mở `ui/popups/HelpPopup.tsx` (số lấy từ `ECONOMY`).
- Chọn ô trên bàn cờ 3D: popup gọi `useBoardPick({ tiles, onPick })`; `Board`/`Tile` tô sáng ô chọn được, bấm ô thì gọi `onPick`. Không ở chế độ chọn thì bấm ô mở `TileInfo`.
- Phong cách: chữ Baloo 2, nút nổi khối `btn-3d btn-blue|green|pink|yellow|gray`, khung `Modal` (ruy băng + giấy xếp chồng) trong `ui/kit.tsx`. Cỡ chữ gốc co theo khung hình (`index.css`) nên mọi kích thước dùng `rem`. Giao diện chơi được cả ngang lẫn dọc (biến thể `portrait:` của Tailwind, cỡ chữ gốc theo chiều ngang khi cầm dọc).
- Dev: nút "Bot chơi thay" ở thanh trên; `__bella.ui.setState({ turnTimeScale: 100 })` kéo dài đồng hồ lượt; `__bella.newMatch(seed)` mở ván với 3 bot; `__bella.menu()` về trang chủ.

## Chơi online (`src/online/`, giống Bella Poker)

- Chạy hoàn toàn trên Vercel: Function `api/estate.js` + Upstash Redis + client polling. Không có tiến trình chạy liên tục: mỗi lần client hỏi server, `tick(room, now)` cho ván chạy tới hiện tại (bot, hết giờ, lấp bot).
- Server-authoritative: client gửi ý định, server gán `playerId` theo khóa ghế, kiểm tra bằng `applyAction`, trả state (bỏ trạng thái RNG) + event. RNG crypto thay vào trước mỗi action.
- `room.ts` là logic thuần trên JSON; `handler.ts` là API; `store.ts` là Redis/bộ nhớ; `vercel.ts` bundle thành `api/estate.js`. Sửa bất cứ file nào trong `src/online/` (hoặc game-core/config) thì chạy `npm run build:api` — có test bắt lỗi nếu bundle cũ. `npm run build` cũng tự bundle.
- Phòng riêng: chủ phòng chọn số vòng (`GameState.maxRounds`); phòng đủ người / đã bắt đầu thì người vào bằng mã thành người xem (`room.spectators`, `lobby.spectating`).
- Tài khoản: `src/online/auth.ts` (đăng ký/đăng nhập/phiên, cùng kho Redis), client `store/authStore.ts` + `ui/AccountModal.tsx`; đã đăng nhập thì ghế gắn với tài khoản, nút "Vào lại" ở `ui/ResumeGameBanner.tsx`.
- `npm run dev` tự phục vụ `/api/estate` (lưu bộ nhớ). Chi tiết + deploy: `docs/MULTIPLAYER.md`. Các lựa chọn khi yêu cầu chưa rõ ghi ở `docs/RULES-DECISIONS.md` mục "Chơi online".

## Quy ước code

- TypeScript strict, không dùng `any` (dùng `unknown` + thu hẹp kiểu nếu cần).
- Dùng named export; chỉ `App.tsx` dùng default export.
- Tên file: component React `PascalCase.tsx`; module thường `camelCase.ts`; test đặt cạnh file: `foo.test.ts`.
- Định danh trong code bằng tiếng Anh; comment và nội dung hiển thị cho người chơi có thể bằng tiếng Việt.
- Mọi luật mới trong game-core phải có test Vitest đi kèm.
- UI 2D dùng Tailwind class, đặt đè lên canvas; lớp phủ không cần click thì để `pointer-events-none`.
- Trước khi coi là xong: `npm run typecheck`, `npm test` và `npm run lint` đều phải qua; sửa `src/online/` thì chạy thêm `npm run build:api`.
- Làm theo từng phase được giao; không tự làm trước tính năng của phase sau.
