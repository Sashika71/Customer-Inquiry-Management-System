# Customer Inquiry Management System Frontend

React and Vite frontend for the Customer Inquiry Management System.

## Requirements

- Node.js 18 or newer
- The backend running locally on `http://localhost:5000`

## Local setup

1. Open a terminal in this directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Optional: create a `.env` file to use a different backend URL:

   ```env
   VITE_API_URL=http://localhost:5000
   ```

   If `VITE_API_URL` is not set, the frontend uses `http://localhost:5000`.

## Run locally

Start the Vite development server:

```bash
npm run dev
```

Open the URL shown by Vite, usually `http://localhost:5173`.

Build the production bundle:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

Run lint checks:

```bash
npm run lint
```

## Available pages

- `/customer-portal` — public customer inquiry submission form
- `/` — staff login page
- `/dashboard` — staff dashboard
- `/all-inquiries` — searchable staff inquiry list
- `/inquiries/:id` — inquiry details and staff actions

## Staff test account

Create the test account from the backend directory:

```bash
cd ../backend
node seedStaff.js
```

Then sign in at `/` with:

- **Email:** `staff@example.com`
- **Password:** the value assigned to `STAFF_PASSWORD` in `backend/.env`
- **Role:** `staff`

The backend must be running for staff login, inquiry loading, status updates, and email actions to work.
