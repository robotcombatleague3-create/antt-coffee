import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import connectFlash from 'connect-flash';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { 
    getListofProducts, 
    saveProduct, 
    upload, 
    getVouchers, 
    createVoucher, 
    getOrders, 
    updateOrderStatus 
} from '../controllers/appController';

dotenv.config();

const app = express();

// Cấu hình CORS
app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = [
            process.env.FRONTEND_URL || 'http://localhost:5173',
            'http://localhost:5174',
            'http://127.0.0.1:5500', // Live Server mặc định
            'http://localhost:3000',

            'http://localhost', 
            'http://localhost/coffee1-gh-pages'
        ];
        if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Public folder (cho file tĩnh thông thường)
app.use(express.static(path.join(__dirname, '../public')));

// Public folder đặc biệt cho ảnh upload (truy cập qua /images/tenanh.jpg)
app.use('/images', express.static(path.join(__dirname, '../public/images')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

app.use(session({
    secret: process.env.SESSION_SECRET || 'secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Để false khi chạy localhost
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7 
    }
}));

app.use(connectFlash());
app.use((req: Request, res: Response, next: NextFunction) => {
    res.locals.messages = req.flash();
    next();
});

// --- ROUTE API ---

// 1. Menu & Sản phẩm (Có upload)
app.get('/api/menu', getListofProducts);
app.post('/api/menu', upload.single('image'), saveProduct);

// 2. Voucher
app.get('/api/vouchers', getVouchers);
app.post('/api/vouchers', createVoucher);

// 3. Đơn hàng
app.get('/api/orders', getOrders);
app.put('/api/orders/:id', updateOrderStatus);

export default app;