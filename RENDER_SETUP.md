Deploying Backend to Render (Postgres)

1) Create a Postgres database on Render
- In Render dashboard choose "Databases" → "New Database" → PostgreSQL
- Choose a name and region, copy the generated Internal Database URL.

2) Add environment variables to your Render service
- Go to your Render web service settings → Environment → Add the following:
  - `DATABASE_URL` = (the internal database URL from step 1)
  - `JWT_SECRET` = (generate a long random secret)
  - `NODE_ENV` = `production`
  - `PORT` = `5000`

3) Build & Start commands
- Build Command: `cd backend && npm install && npx prisma generate`
- Start Command: `cd backend && npm run start`

4) Run migrations
- Either run migrations locally pointing at the Render DATABASE_URL, or use Render shell/cron to run:
```
cd backend
npx prisma generate
npx prisma migrate deploy
```

5) Verify
- Check logs on Render for successful DB connection
- Visit `/api/health` endpoint
