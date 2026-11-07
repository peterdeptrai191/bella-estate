# Chơi online (multiplayer)

Chạy giống Bella Poker: **toàn bộ trên Vercel**, không cần server riêng.

## Kiến trúc

- **Một Vercel Function** `api/estate.js` (sinh tự động từ `src/online/` bằng `npm run build:api`, đừng sửa tay) + **Upstash Redis** lưu trạng thái phòng.
- Client **hỏi server đều đặn** (polling ~1 giây trong ván, 1,5 giây ở phòng chờ, 4 giây khi tab bị ẩn) để nhận state + event mới. Event đi vào `gameStore` nên animation phát như chơi offline.
- **Không có tiến trình chạy liên tục.** Mỗi lần có người hỏi server hoặc gửi ý định, `tick(room, now)` cho ván chạy tới thời điểm hiện tại: bot đi, hết 20 giây thì tự hành động, ghép nhanh quá 30 giây thì thêm bot. Vì vậy cần ít nhất một người còn mở trang thì ván mới chạy tiếp (giống Bella Poker).
- **Server-authoritative:** client chỉ gửi ý định; `playerId` gán theo khóa bí mật của ghế; mọi action đi qua `applyAction` của game-core. Xúc xắc/thẻ dùng số ngẫu nhiên crypto của server; state gửi cho client không kèm trạng thái RNG.
- **Ghi an toàn khi bấm cùng lúc:** đọc → sửa → ghi kiểu so-sánh-rồi-ghi (Lua trên Redis), thử lại nếu có người ghi trước.
- **Mất kết nối:** quá 8 giây không thấy người chơi hỏi server thì bot chơi thay; quay lại trong 60 giây thì nhận lại toàn bộ ván (kể cả khi tải lại trang); quá 60 giây thì ghế giao hẳn cho bot.

File chính:

- `src/net/protocol.ts` — kiểu dữ liệu, hằng số (30 giây, 60 giây, nhịp polling…).
- `src/online/room.ts` — logic phòng thuần (JSON), có test bằng thời gian giả.
- `src/online/handler.ts` — API một endpoint (`create`, `join`, `quick`, `start`, `intent`, `leave`, poll bằng GET).
- `src/online/store.ts` — Redis (Upstash REST) hoặc bộ nhớ.
- `src/online/vercel.ts` → bundle thành `api/estate.js`.
- `src/store/net.ts` — client: tạo/vào phòng, polling, tự vào lại.

## Tài khoản

- Cùng endpoint `/api/estate`: `register`, `login`, `me`, `logout`, `rename` (`src/online/auth.ts`).
- Redis: `estate:user:<tên>` (hồ sơ + mật khẩu băm scrypt), `estate:session:<khóa>` → tên (30 ngày), `estate:user-room:<tên>` → mã phòng đang chơi (6 giờ).
- Vào phòng kèm `auth` thì ghế gắn với tài khoản (`clientId = user-<tên>`), nên đăng nhập ở máy khác rồi vào lại phòng là nhận đúng ghế.

## Chạy trên máy

`npm run dev` — dev server tự phục vụ `/api/estate` và lưu phòng trong bộ nhớ (mất khi tắt). Mở 2 tab (1 tab thường + 1 tab ẩn danh) → "Chơi cùng bạn" → tạo phòng ở tab này, nhập mã ở tab kia.

## Deploy trên Vercel

1. Vercel → project **bella-estate** → **Storage** (hoặc Marketplace) → tạo **Upstash Redis** (gói Free), vùng **Singapore** cho gần Việt Nam → **Connect** vào project cho Production và Preview. Vercel tự thêm `KV_REST_API_URL` và `KV_REST_API_TOKEN` (hoặc `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`; dùng tên nào cũng được). Không đặt tiền tố `VITE_` cho các biến này.
2. **Redeploy**.
3. Kiểm tra: mở `https://<tên-miền>/api/estate?op=health` phải thấy `"storage":"redis"`. Nếu thấy `"unconfigured"` là chưa nối Redis.

Biến `VITE_SERVER_URL` của cách cũ (server Colyseus) không còn dùng, xóa đi cũng được.

## Chi phí

Mỗi lần hỏi server tốn khoảng 1–2 lệnh Redis. Một ván 4 người 20 phút cỡ vài nghìn đến hơn chục nghìn lệnh. Gói Free của Upstash đủ cho chơi thử với bạn bè; chơi nhiều thì theo dõi số lệnh trong trang Upstash.
