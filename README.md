# Bella Estate

Game cờ tỷ phú 3D chạy trên web, chủ đề "Vòng quanh thế giới" — React Three Fiber, Zustand, Tailwind; chơi online chạy trên Vercel (Function + Upstash Redis), giống Bella Poker.

```bash
npm install
npm run dev        # dev server
npm test           # Vitest
npm run typecheck
npm run simulate -- --seed 42   # giả lập 1 ván 4 người, in log
npm run build
npm run build:api   # sau khi sửa src/online: bundle lại api/estate.js
```

`npm run dev` đã có sẵn API chơi online (lưu phòng trong bộ nhớ).

Chơi online khi đã deploy: xem [docs/MULTIPLAYER.md](docs/MULTIPLAYER.md).

- Luật chơi: [docs/GDD.md](docs/GDD.md)
- Quy tắc kiến trúc & quy ước code: [CLAUDE.md](CLAUDE.md)

## Asset

Logo Bella Estate và Bella Game Studio (`public/brand/`) là của Bella Game Studio, nhà phát hành game.


Model 3D và âm thanh của [Kenney](https://kenney.nl) (CC0): Mini Characters, Cube Pets, City Kit Suburban, Interface Sounds, Casino Audio, Impact Sounds. Giấy phép đi kèm trong `public/models/*/LICENSE.txt` và `public/sounds/LICENSE.txt`. Ảnh chân dung trong `public/avatars/` được chụp từ chính các model Mini Characters (dev: `scripts/avatar-render.html`). Skin "Tiền đạo Đỏ" là male-a tô lại bảng màu bằng `node scripts/make-skin-striker.mjs`.

Chữ: [Baloo 2](https://fonts.google.com/specimen/Baloo+2) (SIL Open Font License), qua gói `@fontsource/baloo-2`.
