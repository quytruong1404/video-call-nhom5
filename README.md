# ỨNG DỤNG GỌI VIDEO TRỰC TUYẾN - NHÓM 5 (Nhoms5)

> **Bài tập trên lớp**: Xây dựng nhanh chức năng gọi video sử dụng API (LiveKit Cloud SDK), xác thực mạng xã hội (Google / GitHub) trước khi tham gia, hiển thị danh sách người tham gia theo tên đăng nhập và triển khai (deploy) lên Vercel.

---

## 👥 THÔNG TIN NHÓM THỰC HIỆN
- **Tên nhóm**: **Nhóm 5 (Nhoms5)**
- **Danh sách thành viên**:
  1. **Trương Đàm Công Quý**
  2. **Tạ Thanh Tấn**
- **Môn học**: Kiến trúc & Thiết kế Phần mềm / Xây dựng phần mềm (XDPM)

---

## 🚀 TÍNH NĂNG NỔI BẬT ĐÁP ỨNG ĐỦ YÊU CẦU ĐỀ BÀI

1. **Gọi Video sử dụng API chuẩn công nghiệp**:
   - Tích hợp **LiveKit Cloud WebRTC SDK** (`livekit-server-sdk`, `@livekit/components-react`, `@livekit/components-styles`, `livekit-client`).
   - Hỗ trợ đầy đủ âm thanh, camera độ phân giải cao, chia sẻ màn hình, và trò chuyện trong phòng họp.
   - Tích hợp thêm **Chế độ WebRTC P2P Trực tiếp** cho phép giảng viên/bạn bè kiểm tra ngay lập tức mà không phụ thuộc vào API key bên thứ ba.

2. **Đăng nhập trước khi Join cuộc gọi**:
   - Bắt buộc đăng nhập trước khi được phép vào phòng họp.
   - Hỗ trợ OAuth mạng xã hội thực tế: **Google OAuth** & **GitHub OAuth** qua NextAuth (Auth.js v5).
   - Tích hợp **Chế độ Đăng nhập nhanh Demo** (1 chạm đăng nhập với tư cách thành viên Nhóm 5 hoặc tên tùy ý) giúp chấm bài cực nhanh và ổn định.

3. **Hiển thị danh sách người gọi theo tên đã nhận khi đăng nhập**:
   - Bảng danh sách người tham gia hiển thị rõ tên đầy đủ (Display Name) nhận từ tài khoản mạng xã hội.
   - Hiển thị trực quan:
     - Avatar đại diện.
     - Tên người dùng (`participant.name`).
     - Trạng thái Microphone (Bật/Tắt).
     - Trạng thái Camera (Bật/Tắt).
     - Hiệu ứng sóng âm khi người đó đang nói chuyện (Active Speaker Detection).

4. **Trang chủ hiển thị rõ ràng thông tin Nhóm 5**:
   - Tên nhóm **Nhóm 5 (Nhoms5)** và danh sách thành viên **Trương Đàm Công Quý**, **Tạ Thanh Tấn** được đóng khung nổi bật ngay trên cùng của giao diện.

---

## 🛠️ HƯỚNG DẪN CÀI ĐẶT & CHẠY LOCAL

### 1. Cài đặt thư viện:
```bash
npm install
```

### 2. Thiết lập cấu hình môi trường:
Tạo file `.env.local` từ mẫu `.env.example`:
```env
AUTH_SECRET="nhom5_super_secret_jwt_key_xdpm_2026_vercel"
NEXTAUTH_URL="http://localhost:3000"

# Cấu hình LiveKit Cloud API (Nếu có):
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
```

### 3. Chạy ứng dụng:
```bash
npm run dev
```
Truy cập: [http://localhost:3000](http://localhost:3000)

---

## 🌐 HƯỚNG DẪN DEPLOY LÊN VERCEL (3 BƯỚC)

### Cách 1: Deploy qua GitHub & Vercel Dashboard (Khuyên dùng)
1. **Đẩy mã nguồn lên GitHub**:
   ```bash
   git init
   git add .
   git commit -m "feat: Nhom 5 video call app with LiveKit & Social Login"
   git branch -M main
   git remote add origin https://github.com/<tai-khoan-cua-ban>/video-call-nhom5.git
   git push -u origin main
   ```
2. **Import vào Vercel**:
   - Truy cập [vercel.com](https://vercel.com) và đăng nhập.
   - Nhấn **"Add New..."** -> **"Project"**.
   - Chọn kho lưu trữ `video-call-nhom5` vừa push.
3. **Cấu hình Environment Variables (Tùy chọn)**:
   - Thêm `AUTH_SECRET` (ví dụ: `nhom5_secret_key_2026`).
   - Thêm `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `NEXT_PUBLIC_LIVEKIT_URL` (nếu dùng LiveKit Cloud).
   - Nhấn **Deploy**.
   - Sau 1 phút, bạn sẽ nhận được đường link Vercel chính thức (ví dụ: `https://video-call-nhom5.vercel.app`) để gửi vào nhóm lớp!

### Cách 2: Deploy bằng Vercel CLI
```bash
npx vercel
```
Làm theo các hướng dẫn trên màn hình và chọn Deploy Production:
```bash
npx vercel --prod
```

---

## 🔑 HƯỚNG DẪN LẤY API KEY LIVEKIT CLOUD MIỄN PHÍ (1 PHÚT)
1. Truy cập [cloud.livekit.io](https://cloud.livekit.io) và đăng ký tài khoản miễn phí bằng Google hoặc GitHub (không cần thẻ tín dụng).
2. Tạo một Project mới (đặt tên ví dụ: `Nhom5-Call`).
3. Vào mục **Settings** -> **Keys**:
   - Sao chép **WebSocket URL** (`wss://xxx.livekit.cloud`) -> gán vào `NEXT_PUBLIC_LIVEKIT_URL`.
   - Sao chép **API Key** -> gán vào `LIVEKIT_API_KEY`.
   - Sao chép **API Secret** -> gán vào `LIVEKIT_API_SECRET`.
