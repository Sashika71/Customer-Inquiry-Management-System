# Customer Inquiry Management System

A full-stack customer inquiry management application developed for the Coffee
Ninja Full-Stack Development Technical Assessment. Staff can authenticate,
record, search, review, and manage customer inquiries through a React web
interface backed by a Node.js, Express, and PostgreSQL API.

## Features

- Staff sign-in with backend-enforced JWT authentication.
- Public customer inquiry submission form.
- Persistent inquiry storage in PostgreSQL.
- Search and filter inquiries by customer, subject, status, and date.
- Inquiry details with status updates through the `New`, `Pending`,
  `In Progress`, and `Resolved` states.
- Possible duplicate inquiry review and duplicate confirmation.
- Follow-up and resolution email actions for staff.
- Backend request validation and clear error responses.
- Responsive interface built with React and Tailwind CSS.

## Technology stack

### Frontend

- React 19
- Vite
- Tailwind CSS 4

### Backend

- Node.js 18 or newer
- Express
- JSON Web Tokens (`jsonwebtoken`)
- PostgreSQL client (`pg`)
- Nodemailer for email notifications

### Database

- PostgreSQL
- Neon PostgreSQL is supported through `DATABASE_URL`

## Project structure

```text
Customer Inquiry Management System/
├── frontend/
│   ├── src/
│   ├── public/
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── migrations/
│   ├── routes/
│   ├── test/
│   ├── package.json
│   └── server.js
├── Readme.md
└── .gitignore
```

## Prerequisites

- Node.js 18 or newer
- npm
- PostgreSQL or a Neon PostgreSQL database
- Git
- `psql` if applying migrations from the command line

## Getting started

### 1. Clone the repository

```bash
git clone https://github.com/Sashika71/Customer-Inquiry-Management-System.git
cd Customer-Inquiry-Management-System
```

### 2. Configure the database

Create a PostgreSQL database and copy its connection string. Then install the
backend dependencies:

```bash
cd backend
npm install
```

Create `backend/.env` with the following values:

```env
PORT=5000
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_long_random_secret
STAFF_PASSWORD=choose-a-password-for-the-test-account
SMTP_USER=your-gmail-address
SMTP_PASS=your-gmail-app-password
```

`SMTP_USER` and `SMTP_PASS` are only required for sending inquiry and
resolution emails. Do not commit `.env` files, credentials, or secrets.

Apply the migrations in order:

```bash
psql "$DATABASE_URL" -f migrations/001_create_users.sql
psql "$DATABASE_URL" -f migrations/002_create_inquiries.sql
psql "$DATABASE_URL" -f migrations/003_add_duplicate_fields.sql
```

Create the staff account:

```bash
node seedStaff.js
```

The seed script creates `staff@example.com` with the password stored in
`STAFF_PASSWORD`. If the account already exists, it leaves it unchanged.

### 3. Configure and run the frontend

Open a second terminal at the repository root:

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

Open the URL shown by Vite, usually `http://localhost:5173`.

### 4. Run the backend

From the `backend` directory, start the API in development mode:

```bash
npm run dev
```

Or start it without automatic restart:

```bash
npm start
```

The API listens on `http://localhost:5000` when `PORT=5000` is configured.

## Test account

The seed script uses:

- **Email:** `staff@example.com`
- **Password:** the value assigned to `STAFF_PASSWORD` in `backend/.env`
- **Role:** `staff`

Never use a production password in a demonstration or commit the password to
the repository.

## Main pages

- `/customer-portal` — public customer inquiry submission form
- `/` — staff login page
- `/dashboard` — staff dashboard and recent inquiries
- `/all-inquiries` — searchable and filterable inquiry list
- `/inquiries/:id` — inquiry details and staff actions

## API endpoints

- `POST /api/auth/login` — authenticate staff and return a JWT
- `POST /api/inquiries` — submit a customer inquiry
- `GET /api/inquiries` — list inquiries; authentication required
- `GET /api/inquiries/:id` — retrieve one inquiry; authentication required
- `PATCH /api/inquiries/:id/status` — update inquiry status
- `GET /api/inquiries/:id/possible-duplicates` — find possible duplicates
- `PATCH /api/inquiries/:id/duplicate` — confirm a duplicate relationship
- `POST /api/inquiries/:id/send-email` — send a follow-up email
- `POST /api/inquiries/:id/send-resolution-email` — send a resolution email

Protected endpoints require:

```text
Authorization: Bearer <jwt-token>
```

## Testing and validation

Run backend unit tests:

```bash
cd backend
npm test
```

The backend tests use Node.js's built-in test runner and mock the database
pool, so they do not require a running PostgreSQL server.

Run frontend lint and production build checks:

```bash
cd frontend
npm run lint
npm run build
```

Run frontend unit tests:

```bash
npm test
```

The frontend tests use Vitest and React Testing Library. API requests are
mocked, so the customer portal page tests do not require a running backend.

## Main workflow verification

1. Start PostgreSQL, the backend, and the frontend.
2. Open `/customer-portal` and submit an inquiry with valid customer details.
3. Sign in at `/` using the seeded staff account.
4. Confirm the inquiry appears on the dashboard and in `/all-inquiries`.
5. Search for the inquiry and open its details.
6. Update its status and refresh the page to confirm persistence.
7. Review possible duplicate inquiries and confirm a duplicate when appropriate.
8. Test invalid form values, an invalid inquiry ID, and protected API requests
   without a valid token.

## Security

- Do not commit `.env` files, database credentials, SMTP credentials, or JWT
  secrets.
- Use environment variables for all sensitive configuration.
- Do not use real customer information in demonstrations.
- Enforce authentication and validation on the backend, not only in the
  frontend.

## Design decisions

See [`DECISIONS.md`](./DECISIONS.md) for assumptions, design choices,
trade-offs, future improvements, and disclosure of AI assistance.

