# Customer Inquiry Management System API

Express and PostgreSQL backend for the Customer Inquiry Management System.

## Requirements

- Node.js 18 or newer
- A PostgreSQL database (the project also supports a Neon connection string)
- Gmail SMTP credentials if email notifications are enabled

## Local setup

1. Open a terminal in this directory:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in `backend/`:

   ```env
   PORT=5000
   DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
   JWT_SECRET=replace-with-a-long-random-secret
   STAFF_PASSWORD=choose-a-password-for-the-test-account
   SMTP_USER=your-gmail-address
   SMTP_PASS=your-gmail-app-password
   ```

   `SMTP_USER` and `SMTP_PASS` are only needed for sending inquiry and resolution emails. Never commit `.env` or real credentials.

4. Ensure the database contains the application's `users` and `inquiries` tables. Apply the duplicate-inquiry migration when needed:

   ```bash
   psql "$DATABASE_URL" -f migrations/001_add_duplicate_fields.sql
   ```

5. Create the staff test account:

   ```bash
   node seedStaff.js
   ```

   The command creates the account only if it does not already exist.

## Test account

After running `node seedStaff.js`, sign in through `POST /api/auth/login` with:

- **Email:** `staff@example.com`
- **Password:** the value assigned to `STAFF_PASSWORD` in your local `.env`
- **Role:** `staff`

Do not use a production password for local development.

## Run locally

Start the backend with automatic restart during development:

```bash
npm run dev
```

Or start it normally:

```bash
npm start
```

The API listens on `http://localhost:5000` by default. A successful request to `GET /` returns the API status message.

## Run tests

Run the backend unit tests from this directory:

```bash
npm test
```

Tests are stored in `test/` and use Node.js's built-in test runner. The
authentication controller tests mock the database pool, so they do not require
a running PostgreSQL server.

## Main endpoints

- `POST /api/auth/login` — staff login; returns a JWT
- `POST /api/inquiries` — submit a new inquiry
- `GET /api/inquiries` — list inquiries (authentication required)
- `GET /api/inquiries/:id` — retrieve an inquiry (authentication required)

Use the returned JWT as a bearer token for protected requests:

```text
Authorization: Bearer <token>
```
