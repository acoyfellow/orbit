<script lang="ts">
  import type { Brief, Evidence, RunSpec } from "./contracts.js";
  import { summarizeRun } from "./ui-summary.js";
  let { initialBrief }: { initialBrief: Brief } = $props();
  let brief = $state(initialBrief);
  let runSpec = $state<RunSpec | undefined>();
  let selected = $state<string | null>(brief.evidence[0]?.id ?? null);
  let running = $state(false);
  let error = $state<string | null>(null);
  let isFixture = $state(true);
  const referencedEvidence = (ids: string[] | undefined) =>
    (Array.isArray(ids) ? ids : [])
      .map((id) => brief.evidence.find((item) => item.id === id))
      .filter((item): item is Evidence => Boolean(item));
  const selectedEvidence = () =>
    brief.evidence.find((item) => item.id === selected);
  const summary = () => summarizeRun(brief, runSpec);
  function choose(id: string) {
    selected = id;
  }
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
      runSpec = spec;
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
    <button class="run" onclick={runExample} disabled={running}
      >{running ? "Collecting public evidence…" : "Run public example"}</button
    >
  </div>
</header>
<div class="sr-only" role="status" aria-live="polite">
  {running
    ? "Public evidence collection in progress."
    : error
      ? "Run failed; fixture remains visible."
      : isFixture
        ? "Checked-in fixture displayed."
        : "Public evidence run complete."}
</div>
{#if error}<div class="error" role="alert">
    <b>Run failed.</b>
    {error} The fixture remains visible.
  </div>{/if}
<main aria-busy={running}>
  <section class="run-summary" aria-labelledby="run-summary-heading">
    <div class="eyebrow" id="run-summary-heading">Pipeline / run summary</div>
    <dl>
      <div>
        <dt>Adapters</dt>
        <dd>
          {summary().adapters.join(", ") || "Fixture metadata unavailable"}
        </dd>
      </div>
      <div>
        <dt>Sources</dt>
        <dd>{summary().sourceCount}</dd>
      </div>
      <div>
        <dt>Timing</dt>
        <dd>{summary().durationMs} ms</dd>
      </div>
      <div>
        <dt>Lenses</dt>
        <dd>
          {summary().lenses.join(" → ") || "Fixture metadata unavailable"}
        </dd>
      </div>
      <div>
        <dt>Outputs</dt>
        <dd>
          {summary().evidenceCount} evidence · {summary().claimCount} claims · {summary()
            .gapCount} gaps · {summary().proposalCount} proposals
        </dd>
      </div>
    </dl>
  </section>
  <section>
    <div class="eyebrow">Claims</div>
    {#if brief.claims.length === 0}<p class="empty">
        No claims were produced.
      </p>{/if}
    {#each brief.claims as claim}<article>
        <h2>{claim.text}</h2>
        <EvidenceControls ids={claim.evidenceIds} />
      </article>{/each}
  </section>
  <aside>
    <div class="eyebrow">Evidence ledger · {brief.evidence.length}</div>
    {#if brief.evidence.length === 0}<p class="empty">
        No evidence was collected for this run.
      </p>{/if}
    {#each brief.evidence as item}<button
        class="ledger-item"
        class:selected={selected === item.id}
        aria-pressed={selected === item.id}
        onclick={() => choose(item.id)}
        ><strong>{item.title}</strong><small
          >{item.sourceId} · {item.visibility}</small
        ><code>{item.digest.slice(0, 18)}…</code></button
      >{/each}
    {#if selectedEvidence()}{@const item = selectedEvidence()!}
      <section
        class="evidence-detail"
        aria-labelledby="evidence-detail-heading"
      >
        <div class="eyebrow" id="evidence-detail-heading">
          Selected evidence
        </div>
        <h3>{item.title}</h3>
        <p>{item.summary || "No summary supplied."}</p>
        <dl>
          <div>
            <dt>Source</dt>
            <dd>{item.sourceId}</dd>
          </div>
          <div>
            <dt>Retrieved</dt>
            <dd>{new Date(item.retrievedAt).toLocaleString()}</dd>
          </div>
          <div>
            <dt>Visibility</dt>
            <dd>{item.visibility}</dd>
          </div>
          <div>
            <dt>Digest</dt>
            <dd><code>{item.digest}</code></dd>
          </div>
        </dl>
        <a
          href={item.itemUrl ?? item.sourceUrl}
          target="_blank"
          rel="noopener noreferrer">Open source ↗</a
        >
      </section>{/if}
  </aside>
  <section class="lower">
    <div>
      <div class="eyebrow">Visible gaps</div>
      {#if brief.gaps.length === 0}<p class="empty">
          No gaps were identified.
        </p>{/if}{#each brief.gaps as gap}<article>
          <p>{gap.text}</p>
          <EvidenceControls ids={gap.evidenceIds} />
        </article>{/each}
    </div>
    <div>
      <div class="eyebrow">Proposed actions</div>
      {#if brief.proposals.length === 0}<p class="empty">
          No actions were proposed.
        </p>{/if}{#each brief.proposals as proposal}<article class="proposal">
          <span>Approval required</span>
          <h3>{proposal.text}</h3>
          <EvidenceControls ids={proposal.evidenceIds} />
        </article>{/each}
    </div>
  </section>
</main>
<footer>
  Completed {new Date(brief.completedAt).toLocaleString()} ·
  <code>{brief.runId}</code> · No actions executed
</footer>

{#snippet EvidenceControls(ids: string[])}
  <div class="evidence-controls" aria-label="Supporting evidence">
    {#if ids.length === 0}<small>No supporting evidence linked.</small>{/if}
    {#each referencedEvidence(ids) as item}<button
        class:active={selected === item.id}
        aria-pressed={selected === item.id}
        onclick={() => choose(item.id)}>{item.id}</button
      >{/each}
  </div>
{/snippet}

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
  .run-summary {
    grid-column: 1/-1;
    border-bottom: 1px solid #a8aea7;
    padding-bottom: 20px;
  }
  .run-summary dl {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 28px;
  }
  .run-summary dl div {
    min-width: 120px;
  }
  .run-summary dt,
  .evidence-detail dt {
    font-size: 10px;
    text-transform: uppercase;
    color: #67716c;
  }
  .run-summary dd,
  .evidence-detail dd {
    margin: 2px 0 0;
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
  .evidence-controls {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .evidence-controls button {
    border: 1px solid #aab2ab;
    background: transparent;
    border-radius: 999px;
    padding: 5px 9px;
    color: #477a61;
    cursor: pointer;
  }
  .evidence-controls button.active {
    background: #173f30;
    color: white;
  }
  aside {
    border-left: 1px solid #c8cbc5;
    padding-left: 22px;
  }
  .ledger-item {
    display: flex;
    width: 100%;
    text-align: left;
    flex-direction: column;
    gap: 4px;
    padding: 14px;
    background: transparent;
    color: inherit;
    border: 1px solid transparent;
    overflow-wrap: anywhere;
    cursor: pointer;
  }
  .ledger-item.selected {
    background: #fff;
    border-color: #bcc4bc;
    box-shadow: 3px 3px 0 #477a61;
  }
  .evidence-detail {
    margin-top: 20px;
    padding: 18px;
    background: #fff;
    border: 1px solid #bcc4bc;
    overflow-wrap: anywhere;
  }
  .evidence-detail h3 {
    margin: 9px 0;
  }
  .evidence-detail dl div {
    margin: 8px 0;
  }
  .evidence-detail dd {
    margin-left: 0;
  }
  .evidence-detail a {
    display: inline-block;
    margin-top: 8px;
    color: #173f30;
    font-weight: 700;
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
  .empty {
    color: #67716c;
    font-style: italic;
  }
  footer {
    padding: 22px 24px 50px;
    color: #66716b;
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  button:focus-visible,
  a:focus-visible {
    outline: 3px solid #d4772c;
    outline-offset: 3px;
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
    .run-summary {
      grid-column: auto;
    }
    .run-summary dl {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }
    aside {
      border: 0;
      padding: 0;
    }
    .lower {
      grid-column: auto;
      grid-template-columns: minmax(0, 1fr);
    }
    h2 {
      font-size: 21px;
    }
  }
</style>
