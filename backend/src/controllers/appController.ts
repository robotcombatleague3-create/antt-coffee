import type { Request, Response } from 'express';
import { getDbConnection } from '../models/database';

export const getListofProducts = async (req: Request, res: Response) => {
	const conn = await getDbConnection();
	if (!conn) {
		return res.status(500).json({
			success: false,
			message: "Database connection error"
		})
	}

	try {
		const [products] = await conn.execute(
			'SELECT name, price, category, image, description FROM products ORDER BY name'
		);

		return res.status(200).json({
			success: true,
			data: products,
		});
	} catch (error) {
		console.error("Error while getting list of products:", error);
		return res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	} finally {
		await conn.end();
	}
}
