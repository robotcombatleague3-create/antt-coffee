const express = require('express');
const mysql = require('mysql');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',  
    password: 'Admin@123', 
    database: 'coffee_shop'
});

db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to database');
});

// API đăng ký
app.post('/api/register', (req, res) => {
    const { username, email, password } = req.body;
    
    // Kiểm tra username đã tồn tại
    db.query('SELECT * FROM users WHERE username = ?', [username], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (result.length > 0) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Thêm user mới
        const user = { username, email, password, role: 'user' };
        db.query('INSERT INTO users SET ?', user, (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Registration failed' });
            }
            res.json({ success: true });
        });
    });
});

// API đăng nhập
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    db.query('SELECT * FROM users WHERE username = ? AND password = ?', 
        [username, password], (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (results.length > 0) {
                const user = results[0];
                res.json({
                    success: true,
                    user: {
                        username: user.username,
                        role: user.role
                    }
                });
            } else {
                res.status(401).json({ error: 'Invalid username or password' });
            }
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});