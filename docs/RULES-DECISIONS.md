# Quyết định luật chơi (bổ sung cho GDD v0.1)

Những điểm GDD chưa nói rõ, đã được chọn khi viết `src/game-core/`. Mỗi điểm đều có test. Muốn đổi thì sửa code + test tương ứng và cập nhật file này.

| # | Chủ đề | Cách đang làm | File test |
| --- | --- | --- | --- |
| 1 | Bố cục bàn cờ | Chủ đề "Vòng quanh thế giới" (GDD mục 3). Góc: 0 Xuất Phát, 8 Đảo Hoang, 16 Lễ Hội Thế Giới, 24 Sân Bay Quốc Tế. Mỗi cạnh 5 thành phố + 1 Khu Du Lịch + 1 ô đặc biệt (Cơ Hội ở ô 3, 14, 22; Thuế Tài Sản ở ô 30). Nhóm Đông Nam Á (6, 7, 9) và Trung Đông (15, 17, 18) nằm vắt qua góc. | `config/board.test.ts` |
| 2 | Xây trong một lần dừng | Mỗi lần dừng trên đất mình được xây liên tiếp nhiều nhà (đủ tiền là được). | `property.test.ts` |
| 3 | Landmark | Cần đủ 3 nhà, và **không** xây được trong cùng lần dừng vừa mua/mua lại ô. Phải dừng lại lần sau. | `property.test.ts` |
| 4 | Đảo Hoang | Dừng ở ô Đảo Hoang = bị kẹt (như bị đưa ra đảo). Sau 3 lần tung trượt thì lượt sau tự do. Thoát bằng đôi thì đi luôn nhưng **không** được tung thêm. | `island.test.ts` |
| 5 | Sân Bay | Lượt sau được chọn: bay (100) tới ô bất kỳ trừ Sân Bay, hoặc tung bình thường (mất vé). Dừng ở Sân Bay bằng đôi thì mất lượt tung thêm. Bay qua Xuất Phát vẫn +200. | `property.test.ts` |
| 6 | Lễ Hội | Tùy chọn, chỉ khi có ít nhất 1 thành phố. Lễ Hội đi theo ô khi ô bị mua lại; mất khi ô bị bán cho ngân hàng. | `property.test.ts` |
| 7 | Mua lại | Áp dụng cho cả Khu Du Lịch (2 × 200). Được mua lại cả khi dùng Lá Chắn miễn tiền thuê. | `property.test.ts`, `cards.test.ts` |
| 8 | Tổng tài sản | = tiền mặt + toàn bộ giá trị đã đầu tư (đất + nhà, giá gốc). Dùng cho ô Thuế (10%, làm tròn xuống) và xếp hạng khi hết vòng. | `valuation.test.ts` |
| 9 | Thuế Bất Ngờ | Landmark tính là 3 nhà. | `cards.test.ts` |
| 10 | Bán tài sản | Chỉ được bán khi đang thiếu tiền. Bán **nguyên ô** (đất + nhà) lấy 50% giá trị đầu tư, chưa có bán lẻ từng nhà. Đủ tiền thì tự trả nợ. | `debt.test.ts` |
| 11 | Phá sản | Toàn bộ tài sản bán cho ngân hàng 50%, chủ nợ nhận phần trả được, đất trả về ngân hàng (không chuyển cho chủ nợ). | `debt.test.ts` |
| 12 | Nhà miễn phí ở Xuất Phát | Chỉ +1 nhà (không lên Landmark). Áp dụng cả khi tới bằng thẻ "Về Xuất Phát". | `turn.test.ts`, `cards.test.ts` |
| 13 | Rút thẻ | Mỗi lần rút chọn ngẫu nhiên đều trong 10 loại (không dùng chồng bài). | `cards.test.ts` |
| 14 | Dùng thẻ | "Ra Đảo" và "Lá Chắn" người chơi chủ động dùng (`USE_CARD`). "Giảm Giá" tự áp vào lần trả thuê kế tiếp. | `cards.test.ts` |
| 15 | Động Đất | Phá **ngay trong lượt rút thẻ**: có mục tiêu (thành phố đối thủ có 1–3 nhà) thì bắt buộc chọn trước khi kết thúc lượt. Không có mục tiêu thì thẻ mất tác dụng và game báo "Đối thủ chưa có nhà để phá" (event `EARTHQUAKE_NO_TARGET`). | `cards.test.ts` |
| 16 | Hòa khi hết vòng | Bằng tổng tài sản thì ai nhiều tiền mặt hơn thắng. | `win.test.ts` |
| 17 | 3 nhóm màu | Nhóm cao cấp (2 ô) tính là một nhóm như các nhóm khác. | `win.test.ts` |
| 18 | Hết 20 giây | game-core không đếm giờ. `getTimeoutAction(state)` trả action mặc định (tự tung, tự trả, bỏ qua lựa chọn) để store/server gọi khi hết giờ. | `simulation.test.ts` |

## Ghi chú cân bằng (từ giả lập)

200 ván với người chơi chọn **ngẫu nhiên** (`npm run simulate`): ~94% kết thúc do hết 30 vòng, ~4% độc quyền Khu Du Lịch, ~1% độc quyền cạnh, ~1,5% sống sót cuối, chưa ván nào thắng bằng 3 nhóm màu. Người chơi ngẫu nhiên chơi kém nên số liệu chỉ để tham khảo, cần chạy lại khi có bot AI (GDD mục 7).

## Chơi online (`src/online/`)

Không phải luật chơi (luật vẫn chỉ ở game-core), nhưng là các lựa chọn khi yêu cầu chưa nói rõ:

| # | Chủ đề | Cách đang làm | File test |
| --- | --- | --- | --- |
| O1 | Phòng riêng | Chủ phòng chọn 2–4 người. Đủ người thì tự bắt đầu; chủ phòng (người tạo) bấm "Bắt đầu" sớm được khi đã có ít nhất 2 người, ván chơi với số người đang có (không thêm bot). | `src/online/online.test.ts` |
| O2 | Ghép nhanh | Bàn 4 ghế. Đủ 4 người thì bắt đầu ngay; quá 30 giây thì thêm bot (mức Thường) cho đủ 4 ghế, kể cả khi mới có 1 người. | như trên |
| O3 | Trùng tên / skin | Người vào sau trùng tên thì thêm số ("Bạn 2"); trùng skin thì đổi sang skin mặc định chưa ai dùng, để phân biệt quân. | như trên |
| O4 | Mất kết nối | Quá 8 giây không thấy người chơi hỏi server = mất kết nối: bot (mức Thường) chơi thay. Giữ chỗ 60 giây; quay lại thì nhận lại toàn bộ ván. Hết 60 giây hoặc tự thoát thì ghế giao hẳn cho bot đến hết ván. | như trên |
| O5 | Nhịp lượt | Không có tiến trình chạy liên tục (Vercel): ván chỉ chạy tiếp khi còn ít nhất một người mở trang. Server tự làm các bước hiển nhiên (đi quân, trả thuê khi không có Lá Chắn, kết thúc lượt khi không còn gì làm) và chờ đủ thời gian animation ước lượng trước khi cho bot đi tiếp / bắt đầu tính 20 giây của người chơi. | như trên |
| O6 | Ngẫu nhiên | Trước mỗi action server thay trạng thái RNG bằng số ngẫu nhiên thật (crypto); state gửi cho client không kèm trạng thái RNG. | như trên |
| O7 | Thưởng Vàng | Thắng +100, thua +30 (GDD mục 9), cả offline lẫn online, mỗi ván một lần. Chưa có tài khoản nên Vàng và skin lưu trong trình duyệt. | — |
