import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { parse, serialize } from 'cookie';
import { getPool } from './db';

const SESSION_COOKIE = 'session_token';
const SESSION_DAYS = 7;

export const hashPassword = async (password: string) => bcrypt.hash(password, 12);

export const verifyPassword = async (password: string, hash: string) => bcrypt.compare(password, hash);

export const createSession = async (userId: string) => {
	const token = randomBytes(32).toString('hex');
	const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
	const pool = getPool();
	await pool.query(
		'insert into sessions (user_id, token, expires_at) values ($1, $2, $3)',
		[userId, token, expiresAt]
	);
	return { token, expiresAt };
};

export const deleteSession = async (token: string) => {
	const pool = getPool();
	await pool.query('delete from sessions where token = $1', [token]);
};

export const getSessionUser = async (request: Request) => {
	const cookieHeader = request.headers.get('cookie') || '';
	const cookies = parse(cookieHeader);
	const token = cookies[SESSION_COOKIE];
	if (!token) return null;

	const pool = getPool();
	const { rows } = await pool.query(
		`select users.id, users.email
		 from sessions
		 join users on users.id = sessions.user_id
		 where sessions.token = $1 and sessions.expires_at > now()`,
		[token]
	);
	return rows[0] || null;
};

export const getSessionToken = (request: Request) => {
	const cookieHeader = request.headers.get('cookie') || '';
	const cookies = parse(cookieHeader);
	return cookies[SESSION_COOKIE] || null;
};

export const buildSessionCookie = (token: string, expiresAt: Date) =>
	serialize(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: import.meta.env.PROD,
		expires: expiresAt,
	});

export const clearSessionCookie = () =>
	serialize(SESSION_COOKIE, '', {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: import.meta.env.PROD,
		expires: new Date(0),
	});
