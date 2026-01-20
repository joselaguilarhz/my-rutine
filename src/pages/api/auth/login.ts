import type { APIRoute } from 'astro';
import { buildSessionCookie, createSession, verifyPassword } from '../../../lib/auth';
import { getPool } from '../../../lib/db';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
	try {
		const body = await request.json();
		const email = String(body.email || '').trim().toLowerCase();
		const password = String(body.password || '');
		if (!email || !password) {
			return new Response(JSON.stringify({ error: 'Datos invalidos' }), { status: 400 });
		}

		const pool = getPool();
		const { rows } = await pool.query('select id, password_hash from users where email = $1', [email]);
		if (!rows.length) {
			return new Response(JSON.stringify({ error: 'Credenciales invalidas' }), { status: 401 });
		}

		const user = rows[0];
		const valid = await verifyPassword(password, user.password_hash);
		if (!valid) {
			return new Response(JSON.stringify({ error: 'Credenciales invalidas' }), { status: 401 });
		}

		const session = await createSession(user.id);
		return new Response(JSON.stringify({ ok: true, email }), {
			status: 200,
			headers: {
				'Content-Type': 'application/json',
				'Set-Cookie': buildSessionCookie(session.token, session.expiresAt),
			},
		});
	} catch {
		return new Response(JSON.stringify({ error: 'Error de servidor' }), { status: 500 });
	}
};
