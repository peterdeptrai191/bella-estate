# Bella Monopoly — hướng dẫn cho Claude

## Mục tiêu game

Game cờ tỷ phú 3D chạy trên web (desktop + mobile browser), 2–4 người chơi (người hoặc bot), ván ngắn 15–25 phút. Bàn cờ 32 ô, góc nhìn isometric cố định, low-poly, màu pastel, bóng đổ mềm. Điểm nhấn: **mua lại đất của đối thủ** và **nhiều cách thắng sớm** (độc quyền 3 nhóm màu, một cạnh bàn cờ, hoặc 4 khu du lịch). Kiếm tiền bằng IAP trang trí + rewarded ads, không pay-to-win.

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
  scene/      Mọi thứ 3D (R3F)
  ui/         Giao diện 2D: HUD, popup, màn hình
docs/GDD.md   Game design document
```

Hướng phụ thuộc chỉ đi một chiều:

```
ui, scene  →  store  →  game-core  →  config
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

## Quy ước code

- TypeScript strict, không dùng `any` (dùng `unknown` + thu hẹp kiểu nếu cần).
- Dùng named export; chỉ `App.tsx` dùng default export.
- Tên file: component React `PascalCase.tsx`; module thường `camelCase.ts`; test đặt cạnh file: `foo.test.ts`.
- Định danh trong code bằng tiếng Anh; comment và nội dung hiển thị cho người chơi có thể bằng tiếng Việt.
- Mọi luật mới trong game-core phải có test Vitest đi kèm.
- UI 2D dùng Tailwind class, đặt đè lên canvas; lớp phủ không cần click thì để `pointer-events-none`.
- Trước khi coi là xong: `npm run typecheck`, `npm test` và `npm run lint` đều phải qua.
- Làm theo từng phase được giao; không tự làm trước tính năng của phase sau.
