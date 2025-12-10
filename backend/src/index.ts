/**
 * Entry point for ANTT Coffee Backend
 * Location: backend/src/index.ts
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import session from 'express-session';
import path from 'path';

// Import cấu hình từ utils/config.ts và module database
import { dbConfig } from './utils/config';
import { getDbConnection } from './models/database';

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// 1. MIDDLEWARE CONFIGURATION
// ==========================================

// Cấu hình CORS
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));

// Parse dữ liệu JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cấu hình Session
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this-in-production-min-32-chars',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', 
        maxAge: 24 * 60 * 60 * 1000 // 24 giờ
    }
}));

// ==========================================
// 2. ROUTES
// ==========================================
const frontendPath = path.join(__dirname, '../../frontend');

app.use(express.static(frontendPath));

// Route kiểm tra server (Health Check)
app.get('/', (req: Request, res: Response) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// THÊM CÁC ROUTES KHÁC Ở ĐÂY
app.get('/menu', (req, res) => res.sendFile(path.join(frontendPath, 'menu.html')));
app.get('/login', (req, res) => res.sendFile(path.join(frontendPath, 'login.html')));


// ==========================================
// 3. SERVER & DATABASE STARTUP
// ==========================================

async function startServer() {
    try {
        console.log('⏳ Initializing server...');

        // KIỂM TRA KẾT NỐI DATABASE
        const connection = await getDbConnection();
        
        if (connection) {
            console.log(`✅ Database connection successful! Target: ${dbConfig.database}`);
            await connection.end(); // Đóng kết nối kiểm tra
            
            // Khởi động Express Server
            app.listen(PORT, () => {
                console.log(`=================================`);
                console.log(`🚀 Server is running!`);
                console.log(`👉 URL: http://localhost:${PORT}`);
                console.log(`=================================`);
            });
        } else {
            console.error('❌ Could not connect to the database. Server will not start.');
            console.error('Please check your MySQL server status and .env configuration (DB_USER, DB_PASSWORD, DB_NAME).');
            process.exit(1);
        }

    } catch (error) {
        console.error('❌ Error during server startup:', error);
        process.exit(1);
    }
}

// Chạy hàm khởi động
startServer();