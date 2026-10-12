// Use Postgres when DATABASE_URL is set (production), otherwise a local JSON file.
import * as jsonStore from './store.json';
import * as postgresStore from './store.postgres';

const backend = process.env.DATABASE_URL ? postgresStore : jsonStore;

export const listWords = backend.listWords;
export const addWord = backend.addWord;
export const updateChecks = backend.updateChecks;
export const deleteWord = backend.deleteWord;
