# Memoried production deployment

Production runs as a single Next.js standalone service behind Nginx on the
Memoried VPS. GitHub Actions deploys only revisions merged into `main`.

## Safety model

- The GitHub SSH key is restricted to `/usr/local/sbin/memoried-receive`.
- The deploy user cannot open an interactive shell or run arbitrary commands.
- The root activation script only restarts `memoried.service`.
- Every deployment creates a PostgreSQL custom-format backup before migrations.
- Releases are built separately and activated with an atomic symlink.
- A failed health check restores the previously active application release.
- Existing releases and database backups are not pruned automatically.

## GitHub repository secret

The production environment requires one Actions secret:

- `MEMORIED_DEPLOY_SSH_KEY`: private half of the dedicated deployment key.

The matching public key is installed on the VPS with a forced command. Never add
the root SSH key, database URL, Twilio credentials, R2 credentials, or application
environment file to GitHub.

## Manual verification

After a deployment, verify:

1. The GitHub Actions job is green.
2. <https://memoried.me/> returns HTTP 200.
3. `memoried.service` is active.
4. Plexigo still returns HTTP 200.
