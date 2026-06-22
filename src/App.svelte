<script lang="ts">
  import type { Brief } from "./contracts.js";
  let { brief }: { brief: Brief } = $props();
  let selected = $state<string | null>(brief.evidence[0]?.id ?? null);
  const evidence = (ids: string[]) =>
    ids.map((id) => brief.evidence.find((e) => e.id === id)).filter(Boolean);
</script>

<svelte:head
  ><meta name="description" content="Orbit evidence review" /></svelte:head
>
<header>
  <div>
    <span class="brand">ORBIT / REVIEW</span>
    <h1>{brief.specName}</h1>
  </div>
  <div class="meta">
    <b>{brief.evidence.length}</b> evidence<br /><code>{brief.runId}</code>
  </div>
</header>
<main>
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
    <div class="eyebrow">Evidence ledger</div>
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
  Completed {new Date(brief.completedAt).toLocaleString()} · No actions executed
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
  footer {
    max-width: 1120px;
    margin: auto;
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: end;
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
    font-family: Georgia, serif;
    font-size: clamp(34px, 6vw, 64px);
    margin: 8px 0 0;
    line-height: 1;
  }
  .meta {
    text-align: right;
    color: #64706a;
  }
  .meta b {
    font-size: 30px;
    color: #17201d;
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
  button {
    border: 1px solid #aab2ab;
    background: transparent;
    border-radius: 999px;
    padding: 5px 9px;
    color: #477a61;
    cursor: pointer;
  }
  button.active {
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
      align-items: start;
    }
    .meta {
      display: none;
    }
    main {
      grid-template-columns: 1fr;
    }
    aside {
      border: 0;
      padding: 0;
    }
    .lower {
      grid-template-columns: 1fr;
    }
  }
</style>
