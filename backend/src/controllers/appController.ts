import type { Request, Response } from 'express';
import { getDbConnection } from '../models/database';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

// --- CẤU HÌNH UPLOAD (Giữ nguyên) ---
const uploadDir = path.join(__dirname, '../../public/images');
if (!fs.existsSync(uploadDir)){ fs.mkdirSync(uploadDir, { recursive: true }); }

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'))
});
export const upload = multer({ storage: storage });

// --- ĐĂNG NHẬP ---
export const register = async (req: Request, res: Response) => {
    const conn = await getDbConnection();
    if(!conn) return res.status(500).json({ success: false, message: "DB Error"});

    try {
        const { username, password, email } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, message: "Thiếu tên đăng nhập hoặc mật khẩu." });
        }

        // 1. Kiểm tra user đã tồn tại
        const [existingUser]: any = await conn.execute('SELECT Acc_id FROM ACCOUNT WHERE Username = ?', [username]);
        if (existingUser.length > 0) {
            return res.status(400).json({ success: false, message: "Tên đăng nhập đã tồn tại." });
        }

        // 2. HASH MẬT KHẨU (Khắc phục vấn đề bảo mật)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Chèn user mới
        const defaultRole = 'Customer'; 
        await conn.execute(
            'INSERT INTO ACCOUNT (Username, Password, Email, Role) VALUES (?, ?, ?, ?)',
            [username, hashedPassword, email || null, defaultRole]
        );

        res.json({ success: true, message: "Đăng ký thành công" });
    } catch (error) {
        console.error("Lỗi đăng ký: ", error);
        res.status(500).json({ success: false, message: "Lỗi server nội bộ." });
    } finally {
        conn.release();
    }
};

export const login = async (req: Request, res: Response) => {
    const conn = await getDbConnection();
    if (!conn) return res.status(500).json({ success: false, message: "DB Error" });
    
    try {
        const { username, password } = req.body;

        // 1. Tìm user bằng username (chỉ lấy hash password từ DB)
        const [users]: any = await conn.execute(
            'SELECT Acc_id, Username, Password, Role FROM ACCOUNT WHERE Username = ?', 
            [username]
        );

        const user = users[0];
        if (!user) return res.status(401).json({ success: false, message: "Tên đăng nhập hoặc mật khẩu không đúng."});

        // 2. SO SÁNH MẬT KHẨU: So sánh mật khẩu trần (password) với mật khẩu hash (user.Password)
        const isMatch = await bcrypt.compare(password, user.Password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Tên đăng nhập hoặc mật khẩu không đúng." });
        }

        // 3. Đăng nhập thành công, lưu thông tin vào Session
        res.json({ 
            success: true, 
            user: { id: user.Acc_id, username: user.Username, role: user.Role } 
        });

    } catch (error) {
        console.error("Lỗi đăng nhập:", error);
        res.status(500).json({ success: false, message: "Lỗi server nội bộ."});
    } finally {
        conn.release();
    }
};

export const logout = (req: Request, res: Response) => {
    (req.session as any).destroy((error: any) => {
        if (error) {
            console.error("Lỗi logout:", error);
            return res.status(500).json({ success: false, message: "Lỗi server nội bộ."})
        }
        res.json({ success: true, message: "Đăng xuất thành công." })
    });
};

// --- QUẢN LÝ MENU (MySQL Syntax) ---
export const getListofProducts = async (req: Request, res: Response) => {
    const conn = await getDbConnection();
    if (!conn) return res.status(500).json({ success: false, message: "DB Error" });
    try {
        const [rows] = await conn.execute(`
            SELECT i.Item_id as id, i.Item_name as name, i.Price as price, 
                i.Image as image, i.Description as description, i.Cate_id, c.Cate_name as category 
            FROM ITEM i
            LEFT JOIN CATEGORY c ON i.Cate_id = c.Cate_id
            ORDER BY i.Item_id DESC
        `);
        res.json({ success: true, data: rows });
    } catch (e) { console.error(e); res.status(500).json({success:false}); }
    finally { conn.release(); } // MySQL pool cần release connection
};

export const saveProduct = async (req: Request, res: Response) => {
    const conn = await getDbConnection();
    if (!conn) return res.status(500).json({ success: false });

    try {
        const { id, name, price, cate_id, description } = req.body;
        
        // SỬA DÒNG NÀY: Nếu không có ảnh mới và không có ảnh cũ -> trả về null (thay vì undefined)
        // Lưu ý: req.body.currentImage có thể là chuỗi "null" hoặc "undefined" do FormData gửi lên
        let currentImg = req.body.currentImage;
        if (currentImg === 'null' || currentImg === 'undefined') currentImg = null;

        const imagePath = req.file ? `/images/${req.file.filename}` : (currentImg || null);
        
        const categoryId = cate_id || 1; 

        // Kiểm tra an toàn cho name và price
        const safeName = name || null;
        const safePrice = price || 0;

        if (id && id !== 'undefined' && id !== '') {
            // UPDATE
            await conn.execute(
                'UPDATE ITEM SET Item_name=?, Price=?, Image=?, Cate_id=?, Description=? WHERE Item_id=?',
                [safeName, safePrice, imagePath, categoryId, req.body.description || null, id]
            );
            res.json({ success: true, message: "Đã cập nhật món" });
        } else {
            // INSERT
            await conn.execute(
                'INSERT INTO ITEM (Item_name, Price, Image, Cate_id, Description) VALUES (?, ?, ?, ?, ?)',
                [safeName, safePrice, imagePath, categoryId, req.body.description || null]
            );
            res.json({ success: true, message: "Đã thêm món mới" });
        }
    } catch (e) { 
        console.error(e); 
        res.status(500).json({ success: false, message: "Lỗi lưu dữ liệu: " + (e as Error).message }); 
    }
    finally { conn.release(); }
};

export const getProductById = async (req: Request, res: Response) => {
    const { id } = req.params;          // Get ID from URL (Ex: /api/product/1)

    // Check if ID is exist or not
    if (!id) {
        return res.status(400).json({
            success: false,
            message: "Missing product ID"
        });
    }

    const conn = await getDbConnection();
    if (!conn) {
        return res.status(400).json({
            success: false,
            message: "Database connection error"
        });
    }

    try {
        const [rows]: any = await conn.execute(`
            SELECT i.Item_id as id, i.Item_name as name, i.Price as price, 
                   i.Image as image, i.Cate_id as cate_id, c.Cate_name as category 
            FROM ITEM i
            LEFT JOIN CATEGORY c ON i.Cate_id = c.Cate_id
            WHERE i.Item_id = ?
            `, [id]);

        // If cannot find product
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            })
        }

        return res.status (200).json({
            success: true,
            data: rows[0],               // Return first found product
        });
    } catch (error) {
        console.error("Error getting product detail:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    } finally {
        await conn.release()
    }
}

// --- QUẢN LÝ VOUCHER (MySQL Syntax) ---
export const getVouchers = async (req: Request, res: Response) => {
    const conn = await getDbConnection();
    if (!conn) return res.status(500).json({ success: false });
    try {
        const [rows] = await conn.execute('SELECT * FROM VOUCHER ORDER BY Date_start DESC');
        res.json({ success: true, data: rows });
    } catch (e) { console.error(e); res.status(500).json({success:false}); }
    finally { conn.release(); }
};

export const createVoucher = async (req: Request, res: Response) => {
    const { code, type, value, min } = req.body;
    const conn = await getDbConnection();
    if (!conn) return res.status(500).json({ success: false });

    try {
        const voucherName = "CODE " + code;
        const description = `Type: ${type}`;
        
        // MySQL dùng NOW() và DATE_ADD()
        const sql = `
            INSERT INTO VOUCHER 
            (Voucher_name, Voucher_code, Description, Value, Min_order_val, Quantity, Max_usage_per_user, Date_start, Date_end)
            VALUES (?, ?, ?, ?, ?, 100, 1, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY))
        `;
        
        await conn.execute(sql, [voucherName, code, description, value, min || 0]);
        res.json({ success: true, message: "Tạo ưu đãi thành công" });
    } catch (error: any) {
        console.error(error);
        if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ success: false, message: "Mã đã tồn tại" });
        res.status(500).json({ success: false, message: "Lỗi server" });
    } finally { conn.release(); }
};

// --- QUẢN LÝ ĐƠN HÀNG (MySQL Syntax) ---
export const getOrders = async (req: Request, res: Response) => {
    const conn = await getDbConnection();
    if (!conn) return res.status(500).json({ success: false });
    try {
        // Dùng backtick cho `ORDER`
        const sql = `
            SELECT o.Order_id, o.Order_date, o.Total_amount, o.Status, c.F_name, c.L_name
            FROM \`ORDER\` o
            LEFT JOIN CUSTOMER c ON o.Cus_id = c.Cus_id
            ORDER BY o.Order_date DESC
        `;
        const [rows] = await conn.execute(sql);
        res.json({ success: true, data: rows });
    } catch (e) { console.error(e); res.status(500).json({success:false}); }
    finally { conn.release(); }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
    const conn = await getDbConnection();
    if (!conn) return res.status(500).json({ success: false });
    try {
        const orderId = req.params.id;
        const newStatus = req.body.status;

        // Cập nhật trạng thái trong DB
        await conn.execute('UPDATE `ORDER` SET Status = ? WHERE Order_id = ?', [newStatus, orderId]);
        
        res.json({ success: true, message: "Cập nhật thành công" });
    } catch (e) { 
        console.error(e); 
        res.status(500).json({success:false, message: "Lỗi DB"}); 
    }
    finally { conn.release(); }
};

// --- XỬ LÝ ĐẶT HÀNG ---
export const createOrder = async (req: Request, res: Response) => {
    const conn = await getDbConnection();
    if (!conn) return res.status(500).json({ success: false, message: "Lỗi kết nối DB" });

    try {
        const { userId, items, subtotal, discount, total, voucherCode } = req.body;

        // 1. KIỂM TRA DỮ LIỆU ĐẦU VÀO (Validation)
        // Nếu userId không có -> Báo lỗi ngay
        if (userId === undefined || userId === null) {
            return res.status(400).json({ success: false, message: "Dữ liệu lỗi: Không tìm thấy ID người dùng. Vui lòng đăng nhập lại." });
        }

        // 2. CHUẨN HÓA DỮ LIỆU (Tránh undefined)
        // Nếu các số liệu tính toán bị thiếu, gán mặc định bằng 0
        const safeSubtotal = subtotal || 0;
        const safeDiscount = discount || 0;
        const safeTotal = total || 0;
        
        await conn.beginTransaction();

        // 3. TẠO ĐƠN HÀNG (Bảng ORDER)
        // Cus_id lấy từ userId. Lưu ý: Trong DB của bạn Cus_id là khóa ngoại trỏ tới CUSTOMER.
        // Nếu userId bạn gửi lên là Acc_id, hãy đảm bảo logic này đúng với DB của bạn.
        // Tạm thời chèn userId vào Cus_id.
        const [result] = await conn.execute(
            'INSERT INTO `ORDER` (Order_date, Init_amount, Discount_amount, Total_amount, Status, Cus_id, Voucher_id) VALUES (NOW(), ?, ?, ?, ?, ?, ?)',
            [safeSubtotal, safeDiscount, safeTotal, 'CREATED', userId, null]
        );

        const orderId = (result as any).insertId;

        // 4. LƯU CHI TIẾT (Bảng DETAIL)
        for (const item of items) {
            // Kiểm tra item ID
            const itemId = item.id || item.productId;
            
            if (!itemId) {
                throw new Error(`Sản phẩm "${item.name}" bị lỗi dữ liệu (thiếu ID). Hãy xóa giỏ hàng và chọn lại.`);
            }

            await conn.execute(
                'INSERT INTO DETAIL (Order_id, Item_id, Quantity, Price) VALUES (?, ?, ?, ?)',
                [orderId, itemId, item.quantity || 1, item.price || 0]
            );
        }

        // 5. CẬP NHẬT VOUCHER (Nếu có)
        if (voucherCode) {
            await conn.execute('UPDATE VOUCHER SET Quantity = Quantity - 1 WHERE Voucher_code = ?', [voucherCode]);
        }

        await conn.commit();
        res.json({ success: true, message: "Đặt hàng thành công", orderId: orderId });

    } catch (e) {
        await conn.rollback();
        console.error("Lỗi tạo đơn:", e);
        // Trả về thông báo lỗi cụ thể cho Frontend
        res.status(500).json({ success: false, message: "Lỗi xử lý đơn hàng: " + (e as Error).message });
    } finally {
        conn.release();
    }
};

// API lấy lịch sử đơn hàng của User
export const getMyOrders = async (req: Request, res: Response) => {
    const userId = req.params.userId;
    const conn = await getDbConnection();
    if (!conn) return res.status(500).json({ success: false });

    try {
        // 1. Lấy danh sách đơn hàng của user này
        const [orders]: any = await conn.execute(
            'SELECT * FROM `ORDER` WHERE Cus_id = ? ORDER BY Order_date DESC', 
            [userId]
        );

        // 2. Lặp qua từng đơn để lấy chi tiết món ăn (ITEMS)
        // Đây là bước quan trọng, nếu thiếu bước này frontend sẽ không render được
        for (let order of orders) {
            const [details] = await conn.execute(
                `SELECT d.Quantity as qty, d.Price as price, i.Item_name as name, i.Image as image 
                 FROM DETAIL d 
                 JOIN ITEM i ON d.Item_id = i.Item_id 
                 WHERE d.Order_id = ?`,
                [order.Order_id]
            );
            order.items = details; // Gán items vào object order
        }

        res.json({ success: true, data: orders });
    } catch (e) {
        console.error("Lỗi lấy lịch sử:", e);
        res.status(500).json({ success: false, message: "Lỗi server" });
    } finally {
        conn.release();
    }
};