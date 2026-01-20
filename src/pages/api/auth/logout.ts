import type { APIRoute } from 'astro';
import { clearSessionCookie, deleteSession, getSessionToken } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
	try {
		const token = getSessionToken(request);
		if (token) {
			await deleteSession(token);
		}
		return new Response(JSON.stringify({ ok: true }), {
			status: 200,
			headers: {
				'Content-Type': 'application/json',
				'Set-Cookie': clearSessionCookie(),
			},
		});
	} catch {
		return new Response(JSON.stringify({ error: 'Error de servidor' }), { status: 500 });
	}
};
