import express from 'express';
import type { Request, Response, NextFunction, Router } from 'express';
import session from 'express-session';
import connectFlash from 'connect-flash';
import cors from 'cors';
import { getListofProducts } from '../controllers/appController';

dotenv.config();

const app = express();

app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = [
            process.env.FRONTEND_URL || 'http://localhost:5173',
            'http://localhost:5174',
        ];

        if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:5174')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },

    credentials: true ,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public'))); // Assuming public folder for static

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views')); // Assuming views folder

app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key', // Use env var
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Set to true in production with HTTPS
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    }
}));

app.use(connectFlash());
app.use((req: Request, res: Response, next: NextFunction) => {
    res.locals.messages = req.flash();
    next();
});


app.get('api/menu', getListofProducts);

export default app;