<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Deploy Configuration (configured by /setup-deploy)

- Platform: GitHub Actions to a custom AlmaLinux VPS
- Production URL: https://memoried.me
- Deploy workflow: .github/workflows/deploy.yml
- Deploy status command: GitHub Actions workflow status
- Merge method: squash
- Project type: Next.js web application
- Post-deploy health check: https://memoried.me/

### Custom deploy hooks

- Pre-merge: `npm ci && npm run lint && npm run build`
- Deploy trigger: automatic on push to `main`
- Deploy status: GitHub Actions `Deploy Memoried` workflow
- Health check: `curl --fail --location https://memoried.me/`
