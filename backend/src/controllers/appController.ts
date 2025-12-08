import type { Request, Response } from 'express';
import { getDbConnection } from '../models/database';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// --- CẤU HÌNH UPLOAD (Giữ nguyên) ---
const uploadDir = path.join(__dirname, '../../public/images');
if (!fs.existsSync(uploadDir)){ fs.mkdirSync(uploadDir, { recursive: true }); }

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'))
});
export const upload = multer({ storage: storage });

// --- QUẢN LÝ MENU (MySQL Syntax) ---
export const getListofProducts = async (req: Request, res: Response) => {
    const conn = await getDbConnection();
    if (!conn) return res.status(500).json({ success: false, message: "DB Error" });
    try {
        const [rows] = await conn.execute(`
            SELECT i.Item_id as id, i.Item_name as name, i.Price as price, 
                   i.Image as image, c.Cate_name as category 
            FROM ITEM i
            LEFT JOIN CATEGORY c ON i.Cate_id = c.Cate_id
            ORDER BY i.Item_name ASC
        `);
        res.json({ success: true, data: rows });
    } catch (e) { console.error(e); res.status(500).json({success:false}); }
    finally { conn.release(); } // MySQL pool cần release connection
};

export const saveProduct = async (req: Request, res: Response) => {
    const conn = await getDbConnection();
    if (!conn) return res.status(500).json({ success: false });

    try {
        const { id, name, price, cate_id } = req.body;
        
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
                'UPDATE ITEM SET Item_name=?, Price=?, Image=?, Cate_id=? WHERE Item_id=?',
                [safeName, safePrice, imagePath, categoryId, id]
            );
            res.json({ success: true, message: "Đã cập nhật món" });
        } else {
            // INSERT
            await conn.execute(
                'INSERT INTO ITEM (Item_name, Price, Image, Cate_id) VALUES (?, ?, ?, ?)',
                [safeName, safePrice, imagePath, categoryId]
            );
            res.json({ success: true, message: "Đã thêm món mới" });
        }
    } catch (e) { 
        console.error(e); 
        res.status(500).json({ success: false, message: "Lỗi lưu dữ liệu: " + (e as Error).message }); 
    }
    finally { conn.release(); }
};

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
        await conn.execute('UPDATE \`ORDER\` SET Status = ? WHERE Order_id = ?', [req.body.status, req.params.id]);
        res.json({ success: true, message: "Cập nhật thành công" });
    } catch (e) { console.error(e); res.status(500).json({success:false}); }
    finally { conn.release(); }
};