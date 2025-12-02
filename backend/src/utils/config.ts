/**
 * Configuration Module
 * 
 * Loads and validates environment variables for application configuration.
 * Provides database connection settings and other environment-specific values.
 * 
 * @module utils/config
 */

import dotenv from 'dotenv';

dotenv.config();

export const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tutor_db',
    port: parseInt(process.env.DB_PORT || '3306'),
    // Additional MySQL options
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
};