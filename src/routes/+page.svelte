<script lang="ts">
    import type { Word, SortKey } from "#lib/types";
    import type { PageProps } from "./$types";

    let { data }: PageProps = $props();

    let words = $state<Word[]>(data.words);
    let sortKey = $state<SortKey>("added");
    let sortDir = $state<"asc" | "desc">("desc");
    let revealed = $state<Record<string, boolean>>({});

    // New-word form fields
    let word = $state("");
    let meaning = $state("");
    let sentence = $state("");
    let otherFormat = $state("");
    let saving = $state(false);
    let errorMsg = $state("");

    const checkedCount = (w: Word) => w.checks.filter(Boolean).length;

    const sorted = $derived.by(() => {
        const list = [...words];
        const dir = sortDir === "asc" ? 1 : -1;
        list.sort((a, b) => {
            let cmp = 0;
            if (sortKey === "word") cmp = a.word.localeCompare(b.word);
            else if (sortKey === "checked") cmp = checkedCount(a) - checkedCount(b);
            else cmp = a.createdAt - b.createdAt;
            return cmp * dir;
        });
        return list;
    });

    function setSort(key: SortKey) {
        if (sortKey === key) {
            sortDir = sortDir === "asc" ? "desc" : "asc";
        } else {
            sortKey = key;
            sortDir = key === "word" ? "asc" : "desc";
        }
    }

    function formatDate(ms: number): string {
        const d = new Date(ms);
        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        return `${dd}-${mm}`;
    }

    async function addWord(event: SubmitEvent) {
        event.preventDefault();
        if (!word.trim()) return;
        saving = true;
        errorMsg = "";
        try {
            const res = await fetch("/api/words", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ word, meaning, sentence, otherFormat }),
            });
            if (!res.ok) throw new Error(await res.text());
            const created: Word = await res.json();
            words = [...words, created];
            word = meaning = sentence = otherFormat = "";
        } catch (err) {
            errorMsg = err instanceof Error ? err.message : "Failed to add word.";
        } finally {
            saving = false;
        }
    }

    async function toggleCheck(w: Word, index: number) {
        const nextChecks = w.checks.map((c: any, i: any) => (i === index ? !c : c));
        // optimistic update
        words = words.map((x) => (x.id === w.id ? { ...x, checks: nextChecks } : x));
        try {
            const res = await fetch(`/api/words/${w.id}`, {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ checks: nextChecks }),
            });
            if (!res.ok) throw new Error();
        } catch {
            // revert on failure
            words = words.map((x) => (x.id === w.id ? { ...x, checks: w.checks } : x));
        }
    }

    async function removeWord(w: Word) {
        if (!confirm(`Delete "${w.word}"?`)) return;
        const prev = words;
        words = words.filter((x) => x.id !== w.id);
        try {
            const res = await fetch(`/api/words/${w.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error();
        } catch {
            words = prev;
        }
    }
</script>

<svelte:head>
    <title>Wordword</title>
</svelte:head>

<main>
    <h1>Wordword</h1>

    <form class="add" onsubmit={addWord}>
        <input placeholder="word *" bind:value={word} required />
        <input placeholder="meaning" bind:value={meaning} />
        <input placeholder="sentence" bind:value={sentence} />
        <button type="submit" disabled={saving}>{saving ? "Adding…" : "Add"}</button>
    </form>
    {#if errorMsg}<p class="error">{errorMsg}</p>{/if}

    <div class="sorts">
        <span>Sort by:</span>
        <button class:active={sortKey === "word"} onclick={() => setSort("word")}>
            word {sortKey === "word" ? (sortDir === "asc" ? "↑" : "↓") : ""}
        </button>
        <button class:active={sortKey === "checked"} onclick={() => setSort("checked")}>
            times checked {sortKey === "checked" ? (sortDir === "asc" ? "↑" : "↓") : ""}
        </button>
        <button class:active={sortKey === "added"} onclick={() => setSort("added")}>
            date added {sortKey === "added" ? (sortDir === "asc" ? "↑" : "↓") : ""}
        </button>
    </div>

    {#if sorted.length === 0}
        <p class="empty">No words yet. Add your first one above.</p>
    {:else}
        <div class="words-list">
            {#each sorted as w (w.id)}
                <div class="word-item">
                    <div class="row">
                        <div class="word">{w.word}</div>
                        <div class="meaning">
                            {#if w.meaning}
                                <button
                                    class="reveal"
                                    class:hidden={!revealed[w.id]}
                                    onclick={() => (revealed = { ...revealed, [w.id]: !revealed[w.id] })}
                                    aria-label={revealed[w.id] ? "hide meaning" : "reveal meaning"}
                                >{w.meaning}</button>
                            {:else}
                                <span class="muted">—</span>
                            {/if}
                        </div>
                        <div class="sentence">{w.sentence || "—"}</div>
                    </div>
                    <div class="actions">
                        <div class="checks">
                            {#each w.checks as checked, i}
                                <input type="checkbox" {checked} onchange={() => toggleCheck(w, i)} aria-label={`self-check ${i + 1}`} />
                            {/each}
                        </div>
                        <div>
                            <button class="del" onclick={() => removeWord(w)} aria-label="delete">✕</button>
                        </div>
                    </div>

                </div>
            {/each}
        </div>
    {/if}
</main>

<style>
    :global(body) {
        margin: 0;
        font-family: system-ui, sans-serif;
        background: #fafafa;
        color: #1a1a1a;
    }
    main {
        max-width: 960px;
        margin: 0 auto;
        padding: 2rem 1rem;
    }
    h1 {
        margin-top: 0;
    }
    .add {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
    }
    .add input {
        flex: 1 1 140px;
        padding: 0.5rem;
        border: 1px solid #ccc;
        font-size: 0.95rem;
    }
    .add button {
        padding: 0.5rem 1rem;
        border: none;
        background: #687590;
        color: white;
        cursor: pointer;
    }
    .add button:disabled {
        opacity: 0.6;
        cursor: default;
    }
    .error {
        color: #b91c1c;
    }
    .sorts {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
        margin: 1rem 0;
        font-size: 0.9rem;
    }
    .sorts button {
        padding: 0.3rem 0.7rem;
        border: 1px solid #ccc;
        border-radius: 999px;
        background: white;
        cursor: pointer;
    }
    .sorts button.active {
        border-color: #8e9dc0;
        color: #8e9dc0;
        font-weight: 600;
    }
    .words-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        background: white;
    }
    .actions{
        display:flex;
        flex-direction: row;
    }
    .word-item {
        display: flex;
        align-items: center;
    }
    .row {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;

        align-items: center;
        padding: 0.5rem 1rem;
    }
    .word {
        font-weight: 600;
    }
    .muted {
        color: #999;
    }
    .reveal {
        border: none;
        background: transparent;
        border-radius: 4px;
        padding: 0.15rem 0.5rem;
        cursor: pointer;
        font-size: 0.95rem;
        color: inherit;
        text-align: left;
    }
    .reveal.hidden {
        background: #3b3939;
        color: transparent;
        user-select: none;
    }

    .sentence {
        font-style: italic;
        color: #555;
    }
    .checks {
        display: flex;
        flex-wrap: wrap;
        width: 4rem;
    }
    .checks input {
        width: 0.8rem;
        height: 0.8rem;
        cursor: pointer;
    }
    .date {
        white-space: nowrap;
        color: #888888;
    }
    .del {
        border: none;
        background: transparent;
        color: #b91c1c;
        cursor: pointer;
        font-size: 1rem;
    }
</style>
