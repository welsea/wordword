export const CHECKBOX_COUNT = 6;

export interface Word {
	id: string;
	word: string;
	meaning: string;
	sentence: string;
	/** Which of the self-check boxes are ticked. Length is always CHECKBOX_COUNT. */
	checks: boolean[];
	/** Epoch milliseconds when the word was added. */
	createdAt: number;
}

export type NewWord = Pick<Word, 'word' | 'meaning' | 'sentence' >;

export type SortKey = 'word' | 'checked' | 'added';
