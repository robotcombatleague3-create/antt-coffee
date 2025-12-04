DROP DATABASE IF EXISTS coffee_shop;
CREATE DATABASE coffee_shop;
GO

USE coffee_shop;
GO
/* ==================================================
   ACCOUNT & USER
   ==================================================*/

CREATE TABLE ACCOUNT (
    Acc_id              INT IDENTITY(1,1)   PRIMARY KEY,
    Email               VARCHAR(100)        NOT NULL UNIQUE,
    Username            VARCHAR(50)         NOT NULL UNIQUE,
    [Password]          VARCHAR(255)        NOT NULL,
    Join_date           DATETIME            DEFAULT GETDATE(),

    CONSTRAINT CK_Email CHECK (Email LIKE '%_@_%.com'),
    CONSTRAINT CK_Join_date CHECK (Join_date <= GETDATE())
);
GO

CREATE TABLE CUSTOMER (
    Cus_id              INT IDENTITY(1,1)   PRIMARY KEY,
    F_name              NVARCHAR(20)        NOT NULL,
    L_name              NVARCHAR(40)        NOT NULL,
    Phone               VARCHAR(10)         NOT NULL UNIQUE,

    Points              INT                 DEFAULT 0,
    Acc_id              INT                 UNIQUE,

    -- derived attribute
    [Level] AS (
        CASE
            WHEN Points < 200 THEN 'Bronze'
            WHEN Points >= 200 AND Points < 500 THEN 'Silver'
            WHEN Points >= 500 AND Points < 1000 THEN 'Gold'
            ELSE 'Diamond'
        END
    ) PERSISTED,

    CONSTRAINT FK_Cus_Acoount FOREIGN KEY (Acc_id) REFERENCES ACCOUNT(Acc_id),
    CONSTRAINT CK_Phone CHECK(Phone Like '0[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'),
    CONSTRAINT CK_Points CHECK (Points >= 0)    
);
GO

CREATE TABLE STAFF (
    Staff_id            INT IDENTITY(1,1)   PRIMARY KEY,
    F_name              NVARCHAR(20)        NOT NULL,
    L_name              NVARCHAR(40)        NOT NULL,
    Acc_id              INT                 NOT NULL UNIQUE,

    CONSTRAINT FK_Staff_Account FOREIGN KEY (Acc_id) REFERENCES ACCOUNT(Acc_id)
);
GO

/* ==================================================
   MENU & MENU_ITEM
   ==================================================*/
CREATE TABLE MENU (
    Menu_id             INT IDENTITY(1,1)   PRIMARY KEY,
    Menu_name           NVARCHAR(100)       NOT NULL,
    Time_start          TIME(0)             NOT NULL,
    Time_end            TIME(0)             NOT NULL,
    Active              BIT                 DEFAULT 1, -- 1: on store, 0:stop
    Staff_id            INT                 NOT NULL,

    CONSTRAINT FK_Staff_id FOREIGN KEY (Staff_id) REFERENCES STAFF(Staff_id),
    CONSTRAINT CK_Menu_time CHECK (Time_start < Time_end)
);
GO

CREATE TABLE CATEGORY (
    Cate_id             INT IDENTITY(1,1)   PRIMARY KEY,
    Cate_name           NVARCHAR(100)       NOT NULL UNIQUE,
);
GO

CREATE TABLE ITEM (
    Item_id             INT IDENTITY(1,1)   PRIMARY KEY,
    Item_name           NVARCHAR(100)       NOT NULL,
    [Description]       NVARCHAR(500),
    [Image]             VARCHAR(255),
    Cate_id             INT                 NOT NULL,

    CONSTRAINT CK_Cate_id FOREIGN KEY (Cate_id) REFERENCES CATEGORY(Cate_id)
);
GO

CREATE TABLE CONTAIN (
    Menu_id             INT,
    Item_id             INT,
    Price       DECIMAL(10,2)       NOT NULL,

    PRIMARY KEY (Menu_id, Item_id),
    CONSTRAINT FK_Menu_id FOREIGN KEY (Menu_id) REFERENCES MENU(Menu_id),
    CONSTRAINT FK_Item_id FOREIGN KEY (Item_id) REFERENCES ITEM(Item_id),
    CONSTRAINT CK_Price CHECK (Price >= 0)
);
GO

/* ==================================================
   ORDER, VOUCHER & FEEDBACK
   ==================================================*/
CREATE TABLE VOUCHER (
    Voucher_id          INT IDENTITY(1,1)   PRIMARY KEY,
    Voucher_name        NVARCHAR(100)       NOT NULL,
    Voucher_code        VARCHAR(20)         NOT NULL UNIQUE,
    [Description]       NVARCHAR(MAX),
    [Value]             DECIMAL(10, 2)      NOT NULL,
    Min_order_val       DECIMAL(10, 2)      DEFAULT 0,
    Quantity            INT                 DEFAULT 0,
    Max_usage_per_user  INT                 DEFAULT 1,
    Date_start          DATETIME            NOT NULL,
    Date_end            DATETIME            NOT NULL,

    CONSTRAINT CK_Voucher_date CHECK (Date_start < Date_end),
    CONSTRAINT CK_Min_order_val CHECK (Min_order_val >= 0),
    CONSTRAINT CK_Quantity CHECK (Quantity >= 0),
    CONSTRAINT CK_Voucher_value CHECK ([Value] > 0),
    CONSTRAINT CK_Max_usage_per_user CHECK (Max_usage_per_user > 0)
);
GO


CREATE TABLE [ORDER] (
    Order_id            INT IDENTITY(1,1)   PRIMARY KEY,
    Order_date          DATETIME            DEFAULT GETDATE(),

    Init_amount         DECIMAL(12,2)       DEFAULT 0,
    Discount_amount     DECIMAL(12,2)       DEFAULT 0,
    Total_amount        DECIMAL(12, 2)      DEFAULT 0,
    [Status]            VARCHAR(20)         DEFAULT 'Pending',
    Payment_method      VARCHAR(20)         DEFAULT 'Cash',

    Cus_id              INT                 NOT NULL,
    Staff_id            INT,
    Voucher_id          INT,

    CONSTRAINT FK_Order_Customer FOREIGN KEY (Cus_id) REFERENCES CUSTOMER(Cus_id),
    CONSTRAINT FK_Order_Staff FOREIGN KEY (Staff_id) REFERENCES STAFF(Staff_id),
    CONSTRAINT FK_Order_Voucher FOREIGN KEY (Voucher_id) REFERENCES VOUCHER(Voucher_id),

    CONSTRAINT CK_Order_status CHECK ([Status] IN('Pending', 'Processing', 'Completed', 'Cancelled')),
    CONSTRAINT CK_Payment_method CHECK (Payment_method IN ('Cash', 'Banking', 'Momo', 'Card')),
    CONSTRAINT CK_Order_Date_Valid CHECK (Order_date <= GETDATE()),
    CONSTRAINT CK_Order_Init_Amount CHECK (Init_amount >= 0),
    CONSTRAINT CK_Order_Discount_Amount CHECK (Discount_amount >= 0),
    CONSTRAINT CK_Order_Total_Amount CHECK (Total_amount >= 0)
);
GO

CREATE TABLE DETAIL (
    Order_id            INT,
    Item_id             INT,
    Quantity            INT                 NOT NULL,
    Note                NVARCHAR(255),
    Snapshot_price      DECIMAL(10,2)       NOT NULL,

    PRIMARY KEY(Order_id, Item_id),
    CONSTRAINT FK_Detail_Order FOREIGN KEY (Order_id) REFERENCES [ORDER](Order_id),
    CONSTRAINT FK_Detail_Item FOREIGN KEY (Item_id) REFERENCES ITEM(Item_id),

    CONSTRAINT CK_Detail_Quantity CHECK (Quantity > 0),
    CONSTRAINT CK_Snapshot_price CHECK (Snapshot_price >= 0)
);
GO

CREATE TABLE FEEDBACK (
    Order_id            INT,
    Item_id             INT,
    Rating              INT                 NOT NULL,
    Comment             NVARCHAR(2000),
    Date_rate           DATETIME            DEFAULT GETDATE(),

    PRIMARY KEY (Order_id, Item_id),
    CONSTRAINT FK_Feedback_Detail FOREIGN KEY (Order_id, Item_id) REFERENCES DETAIL(Order_id, Item_id),
    CONSTRAINT CK_Feedback_Rating CHECK (Rating BETWEEN 1 AND 5),
    CONSTRAINT CK_Feedback_Date CHECK (Date_rate <= GETDATE())
);
GO

CREATE TABLE [USE] (
    Cus_id              INT,
    Voucher_id          INT,
    Used_time           DATETIME            DEFAULT GETDATE(),

    PRIMARY KEY (Cus_id, Voucher_id, Used_time),
    CONSTRAINT FK_Use_Customer FOREIGN KEY (Cus_id) REFERENCES CUSTOMER(Cus_id),
    CONSTRAINT FK_Use_Voucher FOREIGN KEY (Voucher_id) REFERENCES VOUCHER(Voucher_id),
    CONSTRAINT CK_Used_time CHECK (Used_time <= GETDATE())
);
GO

/* ==================================================
   TRIGGER
   ==================================================*/
-- Tự động cộng điểm tích lũy khi hoàn thành đơn
-- Quy ước: 10.000 VNĐ = 1 điểm
CREATE OR ALTER TRIGGER trg_AddPoints_Member
ON [ORDER]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF UPDATE([Status])
    BEGIN
        DECLARE @Cus_id INT, @Total_amount Decimal(12,2), @Status VARCHAR(20), @Is_member INT;

        SELECT @Cus_id = i.Cus_id, @Total_amount = i.Total_amount, @Status = i.Status
        FROM inserted i
        JOIN CUSTOMER c ON i.Cus_id = c.Cus_id;
    END
END;
GO

CREATE OR ALTER TRIGGER trg_CalculateOrderTotal
ON DETAIL
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
END;
GO