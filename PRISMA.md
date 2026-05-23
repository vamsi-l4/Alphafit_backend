# Prisma: Migrations & Production

Commands (run inside `backend`):

Development (apply migrations and generate client):
```
npx prisma migrate dev --name init
npx prisma generate
```

Production (safe deploy - run on server or CI with DATABASE_URL set):
```
npx prisma generate
npx prisma migrate deploy
```

Notes:
- Ensure `DATABASE_URL` in the environment includes `sslmode=require` for Render/Postgres cloud.
- Do not commit your `.env` file.
