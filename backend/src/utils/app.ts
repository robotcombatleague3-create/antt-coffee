import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import connectFlash from 'connect-flash';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { createVoucher, getListofProducts, getOrders, getProductById, getVouchers, saveProduct, updateOrderStatus, upload } from '../controllers/appController';

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

// Serve frontend files
app.use(express.static(path.join(__dirname, '../../../frontend')));

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

// Root endpoint
app.get('/', (req: Request, res: Response) => {
    res.json({
        message: 'ANTT Coffee API Server',
        version: '1.0.0',
        endpoints: {
            menu: '/api/menu',
            product: '/api/product/:id',
            vouchers: '/api/vouchers',
            orders: '/api/orders'
        }
    });
});

// 1. Menu & Sản phẩm (Có upload)
app.get('/api/menu', getListofProducts);
app.post('/api/menu', upload.single('image'), saveProduct);

app.get('/api/product/:id', getProductById);

// 2. Voucher
app.get('/api/vouchers', getVouchers);
app.post('/api/vouchers', createVoucher);

// 3. Đơn hàng
app.get('/api/orders', getOrders);
app.put('/api/orders/:id', updateOrderStatus);

export default app;