import { Pool } from 'pg';

let pool: Pool | null = null;

export const getPool = () => {
	if (!pool) {
		const connectionString = import.meta.env.DATABASE_URL || import.meta.env.POSTGRES_URL;
		if (!connectionString) {
			throw new Error('DATABASE_URL is not set');
		}
		pool = new Pool({ connectionString });
	}
	return pool;
};
