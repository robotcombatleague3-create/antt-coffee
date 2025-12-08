-- File: db_mysql_converted.sql

DROP DATABASE IF EXISTS coffee_shop;
CREATE DATABASE coffee_shop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE coffee_shop;

-- 1. ACCOUNT
CREATE TABLE ACCOUNT (
    Acc_id          INT AUTO_INCREMENT      PRIMARY KEY,
    Email           VARCHAR(100)            NOT NULL UNIQUE,
    Username        VARCHAR(50)             NOT NULL UNIQUE,
    Password        VARCHAR(255)            NOT NULL,
    Join_date       DATETIME                DEFAULT CURRENT_TIMESTAMP
);

-- 2. CUSTOMER
CREATE TABLE CUSTOMER (
    Cus_id          INT AUTO_INCREMENT      PRIMARY KEY,
    F_name          VARCHAR(20)             NOT NULL,
    L_name          VARCHAR(40)             NOT NULL,
    Phone           VARCHAR(10)             NOT NULL UNIQUE,
    Points          INT                     DEFAULT 0,
    Acc_id          INT                     UNIQUE,
    Level VARCHAR(20) GENERATED ALWAYS AS (
        CASE
            WHEN Points < 200 THEN 'Bronze'
            WHEN Points >= 200 AND Points < 500 THEN 'Silver'
            WHEN Points >= 500 AND Points < 1000 THEN 'Gold'
            ELSE 'Diamond'
        END
    ) STORED,
    CONSTRAINT FK_Cus_Account FOREIGN KEY (Acc_id) REFERENCES ACCOUNT(Acc_id)
);

-- 3. STAFF
CREATE TABLE STAFF (
    Staff_id        INT AUTO_INCREMENT      PRIMARY KEY,
    F_name          VARCHAR(20)             NOT NULL,
    L_name          VARCHAR(40)             NOT NULL,
    Acc_id          INT                     NOT NULL UNIQUE,
    CONSTRAINT FK_Staff_Account FOREIGN KEY (Acc_id) REFERENCES ACCOUNT(Acc_id)
);

-- 4. CATEGORY (Tạo trước để ITEM tham chiếu)
CREATE TABLE CATEGORY (
    Cate_id         INT AUTO_INCREMENT      PRIMARY KEY,
    Cate_name       VARCHAR(100)            NOT NULL UNIQUE
);
-- Nạp dữ liệu mẫu cho Category ngay
INSERT INTO CATEGORY (Cate_name) VALUES ('Cà phê'), ('Trà & Nước'), ('Đá xay'), ('Tráng Miệng');

-- 5. ITEM (Sản phẩm)
CREATE TABLE ITEM (
    Item_id         INT AUTO_INCREMENT      PRIMARY KEY,
    Item_name       VARCHAR(100)            NOT NULL,
    Description     VARCHAR(500),
    Image           VARCHAR(255),
    Cate_id         INT                     NOT NULL,
    Price           DECIMAL(10,2)           DEFAULT 0,
    CONSTRAINT CK_Cate_id FOREIGN KEY (Cate_id) REFERENCES CATEGORY(Cate_id)
);

-- 6. MENU & CONTAIN (Giữ cấu trúc nhưng đơn giản hóa cho MySQL)
CREATE TABLE MENU (
    Menu_id         INT AUTO_INCREMENT      PRIMARY KEY,
    Menu_name       VARCHAR(100)            NOT NULL,
    Time_start      TIME                    NOT NULL,
    Time_end        TIME                    NOT NULL,
    Active          BIT                     DEFAULT 1,
    Staff_id        INT                     NOT NULL
);

-- 7. VOUCHER
CREATE TABLE VOUCHER (
    Voucher_id      INT AUTO_INCREMENT      PRIMARY KEY,
    Voucher_name    VARCHAR(100)            NOT NULL,
    Voucher_code    VARCHAR(20)             NOT NULL UNIQUE,
    Description     TEXT,
    Value           DECIMAL(10, 2)          NOT NULL,
    Min_order_val   DECIMAL(10, 2)          DEFAULT 0,
    Quantity        INT                     DEFAULT 0,
    Max_usage_per_user INT                  DEFAULT 1,
    Date_start      DATETIME                NOT NULL,
    Date_end        DATETIME                NOT NULL
);

-- 8. ORDER (Dùng backtick `ORDER` vì trùng từ khóa)
CREATE TABLE `ORDER` (
    Order_id        INT AUTO_INCREMENT      PRIMARY KEY,
    Order_date      DATETIME                DEFAULT CURRENT_TIMESTAMP,
    Init_amount     DECIMAL(12,2)           DEFAULT 0,
    Discount_amount DECIMAL(12,2)           DEFAULT 0,
    Total_amount    DECIMAL(12, 2)          DEFAULT 0,
    Status          VARCHAR(20)             DEFAULT 'Pending',
    Payment_method  VARCHAR(20)             DEFAULT 'Cash',
    Cus_id          INT NOT NULL,
    Staff_id        INT,
    Voucher_id      INT,
    CONSTRAINT FK_Order_Voucher FOREIGN KEY (Voucher_id) REFERENCES VOUCHER(Voucher_id)
    -- Tạm bỏ FK Customer/Staff để dễ test nếu chưa tạo user
);

-- Dữ liệu mẫu Voucher
INSERT INTO VOUCHER (Voucher_name, Voucher_code, Description, Value, Min_order_val, Quantity, Date_start, Date_end)
VALUES ('Demo Voucher', 'TEST10', 'Type: amount', 10000, 50000, 100, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY));

-- Insert món ăn vào ITEM
INSERT INTO ITEM (Item_name, Description, Image, Cate_id, Price) VALUES 
-- --- 1. NHÓM CÀ PHÊ (Cate_id = 1) ---
('Cà phê Đen Đá', 'Hương vị cà phê Robusta đậm đà, đánh thức mọi giác quan', 'images/menu-1.jpg', 1, 25000),
('Cà phê Sữa Đá', 'Sự hòa quyện tuyệt vời giữa vị đắng cà phê và vị ngọt của sữa', 'images/menu-2.jpg', 1, 29000),
('Bạc Xỉu', 'Nhiều sữa, ít cà phê, béo ngậy và thơm lừng', 'images/coffee-1.jpg', 1, 32000),
('Cappuccino', 'Cà phê Ý đẳng cấp với lớp bọt sữa bồng bềnh', 'images/coffee-2.jpeg', 1, 45000),

-- --- 2. NHÓM TRÀ & NƯỚC (Cate_id = 2) ---
('Trà Đào Cam Sả', 'Thức uống thanh mát, giải nhiệt với đào miếng giòn tan', 'images/menu-3.jpg', 2, 39000),
('Trà Vải Hoa Hồng', 'Hương thơm hoa hồng tinh tế kết hợp vải thiều mọng nước', 'images/drink-1.jpg', 2, 39000),
('Trà Sen Vàng', 'Vị trà Oolong đậm đà kết hợp hạt sen bùi bùi và kem béo', 'images/drink-2.jpg', 2, 42000),
('Nước Ép Cam', 'Cam tươi nguyên chất, bổ sung Vitamin C', 'images/drink-3.jpg', 2, 35000),

-- --- 3. NHÓM ĐÁ XAY (Cate_id = 3) ---
('Matcha Đá Xay', 'Bột Matcha Nhật Bản xay nhuyễn cùng sữa tươi và kem whipping', 'images/drink-4.jpg', 3, 49000),
('Chocolate Cookie', 'Đá xay sô cô la đậm vị kết hợp vụn bánh quy giòn tan', 'images/drink-5.jpg', 3, 52000),
('Caramel Freeze', 'Vị caramel ngọt ngào quyện cùng cà phê đá xay mát lạnh', 'images/drink-6.jpg', 3, 49000),

-- --- 4. NHÓM BÁNH (Cate_id = 4) ---
('Bánh Croissant', 'Bánh sừng trâu ngàn lớp, vỏ giòn ruột mềm thơm mùi bơ', 'images/dessert-1.jpg', 4, 30000),
('Tiramisu', 'Bánh ngọt tráng miệng vị cà phê và ca cao nổi tiếng của Ý', 'images/dessert-2.jpg', 4, 45000),
('Mousse Chanh Dây', 'Vị chua ngọt nhẹ nhàng, cốt bánh mềm tan trong miệng', 'images/dessert-3.jpg', 4, 39000),
('Cheesecake Dâu', 'Bánh phô mai béo ngậy kết hợp sốt dâu tây tươi', 'images/dessert-4.jpg', 4, 42000);