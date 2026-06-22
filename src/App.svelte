<script lang="ts">
  import type { Brief, Evidence, RunSpec, Source } from "./contracts.js";
  import { buildCoverageMatrix } from "./coverage.js";
  let { initialBrief }: { initialBrief: Brief } = $props();
  let brief = $state(initialBrief);
  let runSpec = $state<RunSpec | undefined>();
  let selected = $state<string | null>(brief.evidence[0]?.id ?? null);
  let coverageFilter = $state<{ lane: string; adapter: Source["type"] } | null>(
    null,
  );
  let running = $state(false);
  let error = $state<string | null>(null);
  let copiedProposal = $state<string | null>(null);
  let outcomeStatus = $state<"worth-follow-up" | "not-relevant" | "no-action">(
    "worth-follow-up",
  );
  let outcomeSummary = $state("");
  let copiedOutcome = $state(false);
  let isFixture = $state(true);
  const referencedEvidence = (ids: string[] | undefined) =>
    (Array.isArray(ids) ? ids : [])
      .map((id) => brief.evidence.find((item) => item.id === id))
      .filter((item): item is Evidence => Boolean(item));
  const selectedEvidence = () =>
    brief.evidence.find((item) => item.id === selected);
  const coverage = () => buildCoverageMatrix(brief, runSpec);
  const visibleEvidence = () =>
    coverageFilter
      ? brief.evidence.filter(
          (item) =>
            item.adapter === coverageFilter?.adapter &&
            item.lanes.includes(coverageFilter.lane),
        )
      : brief.evidence;
  function filterCoverage(lane: string, adapter: Source["type"]) {
    coverageFilter = { lane, adapter };
    selected =
      brief.evidence.find(
        (item) => item.adapter === adapter && item.lanes.includes(lane),
      )?.id ?? null;
  }
  // Keep this projection inside the component: svelte-hono bundles component
  // dependencies independently for SSR and hydration, while the pure helper is
  // retained separately for contract tests.
  const summary = () => {
    const spec =
      runSpec && Array.isArray(runSpec.sources) && Array.isArray(runSpec.lenses)
        ? runSpec
        : undefined;
    const started = Date.parse(brief.startedAt);
    const completed = Date.parse(brief.completedAt);
    return {
      adapters: [...new Set(spec?.sources.map((source) => source.type) ?? [])],
      sourceCount:
        spec?.sources.length ??
        new Set(brief.evidence.map((item) => item.sourceId)).size,
      durationMs:
        Number.isFinite(started) && Number.isFinite(completed)
          ? Math.max(0, completed - started)
          : 0,
      lenses: spec?.lenses.map((lens) => lens.type) ?? [],
      evidenceCount: brief.evidence.length,
      claimCount: brief.claims.length,
      gapCount: brief.gaps.length,
      proposalCount: brief.proposals.length,
    };
  };
  function choose(id: string) {
    selected = id;
  }
  async function copySuggestion(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      copiedProposal = id;
      window.setTimeout(() => {
        if (copiedProposal === id) copiedProposal = null;
      }, 1800);
    } catch {
      error = "Could not copy the suggestion.";
    }
  }
  function outcomeJson() {
    return JSON.stringify(
      {
        version: 1,
        runId: brief.runId,
        status: outcomeStatus,
        recordedAt: new Date().toISOString(),
        summary: outcomeSummary.trim() || `Manual review: ${outcomeStatus}.`,
      },
      null,
      2,
    );
  }
  async function copyOutcome() {
    try {
      await navigator.clipboard.writeText(outcomeJson());
      copiedOutcome = true;
      window.setTimeout(() => (copiedOutcome = false), 1800);
    } catch {
      error = "Could not copy the outcome JSON.";
    }
  }
  function downloadOutcome() {
    const url = URL.createObjectURL(
      new Blob([outcomeJson() + "\n"], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${brief.runId}-outcome.json`;
    link.click();
    URL.revokeObjectURL(url);
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
      coverageFilter = null;
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
    <span class="brand">ORBIT</span>
    <h1>Know what changed—and what deserves a closer look.</h1>
    <p class="lede">
      Collect recent releases from OpenAI Agents JS and the Model Context
      Protocol TypeScript SDK, plus Cloudflare engineering posts. Every finding
      stays linked to its public source.
    </p>
    <nav aria-label="Project links">
      <a href="https://github.com/acoyfellow/orbit">GitHub</a><a
        href="https://github.com/acoyfellow/orbit/blob/main/src/contracts.ts"
        >Specification</a
      ><a href="https://github.com/acoyfellow/orbit/tree/main/docs">Docs</a><a
        href="https://github.com/acoyfellow/orbit/blob/main/docs/security.md"
        >Security</a
      >
    </nav>
  </div>
  <div class="controls">
    <span class:live={!isFixture}
      >{isFixture
        ? "Checked-in fixture · not live"
        : "Current public run"}</span
    >
    <button class="run" onclick={runExample} disabled={running}
      >{running
        ? "Collecting public evidence…"
        : "Collect latest changes"}</button
    >
  </div>
</header>
<section class="orientation" aria-labelledby="orientation-heading">
  <div>
    <div class="eyebrow" id="orientation-heading">What to do here</div>
    <p>
      Run the example to collect recent public changes. Review what changed,
      open the supporting sources, inspect coverage gaps, and copy any follow-up
      worth taking elsewhere. Orbit does not execute suggestions.
    </p>
  </div>
  <ol>
    <li><b>1</b> Collect</li>
    <li><b>2</b> Inspect sources</li>
    <li><b>3</b> Choose a follow-up</li>
  </ol>
</section>
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
  {#if !isFixture}<section class="payoff">
      <div class="eyebrow">Your latest brief is ready</div>
      <h2>
        {brief.claims.length} findings from {brief.sourceReceipts.length} monitored
        sources
      </h2>
      <p>
        Open each finding’s evidence, note generated gaps, then record your
        manual decision below.
      </p>
    </section>{/if}
  <section class="receipts">
    <div class="eyebrow">Monitored sources and collection receipts</div>
    <div class="receipt-grid">
      {#each brief.sourceReceipts as receipt}<article>
          <strong>{receipt.sourceId}</strong><span>{receipt.status}</span>
          <p>
            {receipt.collectedItems} of at most {receipt.maxItems} items collected.
          </p>
          {#if receipt.truncated}<p>
              <b>Truncated:</b>
              {receipt.detail}
            </p>{/if}<a
            href={receipt.sourceUrl}
            target="_blank"
            rel="noopener noreferrer">Open source endpoint ↗</a
          >
        </article>{/each}
    </div>
  </section>
  <section class="run-summary" aria-labelledby="run-summary-heading">
    <div class="eyebrow" id="run-summary-heading">Pipeline / run summary</div>
    <dl>
      <div>
        <dt>Adapters</dt>
        <dd>
          {summary()
            .adapters.map((adapter) =>
              adapter === "github-releases"
                ? "GitHub releases"
                : adapter.toUpperCase(),
            )
            .join(", ") || "Fixture metadata unavailable"}
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
  {#if coverage().lanes.length > 0}
    <section class="coverage" aria-labelledby="coverage-heading">
      <div class="eyebrow" id="coverage-heading">
        Collected evidence distribution
      </div>
      <p>
        Counts show coverage only—not quality or support. Cells are lossy;
        select one to filter and inspect its evidence.
      </p>
      <div class="matrix" style={`--columns: ${coverage().adapters.length}`}>
        <span aria-hidden="true"></span>
        {#each coverage().adapters as adapter}<strong>{adapter}</strong>{/each}
        {#each coverage().lanes as lane}
          <strong>{lane}</strong>
          {#each coverage().adapters as adapter}
            {@const cell = coverage().cells.find(
              (item) => item.lane === lane && item.adapter === adapter,
            )!}
            <button
              class:active={coverageFilter?.lane === lane &&
                coverageFilter?.adapter === adapter}
              aria-label={`${lane}, ${adapter}: ${cell.count} evidence items${cell.count === 0 ? ", empty gap" : ""}`}
              aria-pressed={coverageFilter?.lane === lane &&
                coverageFilter?.adapter === adapter}
              onclick={() => filterCoverage(lane, adapter)}
              >{cell.count === 0 ? "Empty" : cell.count}</button
            >
          {/each}
        {/each}
      </div>
      {#if coverageFilter}<button
          class="clear-filter"
          onclick={() => (coverageFilter = null)}>Show all evidence</button
        >{/if}
    </section>
  {/if}
  <section>
    <div class="eyebrow">What changed</div>
    {#if brief.claims.length === 0}<p class="empty">
        No changes matched this brief.
      </p>{/if}
    {#each brief.claims as claim}<article>
        <h2>{claim.text}</h2>
        {@render EvidenceControls(claim.evidenceIds)}
      </article>{/each}
  </section>
  <aside>
    <div class="eyebrow">
      Sources · {visibleEvidence().length}{coverageFilter
        ? ` / ${brief.evidence.length}`
        : ""}
    </div>
    {#if visibleEvidence().length === 0}<p class="empty">
        {coverageFilter
          ? "This declared coverage cell is empty."
          : "No evidence was collected for this run."}
      </p>{/if}
    {#each visibleEvidence() as item}<button
        class="ledger-item"
        class:selected={selected === item.id}
        aria-pressed={selected === item.id}
        onclick={() => choose(item.id)}
        ><strong>{item.title}</strong><small
          >{item.sourceId} · {item.adapter} · {item.lanes.join(", ")} · {item.visibility}</small
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
            <dt>Declared lanes</dt>
            <dd>{item.lanes.join(", ")}</dd>
          </div>
          <div>
            <dt>Adapter</dt>
            <dd>{item.adapter}</dd>
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
          rel="noopener noreferrer"
          >Open item (or endpoint when no item link exists) ↗</a
        >
      </section>{/if}
  </aside>
  <section class="lower">
    <div>
      <div class="eyebrow">Missing coverage</div>
      {#if brief.gaps.length === 0}<p class="empty">
          This lens generated no gaps from the collected evidence; this is not
          proof that no gaps exist.
        </p>{/if}{#each brief.gaps as gap}<article>
          <p>{gap.text}</p>
          {@render EvidenceControls(gap.evidenceIds)}
        </article>{/each}
    </div>
    <div>
      <div class="eyebrow">Suggested follow-ups</div>
      <p class="section-help">
        Suggestions are review notes only. Orbit never executes them.
      </p>
      {#if brief.proposals.length === 0}<p class="empty">
          No follow-ups were suggested.
        </p>{/if}{#each brief.proposals as proposal}<article class="proposal">
          <span>Review note · not executed</span>
          <h3>{proposal.text}</h3>
          {@render EvidenceControls(proposal.evidenceIds)}
          <button
            class="copy-suggestion"
            onclick={() => copySuggestion(proposal.id, proposal.text)}
          >
            {copiedProposal === proposal.id ? "Copied" : "Copy suggestion"}
          </button>
        </article>{/each}
    </div>
  </section>
  <section class="outcome">
    <div class="eyebrow">Record your manual review outcome</div>
    <p>
      This creates valid Outcome JSON tied to <code>{brief.runId}</code>. It is
      only copied or downloaded in your browser; Orbit does not send or store
      it.
    </p>
    <fieldset>
      <legend>Decision</legend><label
        ><input
          type="radio"
          bind:group={outcomeStatus}
          value="worth-follow-up"
        /> Worth follow-up</label
      ><label
        ><input type="radio" bind:group={outcomeStatus} value="not-relevant" /> Not
        relevant</label
      ><label
        ><input type="radio" bind:group={outcomeStatus} value="no-action" /> No action</label
      >
    </fieldset>
    <label for="outcome-summary">Review note</label><textarea
      id="outcome-summary"
      bind:value={outcomeSummary}
      maxlength="2000"
      placeholder="Why did you make this decision?"
    ></textarea>
    <div class="outcome-actions">
      <button onclick={copyOutcome}
        >{copiedOutcome ? "Copied" : "Copy Outcome JSON"}</button
      ><button onclick={downloadOutcome}>Download Outcome JSON</button>
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
  .error,
  .orientation {
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
  .lede {
    max-width: 700px;
    color: #4f5c56;
    font-size: 17px;
  }
  nav {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
  }
  nav a {
    color: #173f30;
    font-weight: 700;
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
  .orientation {
    display: grid;
    grid-template-columns: minmax(0, 1.6fr) minmax(260px, 1fr);
    gap: 32px;
    padding: 22px 24px;
    border-bottom: 1px solid #c8cbc5;
    background: #f8f7f2;
  }
  .orientation p {
    max-width: 680px;
    margin: 7px 0 0;
    color: #4f5c56;
    font-size: 15px;
  }
  .orientation ol {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 16px;
    margin: 0;
    padding: 0;
    list-style: none;
    color: #58645f;
    font-size: 12px;
  }
  .orientation li {
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
  }
  .orientation li b {
    display: grid;
    width: 22px;
    height: 22px;
    place-items: center;
    border: 1px solid #aab2ab;
    border-radius: 999px;
    color: #173f30;
    font-size: 10px;
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
  .payoff,
  .receipts,
  .outcome {
    grid-column: 1/-1;
  }
  .payoff {
    padding: 22px;
    background: #e2eee7;
    border: 1px solid #a7b9ad;
  }
  .receipt-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
  .receipt-grid article {
    padding: 14px;
    background: #fff;
    border: 1px solid #c8cbc5;
  }
  .receipt-grid span {
    float: right;
    text-transform: uppercase;
    font-size: 10px;
    font-weight: 800;
  }
  .run-summary,
  .coverage {
    grid-column: 1/-1;
    border-bottom: 1px solid #a8aea7;
    padding-bottom: 20px;
  }
  .coverage p {
    margin: 8px 0 14px;
    color: #58635e;
  }
  .matrix {
    display: grid;
    grid-template-columns: minmax(110px, 1fr) repeat(
        var(--columns),
        minmax(80px, 1fr)
      );
    gap: 5px;
    overflow-x: auto;
  }
  .matrix > strong {
    padding: 8px;
    font-size: 11px;
    overflow-wrap: anywhere;
  }
  .matrix button,
  .clear-filter {
    min-height: 40px;
    border: 1px solid #aab2ab;
    background: #fff;
    color: #173f30;
    cursor: pointer;
  }
  .matrix button.active {
    background: #173f30;
    color: #fff;
  }
  .matrix button:has(:not(*)) {
    font-style: italic;
  }
  .clear-filter {
    margin-top: 10px;
    padding: 7px 12px;
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
  .section-help {
    margin: 8px 0 2px;
    color: #67716c;
    font-size: 12px;
  }
  .proposal span {
    font-size: 10px;
    text-transform: uppercase;
    background: #e2e4df;
    color: #53605a;
    padding: 4px 7px;
    border-radius: 2px;
  }
  .copy-suggestion {
    margin-top: 12px;
    padding: 7px 10px;
    border: 1px solid #aab2ab;
    border-radius: 3px;
    background: transparent;
    color: #173f30;
    font: inherit;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }
  .copy-suggestion:hover {
    background: #fff;
  }
  .outcome fieldset {
    border: 0;
    padding: 0;
    margin: 16px 0;
    display: flex;
    gap: 18px;
    flex-wrap: wrap;
  }
  .outcome textarea {
    display: block;
    width: 100%;
    min-height: 90px;
    margin: 6px 0 12px;
    padding: 10px;
    font: inherit;
  }
  .outcome-actions {
    display: flex;
    gap: 10px;
  }
  .outcome-actions button {
    padding: 9px 12px;
    border: 1px solid #173f30;
    background: #fff;
    font-weight: 700;
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
    .orientation {
      grid-template-columns: 1fr;
      gap: 16px;
    }
    .orientation ol {
      justify-content: flex-start;
      flex-wrap: wrap;
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
    .receipt-grid {
      grid-template-columns: 1fr;
    }
    .run-summary,
    .coverage {
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
