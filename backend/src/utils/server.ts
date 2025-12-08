import app from './app'; // Lưu ý đường dẫn tương đối tùy vị trí
import { getDbConnection } from '../models/database';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        // Test kết nối MySQL
        const conn = await getDbConnection();
        if (conn) {
            console.log('✅ Connected to MySQL successfully!');
            conn.release(); // Trả kết nối về pool
        } else {
            console.error('❌ Failed to connect to MySQL. Check XAMPP!');
        }

        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error('❌ Server startup error:', error);
    }
};

startServer();