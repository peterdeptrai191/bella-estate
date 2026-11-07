# GDD: Bella Estate — game cờ tỷ phú 3D

> Phiên bản 0.1. Các con số kinh tế là giá trị khởi điểm, sẽ cân bằng lại sau khi chơi thử.

## 1. Tổng quan

| Mục | Nội dung |
| --- | --- |
| Thể loại | Board game chiến thuật kinh tế, cờ tỷ phú |
| Người chơi | 2–4 (người hoặc bot) |
| Thời lượng một ván | 15–25 phút |
| Nền tảng | Web (desktop và mobile browser), sau này đóng gói thành app |
| Góc nhìn | 3D isometric, camera cố định, low-poly, màu tươi, bóng đổ mềm |
| Đối tượng | Casual 16–35 tuổi, thích chơi nhanh với bạn bè |
| Monetization | IAP (vật phẩm trang trí) và IAA (rewarded ads) |

Điểm khác biệt so với cờ tỷ phú cổ điển: ván ngắn, có cơ chế mua lại đất của đối thủ và nhiều cách thắng sớm, giúp ván đấu luôn kịch tính.

## 2. Vòng lặp lượt chơi (core loop)

1. Tung 2 xúc xắc rồi di chuyển quân cờ.
2. Xử lý ô vừa dừng: mua, trả tiền thuê, mua lại, rút thẻ…
3. Xây nhà nếu đứng trên đất của mình.
4. Kết thúc lượt.

**Luật xúc xắc:**

- Tung ra đôi (hai mặt giống nhau): được tung thêm một lần.
- Ra đôi 3 lần liên tiếp: bị đưa thẳng ra Đảo Hoang.
- Mỗi lượt có giới hạn 20 giây. Hết giờ thì hệ thống tự tung hoặc tự chọn bỏ qua.

## 3. Bàn cờ: 32 ô

### 4 ô góc

| Ô | Chức năng |
| --- | --- |
| Xuất Phát | Mỗi lần đi qua nhận +200. Dừng đúng ô này được xây thêm 1 nhà miễn phí lên một đất bất kỳ của mình |
| Đảo Hoang | Bị kẹt tối đa 3 lượt. Thoát ra bằng cách tung được đôi, trả 100, hoặc dùng thẻ "Ra Đảo" |
| Lễ Hội | Chọn một thành phố của mình, tiền thuê thành phố đó x2 cho đến khi có người tổ chức lễ hội ở chỗ khác |
| Sân Bay | Lượt sau được bay tới bất kỳ ô nào (tốn 100) |

### 28 ô còn lại

- 20 ô Thành phố: chia 7 nhóm màu (6 nhóm 3 ô và 1 nhóm cao cấp 2 ô)
- 4 ô Khu Du Lịch: không xây nhà được, tiền thuê tăng theo số khu du lịch đang sở hữu
- 3 ô Cơ Hội: rút thẻ ngẫu nhiên
- 1 ô Thuế: nộp 10% tổng tài sản

Mỗi cạnh bàn cờ gồm 1 góc và 7 ô, xen kẽ thành phố, khu du lịch và ô đặc biệt.

### Nội dung 32 ô: chủ đề "Vòng quanh thế giới"

Giá thành phố tăng dần theo chiều đi, mỗi nhóm màu là một khu vực. Mỗi cạnh có 5 thành phố, 1 khu du lịch và 1 ô đặc biệt, nên "độc quyền một cạnh" khó nhưng vẫn khả thi. Dữ liệu nằm ở `src/config/board.ts`.

| # | Ô | Loại | # | Ô | Loại |
| --- | --- | --- | --- | --- | --- |
| 0 | Xuất Phát | Góc | 16 | Lễ Hội Thế Giới | Góc |
| 1 | Cairo | Nhóm 1 | 17 | Istanbul | Nhóm 4 |
| 2 | Nairobi | Nhóm 1 | 18 | Dubai | Nhóm 4 |
| 3 | Cơ Hội | Đặc biệt | 19 | Thượng Hải | Nhóm 5 |
| 4 | Cape Town | Nhóm 1 | 20 | Santorini | Khu du lịch |
| 5 | Vịnh Hạ Long | Khu du lịch | 21 | Seoul | Nhóm 5 |
| 6 | Jakarta | Nhóm 2 | 22 | Cơ Hội | Đặc biệt |
| 7 | Bangkok | Nhóm 2 | 23 | Tokyo | Nhóm 5 |
| 8 | Đảo Hoang | Góc | 24 | Sân Bay Quốc Tế | Góc |
| 9 | Hà Nội | Nhóm 2 | 25 | Rome | Nhóm 6 |
| 10 | Lima | Nhóm 3 | 26 | Berlin | Nhóm 6 |
| 11 | Buenos Aires | Nhóm 3 | 27 | Paris | Nhóm 6 |
| 12 | Maldives | Khu du lịch | 28 | Hawaii | Khu du lịch |
| 13 | Rio de Janeiro | Nhóm 3 | 29 | London | Nhóm 7 |
| 14 | Cơ Hội | Đặc biệt | 30 | Thuế Tài Sản | Đặc biệt |
| 15 | Doha | Nhóm 4 | 31 | New York | Nhóm 7 |

| Nhóm | Khu vực | Màu | Giá | Thành phố (Landmark) |
| --- | --- | --- | --- | --- |
| 1 | Châu Phi | #C9A27E | 60 | Cairo (Kim Tự Tháp Giza), Nairobi (Công viên Safari), Cape Town (Núi Bàn) |
| 2 | Đông Nam Á | #8FD3E8 | 100 | Jakarta (Đài tưởng niệm Monas), Bangkok (Chùa Wat Arun), Hà Nội (Tháp Rùa – Hồ Gươm) |
| 3 | Nam Mỹ | #F4A7C0 | 140 | Lima (Quảng trường Plaza Mayor), Buenos Aires (Đài Obelisco), Rio de Janeiro (Tượng Chúa Cứu Thế) |
| 4 | Trung Đông | #F7B267 | 180 | Doha (Bảo tàng Nghệ thuật Hồi giáo), Istanbul (Hagia Sophia), Dubai (Tháp Burj Khalifa) |
| 5 | Đông Á | #EF6F6C | 220 | Thượng Hải (Tháp Minh Châu Phương Đông), Seoul (Tháp N Seoul), Tokyo (Tháp Tokyo) |
| 6 | Châu Âu | #F9D56E | 260 | Rome (Đấu trường Colosseum), Berlin (Cổng Brandenburg), Paris (Tháp Eiffel) |
| 7 | Biểu tượng toàn cầu | #5B7FDB | 320 | London (Tháp đồng hồ Big Ben), New York (Tượng Nữ thần Tự do) |

4 Khu Du Lịch (giá 200, màu xanh ngọc #4FC3A1): Vịnh Hạ Long, Maldives, Santorini, Hawaii. Mô tả ngắn của từng ô nằm trong `board.ts`.

## 4. Kinh tế

Tiền khởi đầu: **1.500**

### Giá đất theo nhóm (P)

| Nhóm | Số ô | Giá đất P |
| --- | --- | --- |
| 1 (Nâu) | 3 | 60 |
| 2 (Xanh nhạt) | 3 | 100 |
| 3 (Hồng) | 3 | 140 |
| 4 (Cam) | 3 | 180 |
| 5 (Đỏ) | 3 | 220 |
| 6 (Vàng) | 3 | 260 |
| 7 (Xanh đậm, cao cấp) | 2 | 320 |

### Xây dựng và tiền thuê (tính theo P)

| Cấp độ | Chi phí xây | Tiền thuê |
| --- | --- | --- |
| Đất trống | P (giá mua) | 0,2P |
| 1 nhà | 0,5P | 0,6P |
| 2 nhà | 0,5P | 1,2P |
| 3 nhà | 0,5P | 2P |
| Landmark | 1P (cần có đủ 3 nhà) | 3P |

- Vòng đầu (chưa đi qua Xuất Phát lần nào): mỗi thành phố tối đa 2 nhà; từ vòng 2 tối đa 3 nhà. Mỗi lần dừng xây được nhiều nhà một lúc, không cần đủ bộ màu.
- Landmark: ô đã có 3 nhà thì lần dừng sau mới xây được; không mua thẳng Landmark ở lần mua đầu.
- Sở hữu trọn một nhóm màu thì tiền thuê mọi ô trong nhóm x2.
- Landmark không thể bị mua lại.

### Khu Du Lịch (giá 200)

| Số khu sở hữu | 1 | 2 | 3 | 4 |
| --- | --- | --- | --- | --- |
| Tiền thuê | 50 | 100 | 200 | 400 |

### Cơ chế mua lại (điểm nhấn chính)

Khi dừng trên đất của đối thủ, sau khi trả tiền thuê, người chơi được quyền mua lại ô đó với giá 2 lần tổng giá trị đã đầu tư (đất cộng nhà). Chủ cũ nhận toàn bộ số tiền này. Không áp dụng với Landmark và Khu Du Lịch.

### Thiếu tiền

Bắt buộc bán nhà hoặc đất cho ngân hàng với giá 50% giá trị. Bán hết mà vẫn không đủ thì phá sản.

## 5. Điều kiện thắng

- Người sống sót cuối cùng: tất cả người chơi khác phá sản.
- Độc quyền 3 nhóm màu: thắng ngay lập tức.
- Độc quyền một cạnh bàn cờ: sở hữu mọi ô mua được trên một cạnh, thắng ngay.
- Độc quyền 4 Khu Du Lịch: thắng ngay.
- Hết giới hạn 30 vòng: người có tổng tài sản cao nhất thắng.

## 6. Thẻ Cơ Hội (bản đầu: 10 loại)

| Thẻ | Hiệu ứng |
| --- | --- |
| Ra Đảo | Giữ lại, dùng để thoát Đảo Hoang |
| Giảm Giá | Lần trả tiền thuê tiếp theo giảm 50% |
| Lá Chắn | Miễn trả tiền thuê một lần |
| Về Xuất Phát | Di chuyển ngay tới ô Xuất Phát (nhận +200) |
| Đi Lễ Hội | Di chuyển tới ô Lễ Hội |
| Động Đất | Phá 1 nhà của một đối thủ tùy chọn (không áp dụng với Landmark) |
| Ra Đảo Ngay | Bị đưa ra Đảo Hoang |
| Thuế Bất Ngờ | Nộp 100 cho mỗi căn nhà đang sở hữu |
| Từ Thiện | Trả 50 cho mỗi người chơi khác |
| Trúng Xổ Số | Nhận 200 |

## 7. Bot AI

- **Dễ:** mua ngẫu nhiên khoảng 60% số ô gặp, ít khi xây nhà.
- **Thường:** ưu tiên gom trọn nhóm màu, luôn giữ lại ít nhất 200 tiền mặt.
- **Khó:** tính kỳ vọng tiền thuê, chủ động chặn đối thủ sắp hoàn thành nhóm màu hoặc cạnh bàn cờ, dùng mua lại một cách chiến thuật.

## 8. Giao diện và cảm giác

**Phong cách hình ảnh:**

- Isometric, camera cố định ở góc khoảng 45°, có zoom nhẹ vào quân cờ đang di chuyển
- Low-poly, màu pastel bão hòa, viền bo tròn
- Ánh sáng chiếu chéo, bóng đổ mềm, có ambient occlusion
- Nhà và Landmark "mọc" lên với hiệu ứng nảy, kèm tiền bay khi trả tiền thuê

**Các màn hình:**

- **Trang chủ:** Chơi nhanh, Chơi với bot, Tạo phòng, Cửa hàng, Hồ sơ
- **Sảnh chờ:** chọn quân cờ, đợi người chơi vào phòng
- **Trong trận:** bàn cờ ở giữa, 4 khung người chơi ở 4 góc (avatar, tiền, đồng hồ lượt), nút Tung xúc xắc
- **Popup:** Mua đất, Xây nhà, Mua lại, Thẻ cơ hội, Bán tài sản
- **Kết quả:** xếp hạng, phần thưởng, nút xem quảng cáo để nhân đôi thưởng
- **Cửa hàng:** skin và gói vàng

**Âm thanh:** tiếng xúc xắc, tiếng xu, nhạc nền nhẹ nhàng.

## 9. Tiến trình người chơi (meta)

- **Vàng:** nhận sau mỗi trận (thắng 100, thua 30), dùng mua skin cơ bản
- **Kim cương:** tiền tệ cao cấp, chỉ có qua IAP
- **Cấp độ (XP):** mở khóa avatar và khung avatar
- **Nhiệm vụ hằng ngày:** 3 nhiệm vụ, ví dụ "Xây 5 nhà", "Thắng 1 trận"

## 10. Monetization

**Nguyên tắc:** không pay-to-win trong PvP. Mọi thứ trả phí trong trận đấu với người thật chỉ mang tính trang trí.

**IAP:**

- Skin quân cờ, xúc xắc, theme bàn cờ, hiệu ứng xây nhà và Landmark
- Gói kim cương
- Battle pass theo mùa (giai đoạn sau)

**IAA:**

- Rewarded: x2 vàng sau trận, quay thưởng hằng ngày, nhận thêm 1 nhiệm vụ
- Interstitial: tối đa 1 lần mỗi 2 trận, không chèn giữa trận, có thể tắt bằng gói "Không quảng cáo"

## 11. Phạm vi theo giai đoạn

| Giai đoạn | Nội dung |
| --- | --- |
| MVP | Luật đầy đủ, bàn cờ 3D, chơi với 1–3 bot, offline |
| v1.0 | Multiplayer online (phòng riêng và ghép trận nhanh), tài khoản, cửa hàng skin |
| v1.x | Nhiệm vụ, xếp hạng, battle pass, sự kiện |

Ngoài phạm vi MVP: chat, bạn bè, giải đấu, giao dịch đất giữa người chơi.

## 12. Chỉ số theo dõi (KPI)

- Retention D1, D7, D30
- Độ dài trận trung bình (mục tiêu 15–25 phút), tỷ lệ bỏ trận giữa chừng
- Phân bổ các điều kiện thắng, dùng để cân bằng game
- Tỷ lệ xem rewarded ad trên DAU, ARPDAU, tỷ lệ chuyển đổi IAP

## 13. Câu hỏi còn mở

- ~~Tên thành phố~~: đã chốt dùng tên thật, chủ đề "Vòng quanh thế giới" (mục 3).
- Có cho phép trao đổi đất giữa người chơi không?
- Ván chơi với bot có dùng chung kinh tế vàng với PvP không?
- Mục tiêu cuối là chỉ web hay đóng gói app lên store?
