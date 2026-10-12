import postgresFactory from 'postgres';
import { randomUUID } from 'node:crypto';
import { CHECKBOX_COUNT, type NewWord, type Word } from '../types';

type Sql = ReturnType<typeof postgresFactory>;

interface Row {
	id: string;
	word: string;
	meaning: string;
	sentence: string;
	checks: boolean[];
	created_at: string; // bigint is returned as a string
}

let ready: Promise<Sql> | null = null;

// Connect lazily and ensure the schema exists on first use.
function connect(): Promise<Sql> {
	ready ??= (async () => {
		const url = process.env.DATABASE_URL;
		if (!url) throw new Error('DATABASE_URL is not set');
		const sql = postgresFactory(url);
		await sql`
			CREATE TABLE IF NOT EXISTS words (
				id uuid PRIMARY KEY,
				word text NOT NULL,
				meaning text NOT NULL DEFAULT '',
				sentence text NOT NULL DEFAULT '',
				checks boolean[] NOT NULL,
				created_at bigint NOT NULL
			)
		`;
		return sql;
	})();
	return ready;
}

function toWord(r: Row): Word {
	return {
		id: r.id,
		word: r.word,
		meaning: r.meaning,
		sentence: r.sentence,
		checks: Array.from({ length: CHECKBOX_COUNT }, (_, i) => Boolean(r.checks[i])),
		createdAt: Number(r.created_at)
	};
}

export async function listWords(): Promise<Word[]> {
	const sql = await connect();
	const rows = await sql<Row[]>`SELECT * FROM words ORDER BY created_at DESC`;
	return rows.map(toWord);
}

export async function addWord(input: NewWord): Promise<Word> {
	const sql = await connect();
	const word: Word = {
		id: randomUUID(),
		word: input.word.trim(),
		meaning: input.meaning.trim(),
		sentence: input.sentence.trim(),
		checks: Array(CHECKBOX_COUNT).fill(false),
		createdAt: Date.now()
	};
	await sql`
		INSERT INTO words (id, word, meaning, sentence, checks, created_at)
		VALUES (${word.id}, ${word.word}, ${word.meaning}, ${word.sentence}, ${word.checks}, ${word.createdAt})
	`;
	return word;
}

export async function updateChecks(id: string, checks: boolean[]): Promise<Word | null> {
	const sql = await connect();
	const normalized = Array.from({ length: CHECKBOX_COUNT }, (_, i) => Boolean(checks[i]));
	const rows = await sql<Row[]>`
		UPDATE words SET checks = ${normalized} WHERE id = ${id} RETURNING *
	`;
	return rows.length ? toWord(rows[0]) : null;
}

export async function deleteWord(id: string): Promise<boolean> {
	const sql = await connect();
	const rows = await sql`DELETE FROM words WHERE id = ${id} RETURNING id`;
	return rows.count > 0;
}
