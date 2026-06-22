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
    <h1>See what's new in the projects you follow.</h1>
    <p class="lede">
      Orbit checks a few projects for you and shows what changed — new releases
      and posts — each linked back to the original. This demo follows OpenAI
      Agents JS, the Model Context Protocol SDK, and the Cloudflare blog.
    </p>
    <nav aria-label="Project links">
      <a href="https://github.com/acoyfellow/orbit">GitHub</a><a
        href="https://github.com/acoyfellow/orbit/tree/main/docs"
        >How it works</a
      ><a href="https://github.com/acoyfellow/orbit/blob/main/docs/security.md"
        >Privacy</a
      >
    </nav>
  </div>
  <div class="controls">
    <span class:live={!isFixture}
      >{isFixture ? "Example · not checked yet" : "Just checked"}</span
    >
    <button class="run" onclick={runExample} disabled={running}
      >{running ? "Checking…" : "Check for updates"}</button
    >
  </div>
</header>
<div class="sr-only" role="status" aria-live="polite">
  {running
    ? "Checking the projects for updates."
    : error
      ? "Check failed; the example is still shown."
      : isFixture
        ? "Showing an example. Press Check for updates to see what's new."
        : "Done. Showing the latest updates."}
</div>
{#if error}<div class="error" role="alert">
    <b>Run failed.</b>
    {error} The fixture remains visible.
  </div>{/if}
<main aria-busy={running}>
  {#if !isFixture}<section class="payoff">
      <div class="eyebrow">Done</div>
      <h2>
        {brief.claims.length}
        {brief.claims.length === 1 ? "update" : "updates"} across {brief
          .sourceReceipts.length} projects
      </h2>
      <p>
        Each update links to its source. Mark anything worth following up at the
        bottom of the page.
      </p>
    </section>{/if}
  <section class="receipts">
    <div class="eyebrow">Projects checked</div>
    <div class="receipt-grid">
      {#each brief.sourceReceipts as receipt}<article>
          <strong>{receipt.sourceId}</strong><span
            >{receipt.status === "complete"
              ? "checked"
              : "more available"}</span
          >
          <p>
            {receipt.collectedItems} recent {receipt.collectedItems === 1
              ? "item"
              : "items"}.
          </p>
          {#if receipt.truncated}<p class="note">
              Showing the {receipt.maxItems} most recent; there may be more.
            </p>{/if}<a
            href={receipt.sourceUrl}
            target="_blank"
            rel="noopener noreferrer">Open source ↗</a
          >
        </article>{/each}
    </div>
  </section>
  <section>
    <div class="eyebrow">What's new</div>
    {#if brief.claims.length === 0}<p class="empty">
        Nothing new since the last check.
      </p>{/if}
    {#each brief.claims as claim}<article>
        <h2>{claim.text}</h2>
        {@render EvidenceControls(claim.evidenceIds)}
      </article>{/each}
  </section>
  <aside>
    <div class="eyebrow">
      All updates · {visibleEvidence().length}{coverageFilter
        ? ` / ${brief.evidence.length}`
        : ""}
    </div>
    {#if visibleEvidence().length === 0}<p class="empty">
        {coverageFilter ? "Nothing here." : "Nothing found this time."}
      </p>{/if}
    {#each visibleEvidence() as item}<button
        class="ledger-item"
        class:selected={selected === item.id}
        aria-pressed={selected === item.id}
        onclick={() => choose(item.id)}
        ><strong>{item.title}</strong><small
          >{item.sourceId} · {new Date(
            item.retrievedAt,
          ).toLocaleDateString()}</small
        ></button
      >{/each}
    {#if selectedEvidence()}{@const item = selectedEvidence()!}
      <section
        class="evidence-detail"
        aria-labelledby="evidence-detail-heading"
      >
        <div class="eyebrow" id="evidence-detail-heading">Update details</div>
        <h3>{item.title}</h3>
        <p>{item.summary || "No summary from the source."}</p>
        <dl>
          <div>
            <dt>From</dt>
            <dd>{item.sourceId}</dd>
          </div>
          <div>
            <dt>Date</dt>
            <dd>{new Date(item.retrievedAt).toLocaleString()}</dd>
          </div>
        </dl>
        <a
          href={item.itemUrl ?? item.sourceUrl}
          target="_blank"
          rel="noopener noreferrer">Open original ↗</a
        >
        <details class="raw">
          <summary>Technical details</summary>
          <dl>
            <div>
              <dt>Adapter</dt>
              <dd>{item.adapter}</dd>
            </div>
            <div>
              <dt>Topics</dt>
              <dd>{item.lanes.join(", ")}</dd>
            </div>
            <div>
              <dt>Visibility</dt>
              <dd>{item.visibility}</dd>
            </div>
            <div>
              <dt>Content digest</dt>
              <dd><code>{item.digest}</code></dd>
            </div>
          </dl>
        </details>
      </section>{/if}
  </aside>
  <section class="lower">
    <div>
      <div class="eyebrow">Quiet sources</div>
      {#if brief.gaps.length === 0}<p class="empty">
          Every project had something new this time.
        </p>{/if}{#each brief.gaps as gap}<article>
          <p>{gap.text}</p>
          {@render EvidenceControls(gap.evidenceIds)}
        </article>{/each}
    </div>
    <div>
      <div class="eyebrow">Worth a look</div>
      <p class="section-help">
        Suggestions only. Orbit never acts on these for you.
      </p>
      {#if brief.proposals.length === 0}<p class="empty">
          Nothing stood out this time.
        </p>{/if}{#each brief.proposals as proposal}<article class="proposal">
          <h3>{proposal.text}</h3>
          {@render EvidenceControls(proposal.evidenceIds)}
          <button
            class="copy-suggestion"
            onclick={() => copySuggestion(proposal.id, proposal.text)}
          >
            {copiedProposal === proposal.id ? "Copied" : "Copy"}
          </button>
        </article>{/each}
    </div>
  </section>
  <section class="outcome">
    <div class="eyebrow">Save a note</div>
    <p>
      Jot down what you decided about this check. Your note stays in your
      browser — Orbit doesn't send or store it. Copy or download it to keep.
    </p>
    <fieldset>
      <legend>This check was</legend><label
        ><input
          type="radio"
          bind:group={outcomeStatus}
          value="worth-follow-up"
        /> Worth following up</label
      ><label
        ><input type="radio" bind:group={outcomeStatus} value="not-relevant" /> Not
        relevant</label
      ><label
        ><input type="radio" bind:group={outcomeStatus} value="no-action" /> Nothing
        to do</label
      >
    </fieldset>
    <label for="outcome-summary">Note</label><textarea
      id="outcome-summary"
      bind:value={outcomeSummary}
      maxlength="2000"
      placeholder="What did you decide, and why?"
    ></textarea>
    <div class="outcome-actions">
      <button onclick={copyOutcome}
        >{copiedOutcome ? "Copied" : "Copy note"}</button
      ><button onclick={downloadOutcome}>Download note</button>
    </div>
  </section>
  <details class="technical">
    <summary>Technical details</summary>
    <dl class="run-summary-list">
      <div>
        <dt>Sources checked</dt>
        <dd>{summary().sourceCount}</dd>
      </div>
      <div>
        <dt>Time</dt>
        <dd>{summary().durationMs} ms</dd>
      </div>
      <div>
        <dt>Adapters</dt>
        <dd>
          {summary()
            .adapters.map((adapter) =>
              adapter === "github-releases"
                ? "GitHub releases"
                : adapter.toUpperCase(),
            )
            .join(", ") || "—"}
        </dd>
      </div>
      <div>
        <dt>Lenses</dt>
        <dd>{summary().lenses.join(" → ") || "—"}</dd>
      </div>
    </dl>
    {#if coverage().lanes.length > 0}
      <p class="matrix-help">
        Items found per topic and source type. Counts only — not a quality
        score. Pick a cell to filter the list above.
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
              aria-label={`${lane}, ${adapter}: ${cell.count} items${cell.count === 0 ? ", none" : ""}`}
              aria-pressed={coverageFilter?.lane === lane &&
                coverageFilter?.adapter === adapter}
              onclick={() => filterCoverage(lane, adapter)}
              >{cell.count === 0 ? "—" : cell.count}</button
            >
          {/each}
        {/each}
      </div>
      {#if coverageFilter}<button
          class="clear-filter"
          onclick={() => (coverageFilter = null)}>Show all</button
        >{/if}
    {/if}
  </details>
</main>
<footer>
  Checked {new Date(brief.completedAt).toLocaleString()} ·
  <code>{brief.runId}</code>
</footer>

{#snippet EvidenceControls(ids: string[])}
  <div class="evidence-controls" aria-label="Where this came from">
    {#if referencedEvidence(ids).length > 0}<small>Based on:</small>{/if}
    {#each referencedEvidence(ids) as item}<button
        class:active={selected === item.id}
        aria-pressed={selected === item.id}
        title={item.title}
        onclick={() => choose(item.id)}>{item.title}</button
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
  main > * {
    min-width: 0;
  }
  h2,
  .ledger-item strong,
  .evidence-detail h3 {
    overflow-wrap: anywhere;
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
  .technical {
    grid-column: 1/-1;
    border-top: 1px solid #c8cbc5;
    padding-top: 18px;
    color: #58635e;
  }
  .technical > summary {
    cursor: pointer;
    font-size: 12px;
    font-weight: 700;
    color: #67716c;
  }
  .matrix-help {
    margin: 12px 0 14px;
    color: #58635e;
    font-size: 13px;
  }
  .note {
    color: #67716c;
    font-size: 12px;
  }
  .raw {
    margin-top: 14px;
  }
  .raw > summary {
    cursor: pointer;
    font-size: 11px;
    color: #67716c;
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
  .run-summary-list {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 28px;
    margin: 14px 0 4px;
  }
  .run-summary-list div {
    min-width: 120px;
  }
  .run-summary-list dt,
  .evidence-detail dt {
    font-size: 10px;
    text-transform: uppercase;
    color: #67716c;
  }
  .run-summary-list dd,
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
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    margin-top: 10px;
  }
  .evidence-controls small {
    color: #67716c;
  }
  .evidence-controls button {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    border: 1px solid #aab2ab;
    background: transparent;
    border-radius: 999px;
    padding: 5px 11px;
    color: #477a61;
    font: inherit;
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
    .run-summary-list {
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
