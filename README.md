# LumaCards

LumaCards is a flashcard learning app built with Next.js, React, TypeScript, Tailwind, Prisma, and Postgres.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma ORM
- Postgres (recommended: Vercel Postgres)

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Configure database environment variable:

```bash
cp .env.example .env
```

Then update `DATABASE_URL` in `.env`.

3. Generate Prisma client and run migrations:

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
```

4. Seed starter data:

```bash
npm run prisma:seed
```

5. Start the app:

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

## Deploy on Vercel (easy path)

1. Create a Vercel Postgres database in your Vercel project.
2. Add `DATABASE_URL` from Vercel Storage to Project Environment Variables.
3. Deploy the app.
4. Run migrations once:

```bash
npx prisma migrate deploy
```

5. (Optional) Seed production demo data:

```bash
npm run prisma:seed
```

## Docker Setup (DB + App + Prisma)

Use this when you want containerized setup for running the app, migrations, and seed.

1. One command to run everything in Docker (DB + migrate + seed + app):

```bash
npm run docker:run
```

2. Open app:

```text
http://localhost:3001
```

If you want a different host port, set `APP_PORT` before running compose.

3. Stop containers:

```bash
docker compose down
```

4. Stop and remove DB volume too (full reset):

```bash
docker compose down -v
```

### One-command setup

You can run setup only (without starting the app container) with:

```bash
npm run docker:setup
```

`docker:setup` starts only the `db` service and runs migration/seed in one-off app containers.
`docker:run` does the same and then starts the app container.

Extra helper scripts:

```bash
npm run docker:up
npm run docker:db:up
npm run docker:app:up
npm run docker:migrate
npm run docker:seed
npm run docker:run
npm run docker:down
npm run docker:reset
```
