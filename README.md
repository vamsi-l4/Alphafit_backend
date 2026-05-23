# 🏋️ Alpha Fit Gym - Backend API

This is the robust Node.js/Express backend powering the **Alpha Fit Gym Management System**. It features role-based access control, a secure authentication layer, intelligent background cron jobs for expiry notifications, and a fully typed PostgreSQL database managed by Prisma.

---

## 🚀 Tech Stack

*   **Framework:** Node.js + Express.js
*   **Database:** PostgreSQL (Hosted on Neon)
*   **ORM:** Prisma
*   **Authentication:** JWT (JSON Web Tokens) & bcryptjs
*   **Background Jobs:** node-cron

---

## 📁 Folder Structure

```
backend/
├── controllers/          # Business logic (Auth, Dashboard, Members, Payments, Workouts)
├── middleware/           # Route protection (Auth guard, Admin authorization)
├── prisma/               
│   └── schema.prisma     # Database schema (Models, Enums, Relationships)
├── routes/               # Express API endpoints
├── services/             # Background logic (Cron jobs for membership expiry)
├── utils/                # Database instance singletons
├── server.js             # Main application entry point & CORS configuration
└── package.json
```

---

## ⚙️ Local Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file in the root of your `backend` directory. Use the exact variables below:

```env
DATABASE_URL="postgresql://<user>:<pass>@<neon-db-url>/neondb?sslmode=require"
JWT_SECRET="your_super_secret_jwt_key"
PORT=5000
FRONTEND_URL="http://localhost:5173" 

# Hardcoded, unbreakable Admin Credentials
ADMIN_NAME="Raju"
ADMIN_PHONE="7842300809"
ADMIN_PASSWORD="7842300809"
```

### 3. Database Migration & Start
Sync your database schema and start the application:
```bash
npx prisma generate
npx prisma db push
npm run dev
```
*The server will start on `http://localhost:5000`.*

---

## ☁️ Deployment (Render)

This backend is optimized for deployment on **Render.com**.

1.  Create a new Web Service and link this GitHub repository.
2.  **Root Directory:** `backend` (Leave blank if this is the root of the repo)
3.  **Build Command:** `npm install && npx prisma generate`
4.  **Start Command:** `node server.js`
5.  Add all variables from your `.env` file into Render's Environment Variables tab. 
6.  *Crucial:* Ensure `FRONTEND_URL` is set to your live Vercel URL (e.g., `https://alphafit-gym.vercel.app`) to perfectly configure CORS.

---

## 🔔 Core System Features

*   **Bulletproof Auth:** Secure, fixed environment-level admin credentials that intercept database lookups.
*   **Automated Background Cron:** Runs daily at `09:00 AM` to check member expiration dates, updating member statuses to `EXPIRED` automatically.
*   **Smart Notification Engine:** 
    *   Generates a `2 Days Left` warning for members.
    *   Generates `Digital Receipts` when members make a payment.
    *   Generates `Audit Trails` for admins when cash payments are modified.
*   **Dynamic CORS:** Custom origin interceptor guarantees stable communication strictly with your whitelisted frontend instances.