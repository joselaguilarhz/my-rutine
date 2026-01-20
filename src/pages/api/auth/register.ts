import type { APIRoute } from 'astro';
import { createSession, hashPassword, buildSessionCookie } from '../../../lib/auth';
import { getPool } from '../../../lib/db';

export const POST: APIRoute = async ({ request }) => {
	try {
		const body = await request.json();
		const email = String(body.email || '').trim().toLowerCase();
		const password = String(body.password || '');
		if (!email || password.length < 6) {
			return new Response(JSON.stringify({ error: 'Datos invalidos' }), { status: 400 });
		}

		const pool = getPool();
		const { rows: existing } = await pool.query('select id from users where email = $1', [email]);
		if (existing.length) {
			return new Response(JSON.stringify({ error: 'Email ya registrado' }), { status: 409 });
		}

		const passwordHash = await hashPassword(password);
		const { rows } = await pool.query(
			'insert into users (email, password_hash) values ($1, $2) returning id',
			[email, passwordHash]
		);
		const userId = rows[0].id;
		await pool.query('insert into profiles (user_id, email) values ($1, $2)', [userId, email]);

		const session = await createSession(userId);
		return new Response(JSON.stringify({ ok: true, email }), {
			status: 201,
			headers: {
				'Content-Type': 'application/json',
				'Set-Cookie': buildSessionCookie(session.token, session.expiresAt),
			},
		});
	} catch (error) {
		return new Response(JSON.stringify({ error: 'Error de servidor' }), { status: 500 });
	}
};
