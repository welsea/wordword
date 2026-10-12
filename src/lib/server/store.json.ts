import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { CHECKBOX_COUNT, type NewWord, type Word } from '../types';

const DATA_FILE = process.env.WORDS_DATA_FILE ?? join(process.cwd(), 'data', 'words.json');

// Serialize writes so concurrent requests can't corrupt the file.
let queue: Promise<unknown> = Promise.resolve();

async function readAll(): Promise<Word[]> {
	try {
		const raw = await readFile(DATA_FILE, 'utf8');
		const parsed = JSON.parse(raw) as Word[];
		return Array.isArray(parsed) ? parsed : [];
	} catch (err) {
		if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
		throw err;
	}
}

async function writeAll(words: Word[]): Promise<void> {
	await mkdir(dirname(DATA_FILE), { recursive: true });
	await writeFile(DATA_FILE, JSON.stringify(words, null, 2), 'utf8');
}

function enqueue<T>(task: () => Promise<T>): Promise<T> {
	const run = queue.then(task, task);
	queue = run.catch(() => undefined);
	return run;
}

export function listWords(): Promise<Word[]> {
	return enqueue(readAll);
}

export function addWord(input: NewWord): Promise<Word> {
	return enqueue(async () => {
		const words = await readAll();
		const word: Word = {
			id: randomUUID(),
			word: input.word.trim(),
			meaning: input.meaning.trim(),
			sentence: input.sentence.trim(),
			checks: Array(CHECKBOX_COUNT).fill(false),
			createdAt: Date.now()
		};
		words.push(word);
		await writeAll(words);
		return word;
	});
}

export function updateChecks(id: string, checks: boolean[]): Promise<Word | null> {
	return enqueue(async () => {
		const words = await readAll();
		const word = words.find((w) => w.id === id);
		if (!word) return null;
		word.checks = Array.from({ length: CHECKBOX_COUNT }, (_, i) => Boolean(checks[i]));
		await writeAll(words);
		return word;
	});
}

export function deleteWord(id: string): Promise<boolean> {
	return enqueue(async () => {
		const words = await readAll();
		const next = words.filter((w) => w.id !== id);
		if (next.length === words.length) return false;
		await writeAll(next);
		return true;
	});
}
