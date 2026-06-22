# Adapters

0.0.1 supports public HTTPS JSON and RSS. Each source declares `maxItems`; each run caps sources, response bytes (at most 1 MB), and timeout (at most 30 seconds). JSON maps optional dotted title/summary paths. RSS extracts item title, description, and link without retaining the document.

Both emit the same minimized evidence fields: stable content-derived ID/digest, source and item URL, retrieval time, visibility, title and summary. Authorization configuration is absent in this public slice. Adding an adapter means implementing this contract without interpretation, enforcing limits before parsing, and adding fixture-backed tests. XML parsing is intentionally bounded/basic and not a general feed implementation.
