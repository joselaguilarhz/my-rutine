import type { APIRoute } from 'astro';
import { getSessionUser } from '../../../lib/auth';

export const GET: APIRoute = async ({ request }) => {
	try {
		const user = await getSessionUser(request);
		if (!user) {
			return new Response(JSON.stringify({ user: null }), { status: 401 });
		}
		return new Response(JSON.stringify({ user }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch {
		return new Response(JSON.stringify({ error: 'Error de servidor' }), { status: 500 });
	}
};
