# Bella Estate

Game cờ tỷ phú 3D chạy trên web, chủ đề "Vòng quanh thế giới" — React Three Fiber, Zustand, Tailwind; chơi online qua server Colyseus.

```bash
npm install
npm run dev        # dev server
npm test           # Vitest
npm run typecheck
npm run simulate -- --seed 42   # giả lập 1 ván 4 người, in log
npm run build

# Chơi online (cần chạy server ở cửa sổ khác)
npm run server:install   # lần đầu
npm run server           # ws://localhost:2567
npm run test:server
```

Chơi online khi đã deploy: xem [docs/MULTIPLAYER.md](docs/MULTIPLAYER.md).

- Luật chơi: [docs/GDD.md](docs/GDD.md)
- Quy tắc kiến trúc & quy ước code: [CLAUDE.md](CLAUDE.md)

## Asset

Model 3D và âm thanh của [Kenney](https://kenney.nl) (CC0): Mini Characters, Cube Pets, City Kit Suburban, Interface Sounds. Giấy phép đi kèm trong `public/models/*/LICENSE.txt` và `public/sounds/LICENSE.txt`. Ảnh chân dung trong `public/avatars/` được chụp từ chính các model Mini Characters.

Chữ: [Baloo 2](https://fonts.google.com/specimen/Baloo+2) (SIL Open Font License), qua gói `@fontsource/baloo-2`.
