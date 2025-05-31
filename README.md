# 💰 Sổ Thu Chi - Quản Lý Tài Chính Cá Nhân 💰

Ứng dụng web đơn giản giúp bạn theo dõi thu nhập và chi tiêu cá nhân một cách hiệu quả, được xây dựng với HTML, CSS, JavaScript và tích hợp Supabase làm backend.

## ✨ Tính Năng Nổi Bật

* **Theo Dõi Giao Dịch:** Dễ dàng thêm mới các giao dịch thu nhập hoặc chi tiêu.
* **Phân Loại Giao Dịch:** Gán danh mục cho từng giao dịch (ví dụ: Ăn uống, Di chuyển, Lương, Thưởng).
* **Lịch Sử Giao Dịch:** Xem lại toàn bộ lịch sử giao dịch, được sắp xếp theo thời gian.
* **Thống Kê Trực Quan:**
    * Tổng thu, tổng chi và số dư hiện tại (bao gồm số dư ban đầu).
    * Thống kê giao dịch theo các khoảng thời gian: Tháng này, 30 ngày qua, Năm nay, Toàn bộ.
    * Các chỉ số như: Tổng số giao dịch, Chi tiêu trung bình/ngày, Tổng thu/chi trong kỳ.
* **Biểu Đồ Thu Chi:** Biểu đồ đường trực quan so sánh thu nhập và chi tiêu qua 12 tháng gần nhất.
* **Tích Hợp Supabase:** Lưu trữ và quản lý dữ liệu an toàn trên Supabase.
* **Cập Nhật Real-time:** Các thay đổi dữ liệu (thêm, xóa giao dịch) được cập nhật gần như ngay lập tức trên các thiết bị khác đang mở ứng dụng.
* **Cấu Hình Linh Hoạt:** Cho phép người dùng tự cấu hình Supabase URL, Anon Key và số dư ban đầu.
* **Giao Diện Hiện Đại:** Thiết kế tối giản, dễ sử dụng với hiệu ứng động nhẹ nhàng.
* **Favicon Tùy Chỉnh:** Sử dụng icon `favicon.png` (hoặc icon nâng tạ như đã được yêu cầu thay thế trước đó).

## 🛠️ Công Nghệ Sử Dụng

* **Frontend:**
    * HTML5
    * CSS3 (với hiệu ứng rơi icon, gradient, và thiết kế responsive)
    * JavaScript (ES6+)
* **Backend & Cơ Sở Dữ Liệu:**
    * [Supabase](https://supabase.com/) (PostgreSQL)
* **Thư Viện JavaScript:**
    * [Chart.js](https://www.chartjs.org/) (Để vẽ biểu đồ)
    * Supabase Client Library (`@supabase/supabase-js`)

## 🚀 Hướng Dẫn Cài Đặt & Sử Dụng

### 1. Chuẩn Bị Supabase

Bạn cần có một tài khoản Supabase và một project đã được tạo.

1.  **Tạo Tài Khoản & Project:**
    * Truy cập [supabase.com](https://supabase.com) và đăng ký/đăng nhập.
    * Tạo một Project mới.

2.  **Lấy Supabase URL và Anon Key:**
    * Trong Dashboard của Project, đi đến **Project Settings** (Biểu tượng bánh răng) > **API**.
    * Bạn sẽ tìm thấy **Project URL** (chính là Supabase URL) và **Project API keys** (sử dụng key `anon` `public`).

3.  **Tạo Bảng `transactions`:**
    * Trong Supabase Studio, đi đến **SQL Editor**.
    * Tạo một "New query" và chạy đoạn SQL sau để tạo bảng lưu trữ giao dịch:

    ```sql
    -- Xóa bảng cũ nếu tồn tại để tránh lỗi khi chạy lại script
    DROP TABLE IF EXISTS transactions;

    CREATE TABLE transactions (
      id BIGSERIAL PRIMARY KEY,
      description TEXT NOT NULL,
      amount DECIMAL(15,2) NOT NULL,
      type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
      category VARCHAR(50),
      notes TEXT,
      transaction_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

    -- Chính sách này cho phép mọi thao tác, phù hợp cho demo.
    -- Đối với ứng dụng thực tế, bạn CẦN thiết lập Row Level Security (RLS) chặt chẽ hơn.
    CREATE POLICY "Allow all operations for demo" ON transactions
      FOR ALL
      USING (true)
      WITH CHECK (true);
    ```

    * **Lưu ý quan trọng:** Chính sách Row Level Security (RLS) ở trên là ví dụ đơn giản. Đối với ứng dụng thực tế, bạn cần cấu hình RLS cẩn thận hơn để đảm bảo bảo mật dữ liệu cho từng người dùng.

### 2. Chạy Ứng Dụng

1.  **Tải Mã Nguồn:** Clone repository này hoặc tải các file `index.html`, `style.css` (trong thư mục `static/css/`), `script.js` (trong thư mục `static/js/`) và `favicon.png` (trong thư mục `static/images/`) về máy của bạn.
2.  **Mở `index.html`:** Mở file `index.html` bằng trình duyệt web.
3.  **Cấu Hình Lần Đầu:**
    * Lần đầu tiên mở ứng dụng, bạn sẽ thấy mục "Cấu hình Supabase & Số dư ban đầu".
    * Nhập **Supabase URL** và **Supabase Anon Key** bạn đã lấy ở Bước 1.
    * Nhập **Số dư ban đầu** của bạn (ví dụ: số tiền bạn hiện có).
    * Nhấn nút "Lưu & Kết nối".
    * Nếu kết nối thành công, ứng dụng sẽ tải lại và bạn có thể bắt đầu sử dụng. Thông tin cấu hình sẽ được lưu trữ trong `localStorage` của trình duyệt cho những lần truy cập sau.

### 3. Sử Dụng Ứng Dụng

* **Thêm Giao Dịch:**
    * Điền thông tin vào form "Thêm giao dịch mới": Mô tả, Số tiền, Loại (Thu/Chi), Danh mục, Ngày & Giờ, Ghi chú (tùy chọn).
    * Nhấn nút "➕ Thêm giao dịch".
* **Xem Thống Kê:**
    * Số dư, tổng thu, tổng chi được cập nhật tự động.
    * Chọn khoảng thời gian trong mục "📊 Thống kê" để xem các số liệu chi tiết và biểu đồ thu chi.
* **Xem Lịch Sử Giao Dịch:**
    * Danh sách các giao dịch được hiển thị trong mục "📋 Lịch sử giao dịch".
    * Bạn có thể xóa giao dịch bằng cách nhấn vào biểu tượng thùng rác (🗑️).

## 📂 Cấu Trúc File
```
├── index.html               # File HTML chính của ứng dụng
├── static/
│   ├── css/
│   │   └── style.css        # File CSS cho giao diện và hiệu ứng
│   ├── js/
│   │   └── script.js        # File JavaScript xử lý logic ứng dụng
│   └── images/
│       └── favicon.png      # Icon hiển thị trên tab trình duyệt
└── README.md                # File bạn đang đọc
```
## 🔮 Ý Tưởng Phát Triển Thêm

* Hỗ trợ nhiều người dùng với xác thực Supabase Auth.
* Thiết lập Row Level Security (RLS) chi tiết hơn cho từng người dùng.
* Thêm tính năng sửa giao dịch.
* Tính năng đặt ngân sách (budget) cho các danh mục.
* Báo cáo chi tiết hơn, xuất dữ liệu ra CSV/Excel.
* Chế độ tối/sáng (Dark/Light mode) tự động hoặc tùy chỉnh.
* Tìm kiếm và lọc giao dịch nâng cao hơn.
* Đa ngôn ngữ.

---

Chúc bạn quản lý tài chính hiệu quả với Sổ Thu Chi!