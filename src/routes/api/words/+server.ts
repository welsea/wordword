import { json, error } from '@sveltejs/kit';
import { addWord, listWords } from '#lib/server/store';
import type { NewWord } from '#lib/types';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	return json(await listWords());
};

export const POST: RequestHandler = async ({ request }) => {
	const body = (await request.json().catch(() => null)) as Partial<NewWord> | null;
	if (!body || typeof body.word !== 'string' || body.word.trim() === '') {
		throw error(400, 'A "word" is required.');
	}
	const created = await addWord({
		word: body.word,
		meaning: typeof body.meaning === 'string' ? body.meaning : '',
		sentence: typeof body.sentence === 'string' ? body.sentence : '',
		otherFormat: typeof body.otherFormat === 'string' ? body.otherFormat : ''
	});
	return json(created, { status: 201 });
};
