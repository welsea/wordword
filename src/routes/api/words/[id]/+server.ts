import { json, error } from '@sveltejs/kit';
import { deleteWord, updateChecks } from '#lib/server/store';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, request }) => {
	const body = (await request.json().catch(() => null)) as { checks?: unknown } | null;
	if (!body || !Array.isArray(body.checks)) {
		throw error(400, 'Expected a "checks" boolean array.');
	}
	const updated = await updateChecks(params.id, body.checks.map(Boolean));
	if (!updated) throw error(404, 'Word not found.');
	return json(updated);
};

export const DELETE: RequestHandler = async ({ params }) => {
	const ok = await deleteWord(params.id);
	if (!ok) throw error(404, 'Word not found.');
	return new Response(null, { status: 204 });
};
