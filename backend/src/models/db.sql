/* ==================================================
   1. TẠO DATABASE (QUAN TRỌNG: Phải chạy phần này trước)
   ==================================================*/
DROP DATABASE IF EXISTS coffee_shop;
CREATE DATABASE coffee_shop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE coffee_shop;

/* ==================================================
   2. TẠO CÁC BẢNG (TABLES)
   ==================================================*/

-- Bảng ACCOUNT
CREATE TABLE ACCOUNT (
    Acc_id              INT AUTO_INCREMENT PRIMARY KEY,
    Email               VARCHAR(100) NOT NULL UNIQUE,
    Username            VARCHAR(50) NOT NULL UNIQUE,
    Password            VARCHAR(255) NOT NULL,
    Role                ENUM('Admin', 'Staff', 'Customer') DEFAULT 'Customer',
    Join_date           DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT CK_Email CHECK (Email LIKE '%_@_%.com')
);

-- Bảng CUSTOMER
CREATE TABLE CUSTOMER (
    Cus_id              INT AUTO_INCREMENT PRIMARY KEY,
    F_name              VARCHAR(50) NOT NULL,
    L_name              VARCHAR(50) NOT NULL,
    Phone               VARCHAR(15) NOT NULL UNIQUE,
    Points              INT DEFAULT 0,
    Acc_id              INT UNIQUE,
    -- Tính toán cấp độ (Level) tự động dựa trên điểm
    Level               VARCHAR(20) GENERATED ALWAYS AS (
        CASE
            WHEN Points < 200 THEN 'Bronze'
            WHEN Points >= 200 AND Points < 500 THEN 'Silver'
            WHEN Points >= 500 AND Points < 1000 THEN 'Gold'
            ELSE 'Diamond'
        END
    ) STORED,
    CONSTRAINT FK_Cus_Account FOREIGN KEY (Acc_id) REFERENCES ACCOUNT(Acc_id) ON DELETE SET NULL,
    CONSTRAINT CK_Points CHECK (Points >= 0)    
);

-- Bảng STAFF
CREATE TABLE STAFF (
    Staff_id            INT AUTO_INCREMENT PRIMARY KEY,
    F_name              VARCHAR(50) NOT NULL,
    L_name              VARCHAR(50) NOT NULL,
    Acc_id              INT NOT NULL UNIQUE,
    CONSTRAINT FK_Staff_Account FOREIGN KEY (Acc_id) REFERENCES ACCOUNT(Acc_id) ON DELETE CASCADE
);

-- Bảng CATEGORY
CREATE TABLE CATEGORY (
    Cate_id             INT AUTO_INCREMENT PRIMARY KEY,
    Cate_name           VARCHAR(100) NOT NULL UNIQUE
);

-- Bảng ITEM
CREATE TABLE ITEM (
    Item_id             INT AUTO_INCREMENT PRIMARY KEY,
    Item_name           VARCHAR(100) NOT NULL,
    Description         TEXT,
    Image               VARCHAR(255),
    Cate_id             INT NOT NULL,
    CONSTRAINT FK_Item_Category FOREIGN KEY (Cate_id) REFERENCES CATEGORY(Cate_id)
);

-- Bảng MENU
CREATE TABLE MENU (
    Menu_id             INT AUTO_INCREMENT PRIMARY KEY,
    Menu_name           VARCHAR(100) NOT NULL,
    Time_start          TIME NOT NULL,
    Time_end            TIME NOT NULL,
    Active              BOOLEAN DEFAULT TRUE,
    Staff_id            INT NOT NULL,
    CONSTRAINT FK_Menu_Staff FOREIGN KEY (Staff_id) REFERENCES STAFF(Staff_id),
    CONSTRAINT CK_Menu_time CHECK (Time_start < Time_end)
);

-- Bảng CONTAIN (Quan hệ giữa Menu và Item)
CREATE TABLE CONTAIN (
    Menu_id             INT,
    Item_id             INT,
    Price               DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (Menu_id, Item_id),
    CONSTRAINT FK_Contain_Menu FOREIGN KEY (Menu_id) REFERENCES MENU(Menu_id) ON DELETE CASCADE,
    CONSTRAINT FK_Contain_Item FOREIGN KEY (Item_id) REFERENCES ITEM(Item_id) ON DELETE CASCADE,
    CONSTRAINT CK_Price CHECK (Price >= 0)
);

-- Bảng VOUCHER
CREATE TABLE VOUCHER (
    Voucher_id          INT AUTO_INCREMENT PRIMARY KEY,
    Voucher_name        VARCHAR(100) NOT NULL,
    Voucher_code        VARCHAR(20) NOT NULL UNIQUE,
    Description         TEXT,
    Value               DECIMAL(10, 2) NOT NULL,
    Min_order_val       DECIMAL(10, 2) DEFAULT 0,
    Quantity            INT DEFAULT 0,
    Max_usage_per_user  INT DEFAULT 1,
    Date_start          DATETIME NOT NULL,
    Date_end            DATETIME NOT NULL,
    CONSTRAINT CK_Voucher_date CHECK (Date_start < Date_end),
    CONSTRAINT CK_Quantity CHECK (Quantity >= 0)
);

-- Bảng ORDERS
CREATE TABLE ORDERS (
    Order_id            INT AUTO_INCREMENT PRIMARY KEY,
    Order_date          DATETIME DEFAULT CURRENT_TIMESTAMP,
    Init_amount         DECIMAL(12,2) DEFAULT 0,
    Discount_amount     DECIMAL(12,2) DEFAULT 0,
    Total_amount        DECIMAL(12, 2) DEFAULT 0,
    Status              ENUM('Pending', 'Processing', 'Completed', 'Cancelled') DEFAULT 'Pending',
    Payment_method      ENUM('Cash', 'Banking', 'Momo', 'Card') DEFAULT 'Cash',
    Cus_id              INT NOT NULL,
    Staff_id            INT,
    Voucher_id          INT,
    CONSTRAINT FK_Order_Customer FOREIGN KEY (Cus_id) REFERENCES CUSTOMER(Cus_id),
    CONSTRAINT FK_Order_Staff FOREIGN KEY (Staff_id) REFERENCES STAFF(Staff_id),
    CONSTRAINT FK_Order_Voucher FOREIGN KEY (Voucher_id) REFERENCES VOUCHER(Voucher_id)
);

-- Bảng ORDER_DETAIL
CREATE TABLE ORDER_DETAIL (
    Order_id            INT,
    Item_id             INT,
    Quantity            INT NOT NULL,
    Note                VARCHAR(255),
    Snapshot_price      DECIMAL(10,2) NOT NULL,
    PRIMARY KEY(Order_id, Item_id),
    CONSTRAINT FK_Detail_Order FOREIGN KEY (Order_id) REFERENCES ORDERS(Order_id) ON DELETE CASCADE,
    CONSTRAINT FK_Detail_Item FOREIGN KEY (Item_id) REFERENCES ITEM(Item_id),
    CONSTRAINT CK_Detail_Quantity CHECK (Quantity > 0)
);

-- Bảng FEEDBACK
CREATE TABLE FEEDBACK (
    Order_id            INT,
    Item_id             INT,
    Rating              INT NOT NULL,
    Comment             TEXT,
    Date_rate           DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (Order_id, Item_id),
    CONSTRAINT FK_Feedback_Detail FOREIGN KEY (Order_id, Item_id) REFERENCES ORDER_DETAIL(Order_id, Item_id),
    CONSTRAINT CK_Feedback_Rating CHECK (Rating BETWEEN 1 AND 5)
);

-- Bảng VOUCHER_USE
CREATE TABLE VOUCHER_USE (
    Cus_id              INT,
    Voucher_id          INT,
    Used_time           DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (Cus_id, Voucher_id, Used_time),
    CONSTRAINT FK_Use_Customer FOREIGN KEY (Cus_id) REFERENCES CUSTOMER(Cus_id),
    CONSTRAINT FK_Use_Voucher FOREIGN KEY (Voucher_id) REFERENCES VOUCHER(Voucher_id)
);

/* ==================================================
   3. TRIGGER (Tự động hóa)
   ==================================================*/
DELIMITER //

-- Trigger 1: Tự động tính lại tổng tiền đơn hàng khi thêm/sửa chi tiết đơn
CREATE TRIGGER trg_UpdateTotal_After_InsertDetail
AFTER INSERT ON ORDER_DETAIL
FOR EACH ROW
BEGIN
    UPDATE ORDERS 
    SET Total_amount = (SELECT SUM(Quantity * Snapshot_price) FROM ORDER_DETAIL WHERE Order_id = NEW.Order_id)
    WHERE Order_id = NEW.Order_id;
END; //

CREATE TRIGGER trg_UpdateTotal_After_DeleteDetail
AFTER DELETE ON ORDER_DETAIL
FOR EACH ROW
BEGIN
    UPDATE ORDERS 
    SET Total_amount = (SELECT COALESCE(SUM(Quantity * Snapshot_price), 0) FROM ORDER_DETAIL WHERE Order_id = OLD.Order_id)
    WHERE Order_id = OLD.Order_id;
END; //

-- Trigger 2: Tự động cộng điểm tích lũy (10k = 1 điểm) khi đơn hàng hoàn thành
CREATE TRIGGER trg_AddPoints_After_Complete
AFTER UPDATE ON ORDERS
FOR EACH ROW
BEGIN
    IF NEW.Status = 'Completed' AND OLD.Status != 'Completed' THEN
        UPDATE CUSTOMER
        SET Points = Points + FLOOR(NEW.Total_amount / 10000)
        WHERE Cus_id = NEW.Cus_id;
    END IF;
END; //

DELIMITER ;

/* ==================================================
   4. STORED PROCEDURES (Thủ tục lưu trữ)
   ==================================================*/
DELIMITER //

-- Procedure 1: Thêm món ăn mới vào Menu (Tiện ích cho Admin)
CREATE PROCEDURE proc_AddProductToMenu(
    IN _ItemName VARCHAR(100),
    IN _Price DECIMAL(10,2),
    IN _Image VARCHAR(255),
    IN _CateID INT,
    IN _MenuID INT
)
BEGIN
    DECLARE _NewItemID INT;
    
    -- Thêm vào bảng ITEM
    INSERT INTO ITEM (Item_name, Image, Cate_id) VALUES (_ItemName, _Image, _CateID);
    SET _NewItemID = LAST_INSERT_ID();
    
    -- Thêm vào bảng CONTAIN (Gán giá)
    INSERT INTO CONTAIN (Menu_id, Item_id, Price) VALUES (_MenuID, _NewItemID, _Price);
END; //

-- Procedure 2: Lấy danh sách món ăn đang bán (Kèm giá)
CREATE PROCEDURE proc_GetActiveMenu()
BEGIN
    SELECT i.Item_id, i.Item_name, i.Image, c.Price, cat.Cate_name
    FROM ITEM i
    JOIN CONTAIN c ON i.Item_id = c.Item_id
    JOIN MENU m ON c.Menu_id = m.Menu_id
    JOIN CATEGORY cat ON i.Cate_id = cat.Cate_id
    WHERE m.Active = TRUE;
END; //

-- Procedure 3: Sử dụng CURSOR để tính doanh thu theo từng món ăn (Báo cáo)
CREATE PROCEDURE proc_ReportRevenueByItem()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE p_name VARCHAR(100);
    DECLARE p_revenue DECIMAL(12,2);
    
    -- Khai báo Cursor
    DECLARE cur_report CURSOR FOR 
        SELECT i.Item_name, SUM(d.Quantity * d.Snapshot_price) as Revenue
        FROM ORDER_DETAIL d
        JOIN ITEM i ON d.Item_id = i.Item_id
        GROUP BY i.Item_id;
        
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    -- Tạo bảng tạm để chứa kết quả (nếu muốn trả về) hoặc SELECT trực tiếp
    DROP TEMPORARY TABLE IF EXISTS TempReport;
    CREATE TEMPORARY TABLE TempReport (ItemName VARCHAR(100), TotalRevenue DECIMAL(12,2));

    OPEN cur_report;
    
    read_loop: LOOP
        FETCH cur_report INTO p_name, p_revenue;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Logic xử lý từng dòng (Ở đây insert vào bảng tạm)
        INSERT INTO TempReport VALUES (p_name, p_revenue);
    END LOOP;
    
    CLOSE cur_report;
    
    -- Trả kết quả
    SELECT * FROM TempReport ORDER BY TotalRevenue DESC;
    DROP TEMPORARY TABLE TempReport;
END; //

DELIMITER ;

/* ==================================================
   5. FUNCTIONS (Hàm)
   ==================================================*/
DELIMITER //

-- Function 1: Tính tổng doanh thu trong ngày
CREATE FUNCTION func_DailyRevenue(check_date DATE) 
RETURNS DECIMAL(12,2)
DETERMINISTIC
BEGIN
    DECLARE total DECIMAL(12,2);
    SELECT SUM(Total_amount) INTO total 
    FROM ORDERS 
    WHERE DATE(Order_date) = check_date AND Status = 'Completed';
    
    RETURN COALESCE(total, 0);
END; //

DELIMITER ;

/* ==================================================
   6. DATA SEEDING (Dữ liệu mẫu)
   ==================================================*/
-- Tài khoản
INSERT INTO ACCOUNT (Email, Username, Password, Role) VALUES 
('admin@antt.com', 'admin', '123456', 'Admin'),
('staff1@antt.com', 'nhanvien1', '123456', 'Staff'),
('khach1@gmail.com', 'khachhang1', '123456', 'Customer');

-- Nhân viên & Khách
INSERT INTO STAFF (F_name, L_name, Acc_id) VALUES ('Nguyen', 'Van A', 2);
INSERT INTO CUSTOMER (F_name, L_name, Phone, Acc_id, Points) VALUES ('Tran', 'Thi B', '0909123456', 3, 100);

-- Danh mục
INSERT INTO CATEGORY (Cate_name) VALUES ('Coffee'), ('Tea'), ('Bakery');

-- Thực đơn & Món
INSERT INTO STAFF (F_name, L_name, Acc_id) VALUES ('Quan', 'Ly', 1); -- Giả lập admin cũng là staff quản lý menu
INSERT INTO MENU (Menu_name, Time_start, Time_end, Active, Staff_id) VALUES ('Menu Sáng', '06:00:00', '22:00:00', 1, 1);

-- Thêm món vào bảng ITEM
INSERT INTO ITEM (Item_name, Description, Image, Cate_id) VALUES 
('Cà phê đen đá', 'Đậm đà hương vị', 'images/menu-1.jpg', 1),
('Bạc xỉu', 'Ngọt ngào sữa đặc', 'images/menu-2.jpg', 1),
('Trà đào cam sả', 'Thanh mát giải nhiệt', 'images/menu-3.jpg', 2),
('Bánh Croissant', 'Thơm ngon béo ngậy', 'images/dessert-1.jpg', 3);

-- Gán giá cho món (Vào MENU id=1)
INSERT INTO CONTAIN (Menu_id, Item_id, Price) VALUES 
(1, 1, 25000), -- Cà phê đen
(1, 2, 29000), -- Bạc xỉu
(1, 3, 35000), -- Trà đào
(1, 4, 45000); -- Bánh

-- Voucher
INSERT INTO VOUCHER (Voucher_name, Voucher_code, Value, Date_start, Date_end, Quantity) VALUES 
('Giảm 10k', 'ANTT10', 10000, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), 100);

-- Tạo 1 Đơn hàng mẫu (Để test trigger)
INSERT INTO ORDERS (Cus_id, Staff_id, Status) VALUES (1, 1, 'Completed');
INSERT INTO ORDER_DETAIL (Order_id, Item_id, Quantity, Snapshot_price) VALUES 
(1, 1, 2, 25000), -- 2 ly cafe đen
(1, 4, 1, 45000); -- 1 bánh