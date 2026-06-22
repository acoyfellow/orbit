# Research note: coverage is not quality

Canonical source: **arXiv:2507.02235v1**, <https://arxiv.org/abs/2507.02235v1>. This identifier canonicalizes the mistyped paper ID supplied during planning; the versioned arXiv record is the citation of record.

## Claims from the paper

The quality-diversity scheduling paper treats coverage and quality/support as separate concerns, requires behavior/grouping dimensions to be explicit, treats map cells as lossy summaries that need inspection of underlying evidence, and cautions that results from changing contexts are not directly comparable.

## Orbit inference

Orbit is not a quality-diversity scheduler. We infer one narrow review affordance from those claims:

- operators declare one to five short `lanes` on each source;
- adapters copy those labels unchanged onto evidence;
- the review page counts evidence by the explicitly labelled **lane × adapter** dimensions, retains empty cells, and lets a reviewer drill into the evidence ledger;
- counts mean collection coverage only. Orbit does not compute an aggregate quality, confidence, or support score;
- the matrix describes one run. It must not be used to compare changing run contexts without separately controlling and explaining those contexts.

The labels are bounded operator metadata, not model inference or a taxonomy service. This keeps source collection deterministic and adds no AI, persistence, or private-source capability.
