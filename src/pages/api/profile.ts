import type { APIRoute } from 'astro';
import { getSessionUser } from '../../lib/auth';
import { getPool } from '../../lib/db';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
	try {
		const user = await getSessionUser(request);
		if (!user) {
			return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
		}

		const pool = getPool();
		const { rows } = await pool.query(
			`select
				profiles.name,
				coalesce(profiles.email, users.email) as email,
				profiles.age,
				profiles.sex,
				profiles.height,
				profiles.weight,
				profiles.body_fat as "bodyFat",
				profiles.activity,
				profiles.goal,
				profiles.sleep,
				profiles.training_days as "trainingDays"
			 from profiles
			 join users on users.id = profiles.user_id
			 where profiles.user_id = $1`,
			[user.id]
		);
		return new Response(JSON.stringify({ profile: rows[0] || null }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch {
		return new Response(JSON.stringify({ error: 'Error de servidor' }), { status: 500 });
	}
};

export const POST: APIRoute = async ({ request }) => {
	try {
		const user = await getSessionUser(request);
		if (!user) {
			return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
		}

		const body = await request.json();
		const pool = getPool();

		if (body.reset) {
			await pool.query(
				`update profiles
				 set name = null,
					 email = null,
					 age = null,
					 sex = null,
					 height = null,
					 weight = null,
					 body_fat = null,
					 activity = null,
					 goal = null,
					 sleep = null,
					 training_days = null,
					 updated_at = now()
				 where user_id = $1`,
				[user.id]
			);
			return new Response(JSON.stringify({ ok: true }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		const email = String(body.email || '').trim().toLowerCase();
		if (email && email !== user.email) {
			const { rows: existing } = await pool.query('select id from users where email = $1', [email]);
			if (existing.length) {
				return new Response(JSON.stringify({ error: 'Email ya registrado' }), { status: 409 });
			}
			await pool.query('update users set email = $1 where id = $2', [email, user.id]);
		}

		await pool.query(
			`insert into profiles (user_id, name, email, age, sex, height, weight, body_fat, activity, goal, sleep, training_days, updated_at)
			 values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now())
			 on conflict (user_id)
			 do update set
				name = excluded.name,
				email = excluded.email,
				age = excluded.age,
				sex = excluded.sex,
				height = excluded.height,
				weight = excluded.weight,
				body_fat = excluded.body_fat,
				activity = excluded.activity,
				goal = excluded.goal,
				sleep = excluded.sleep,
				training_days = excluded.training_days,
				updated_at = now()`,
			[
				user.id,
				body.name || null,
				email || null,
				body.age ? Number(body.age) : null,
				body.sex || null,
				body.height ? Number(body.height) : null,
				body.weight ? Number(body.weight) : null,
				body.bodyFat ? Number(body.bodyFat) : null,
				body.activity ? Number(body.activity) : null,
				body.goal || null,
				body.sleep ? Number(body.sleep) : null,
				body.trainingDays ? Number(body.trainingDays) : null,
			]
		);

		return new Response(JSON.stringify({ ok: true }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch {
		return new Response(JSON.stringify({ error: 'Error de servidor' }), { status: 500 });
	}
};
