# Wordword

A web app to note down new words while you learn a language.

## What it does

You save new words. Each word has these fields:

| word | meaning | sentence | checkbox        | timestamp (DD-MM) |
| ---- | ------- | -------- | --------------- | ----------------- |
| ord  | word    | ny ord   | [ ][ ][ ][ ][ ] | 05-10             |

- The meaning is hidden by default. Click it to show the meaning.
- If you know the word without clicking, tick one checkbox. This is a self-check. The app does nothing with it.
- You can tick up to 5 boxes per word.

## Sorting

You can sort the words by:

- the word
- how many times it is checked
- when the word was added

## Tech

- Built with SvelteKit.
- The server saves all words in a JSON file.
- Every device talks to the same server, so your words stay in sync.

## Run it

```bash
pnpm install
pnpm dev
```

Then open the address shown in the terminal.

