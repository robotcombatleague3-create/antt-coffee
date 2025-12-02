/**
 * Database Connection Module
 * 
 * Manages MySQL database connections using mysql2/promise.
 * Provides a connection factory function for database operations.
 * 
 * @module models/database
 */

import mysql from 'mysql2/promise';
import { dbConfig } from '../utils/config';

export async function getDbConnection() {
    try {
        const conn = await mysql.createConnection(dbConfig);
        return conn;
    } catch (err) {
        console.error('Database connection error:', err);
        return null;
    }
}