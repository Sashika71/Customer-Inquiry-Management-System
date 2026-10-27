# Customer Inquiry Management System Frontend

React and Vite frontend for the Customer Inquiry Management System.

## Requirements

- Node.js 18 or newer
- The backend running and accessible at the URL configured in `VITE_API_URL`

## Local setup

1. Open a terminal in this directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the `frontend` directory

   You can copy the provided `.env.example` file and update the value for a
   different backend URL. `VITE_API_URL` is required; the frontend reports a
   configuration error when it is missing.

   Restart the Vite development server after changing `.env` values.

## Run locally

Start the Vite development server:

```bash
npm run dev
```

Open the URL shown by Vite, usually `http://localhost:5173`. The frontend
uses the backend URL from `VITE_API_URL` for authentication and inquiry API
requests.

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
