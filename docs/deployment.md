# Deployment

`npm run build` produces one svelte-hono Worker bundle and content-hashed hydration assets in `dist/`. The public default uses a `workers.dev` URL so a fresh clone can prove the app without editing account IDs into source.

```bash
npm ci
npm run check
npx wrangler login
npm run deploy
```

For a private/team deployment:

1. keep account IDs, custom domains, source credentials and Access details outside this public repository;
2. front the final hostname with a Cloudflare Access self-hosted application before accepting private sources;
3. disable `workers_dev` and add the custom domain in a private wrapper or generated config;
4. use least-privilege credentials scoped per adapter;
5. preserve request, source, byte, item and timeout limits;
6. add DNS-resolution/egress controls before allowing user-supplied URLs;
7. add D1/R2 only when durable cache/outcome retention is enabled, with an explicit deletion policy;
8. verify anonymous access, authenticated access, one real source run, citations and a rejected unsafe URL.

Current `0.0.1` hosting is a public-source demonstration. It has no private adapters, credentials, persistence, approval execution or mutable actions.
