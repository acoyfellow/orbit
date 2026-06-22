<script lang="ts">
  import type { Brief, RunSpec } from "./contracts.js";
  let { initialBrief }: { initialBrief: Brief } = $props();
  let brief = $state(initialBrief);
  let selected = $state<string | null>(brief.evidence[0]?.id ?? null);
  let running = $state(false);
  let error = $state<string | null>(null);
  let isFixture = $state(true);
  const evidence = (ids: string[]) =>
    ids.map((id) => brief.evidence.find((e) => e.id === id)).filter(Boolean);
  async function runExample() {
    running = true;
    error = null;
    try {
      const specResponse = await fetch("/api/example");
      if (!specResponse.ok)
        throw new Error("Could not load the public example.");
      const spec = (await specResponse.json()) as RunSpec;
      const response = await fetch("/api/runs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(spec),
      });
      const body = (await response.json()) as Brief | { error?: string };
      if (!response.ok)
        throw new Error("error" in body ? body.error : "Run failed.");
      brief = body as Brief;
      selected = brief.evidence[0]?.id ?? null;
      isFixture = false;
    } catch (cause) {
      error = cause instanceof Error ? cause.message : "Run failed.";
    } finally {
      running = false;
    }
  }
</script>

<svelte:head
  ><meta name="description" content="Orbit evidence review" /></svelte:head
>
<header>
  <div>
    <span class="brand">ORBIT / REVIEW</span>
    <h1>{brief.specName}</h1>
  </div>
  <div class="controls">
    <span class:live={!isFixture}
      >{isFixture
        ? "Checked-in fixture · not live"
        : "Current public run"}</span
    >
    <button class="run" onclick={runExample} disabled={running}>
      {running ? "Collecting public evidence…" : "Run public example"}
    </button>
  </div>
</header>
{#if error}<div class="error" role="alert">
    <b>Run failed.</b>
    {error} The fixture remains visible.
  </div>{/if}
<main aria-busy={running}>
  <section>
    <div class="eyebrow">Claims</div>
    {#each brief.claims as claim}<article>
        <h2>{claim.text}</h2>
        <div>
          {#each evidence(claim.evidenceIds) as e}<button
              class:active={selected === e?.id}
              onclick={() => (selected = e?.id)}>{e?.id}</button
            >{/each}
        </div>
      </article>{/each}
  </section>
  <aside>
    <div class="eyebrow">Evidence ledger · {brief.evidence.length}</div>
    {#each brief.evidence as e}<a
        class:selected={selected === e.id}
        href={e.itemUrl ?? e.sourceUrl}
        target="_blank"
        rel="noreferrer"
        ><strong>{e.title}</strong><small>{e.sourceId} · {e.visibility}</small
        ><code>{e.digest.slice(0, 18)}…</code></a
      >{/each}
  </aside>
  <section class="lower">
    <div>
      <div class="eyebrow">Visible gaps</div>
      {#each brief.gaps as gap}<p>{gap.text}</p>{/each}
    </div>
    <div>
      <div class="eyebrow">Approval queue</div>
      {#each brief.proposals as p}<article class="proposal">
          <span>Approval required</span>
          <h3>{p.text}</h3>
        </article>{/each}
    </div>
  </section>
</main>
<footer>
  Completed {new Date(brief.completedAt).toLocaleString()} ·
  <code>{brief.runId}</code> · No actions executed
</footer>

<style>
  :global(*) {
    box-sizing: border-box;
  }
  :global(body) {
    margin: 0;
    background: #f2f0ea;
    color: #17201d;
    font:
      14px/1.45 system-ui,
      sans-serif;
  }
  header,
  main,
  footer,
  .error {
    max-width: 1120px;
    margin: auto;
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: end;
    gap: 24px;
    padding: 54px 24px 28px;
    border-bottom: 1px solid #a8aea7;
  }
  .brand,
  .eyebrow {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: #477a61;
  }
  h1 {
    font:
      clamp(34px, 6vw, 64px) / 1 Georgia,
      serif;
    margin: 8px 0 0;
  }
  .controls {
    display: flex;
    flex-direction: column;
    align-items: end;
    gap: 10px;
  }
  .controls span {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    color: #8b542e;
  }
  .controls span.live {
    color: #347151;
  }
  .run {
    border: 0;
    background: #173f30;
    color: white;
    border-radius: 3px;
    padding: 11px 16px;
    font-weight: 700;
    cursor: pointer;
  }
  .run:disabled {
    opacity: 0.58;
    cursor: wait;
  }
  .error {
    padding: 14px 24px;
    background: #f5d6cf;
    color: #762d21;
  }
  main {
    padding: 28px 24px;
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 34px;
  }
  article {
    padding: 20px 0;
    border-bottom: 1px solid #c8cbc5;
  }
  h2 {
    font:
      24px/1.25 Georgia,
      serif;
    margin: 0 0 12px;
  }
  article button {
    border: 1px solid #aab2ab;
    background: transparent;
    border-radius: 999px;
    padding: 5px 9px;
    color: #477a61;
    cursor: pointer;
  }
  article button.active {
    background: #173f30;
    color: white;
  }
  aside {
    border-left: 1px solid #c8cbc5;
    padding-left: 22px;
  }
  aside a {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 14px;
    text-decoration: none;
    color: inherit;
    border: 1px solid transparent;
    overflow-wrap: anywhere;
  }
  aside a.selected {
    background: #fff;
    border-color: #bcc4bc;
    box-shadow: 3px 3px 0 #477a61;
  }
  small,
  code {
    color: #67716c;
    font-size: 11px;
  }
  .lower {
    grid-column: 1/-1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 34px;
    border-top: 1px solid #a8aea7;
    padding-top: 26px;
  }
  .proposal span {
    font-size: 10px;
    text-transform: uppercase;
    background: #e6b94f;
    padding: 4px 7px;
    border-radius: 2px;
  }
  footer {
    padding: 22px 24px 50px;
    color: #66716b;
  }
  @media (max-width: 720px) {
    header {
      align-items: stretch;
      flex-direction: column;
      padding-top: 34px;
    }
    .controls {
      align-items: stretch;
    }
    .controls span {
      text-align: left;
    }
    .run {
      width: 100%;
    }
    main {
      grid-template-columns: minmax(0, 1fr);
      gap: 28px;
    }
    aside {
      border: 0;
      padding: 0;
    }
    .lower {
      grid-template-columns: minmax(0, 1fr);
    }
    h2 {
      font-size: 21px;
    }
  }
</style>
