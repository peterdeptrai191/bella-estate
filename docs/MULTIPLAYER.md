# Chơi online (multiplayer)

## Kiến trúc

- `server/` là một gói Node.js riêng chạy [Colyseus](https://colyseus.io) 0.16. Server import thẳng `src/game-core/` và là **nguồn sự thật duy nhất**: client chỉ gửi ý định (action không có `playerId`), server gán ghế, kiểm tra bằng `applyAction` rồi gửi state + event cho mọi người.
- Giao thức (tên tin nhắn, kiểu dữ liệu, hằng số như 30 giây ghép nhanh, 60 giây giữ chỗ) ở `src/net/protocol.ts`, dùng chung cho client và server.
- `server/src/MatchSession.ts`: logic một ván, không phụ thuộc Colyseus, test bằng đồng hồ giả (`MatchSession.test.ts`).
- `server/src/BellaRoom.ts`: lớp nối Colyseus (phòng riêng mã 6 ký tự, ghép nhanh, giữ chỗ khi mất kết nối).
- Client: `src/store/net.ts` (kết nối, tạo/vào phòng, tự vào lại khi mất mạng hoặc tải lại trang), `src/store/onlineStore.ts` (sảnh chờ). State từ server đi vào `gameStore` nên animation phát giống hệt chơi offline.

## Chạy trên máy

```bash
npm run server:install
npm run server          # ws://localhost:2567
npm run dev             # cửa sổ khác; client tự nối tới cổng 2567 trên cùng máy
```

Mở 2 tab (hoặc 1 tab thường + 1 tab ẩn danh) → "Chơi cùng bạn" → tạo phòng ở tab này, nhập mã ở tab kia.

## Deploy

Vercel chỉ chạy được phần web tĩnh, không giữ được kết nối WebSocket lâu dài, nên server cần một nơi khác (Render, Railway, Fly.io, VPS…).

**Server trên Render (nhanh nhất):** Render → New → Blueprint → chọn repo `bella-estate`. File `render.yaml` ở gốc repo đã khai báo sẵn mọi thứ bên dưới. Gói free sẽ ngủ sau ~15 phút không ai vào; người đầu tiên vào lại phải chờ khoảng 30–60 giây.

**Hoặc tạo tay (Render, loại Web Service):**

- Kết nối repo GitHub, để Root Directory trống (server cần đọc `src/` ở gốc repo).
- Build Command: `npm --prefix server ci`
- Start Command: `npm --prefix server start`
- Render tự đặt biến `PORT`. Kiểm tra: mở `https://<tên-dịch-vụ>.onrender.com/health` thấy `ok`.

**Web (Vercel):**

- Project Settings → Environment Variables: `VITE_SERVER_URL` = `wss://<tên-dịch-vụ>.onrender.com`
- Redeploy để bản build nhận biến mới.

Chưa đặt `VITE_SERVER_URL` thì chơi với bot vẫn bình thường; màn hình "Chơi cùng bạn" sẽ báo chưa cấu hình máy chủ.
