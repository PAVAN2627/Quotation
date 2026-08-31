# Software Quotation Management System

A production-ready web application for creating, managing, and tracking software quotations. Built as a technical assignment for a Software Developer Intern role.

## Project Overview

This application allows users to create professional software quotations with customer details, dynamic product/service line items, automatic GST calculations, and Indian Rupee (INR) formatting. Each user manages only their own quotations, enforced at the database level by Supabase Row Level Security (RLS).

## Features

- **Authentication** — Email + password sign-in and sign-up via Supabase Auth, with session persistence and protected routes.
- **Dashboard** — Summary cards showing total quotations, total value, and most recent quotation, plus a searchable, sortable quotation table.
- **Create Quotation** — Professional form with customer information, auto-generated editable quotation numbers, and a dynamic product table (add/remove rows).
- **Automatic Calculations** — Real-time gross amount, discount, subtotal, GST, and grand total updates as you type. Configurable GST rate (default 18%).
- **Validation** — Full client-side validation with inline error messages for all fields.
- **View Quotation** — Professional quotation document view with print support.
- **Delete Quotation** — Confirmation modal with cascade deletion of associated items.
- **Responsive Design** — Optimized for desktop, tablet, and mobile with accessible forms and keyboard navigation.
- **Security** — Row Level Security ensures users can only access their own quotations. Client-calculated totals are not trusted blindly.

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS |
| Backend / Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth (Email + Password) |
| Build Tool | Vite |
| Deployment | Vercel |

## Database Structure

### `quotations` table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Primary key |
| user_id | UUID (FK → auth.users) | Owner of the quotation |
| quotation_number | TEXT | Unique quotation number (e.g., QT-2026-0001) |
| customer_name | TEXT | Customer name (required) |
| company_name | TEXT | Company name (optional) |
| email | TEXT | Customer email (optional) |
| phone | TEXT | Customer phone (optional) |
| quotation_date | DATE | Date of quotation (required) |
| valid_until | DATE | Quotation validity date (optional) |
| subtotal | NUMERIC | Sum of all item net amounts |
| gst | NUMERIC | Calculated GST amount |
| gst_rate | NUMERIC | GST percentage used (default 18) |
| total | NUMERIC | Grand total (subtotal + GST) |
| created_at | TIMESTAMPTZ | Creation timestamp |

### `quotation_items` table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Primary key |
| quotation_id | UUID (FK → quotations, ON DELETE CASCADE) | Parent quotation |
| product_name | TEXT | Product or service name (required) |
| quantity | NUMERIC | Quantity (required) |
| unit_price | NUMERIC | Unit price (required) |
| discount | NUMERIC | Discount percentage (default 0) |
| amount | NUMERIC | Net amount after discount |
| created_at | TIMESTAMPTZ | Creation timestamp |

### Row Level Security (RLS)

Both tables have RLS enabled with the following policies:

- **quotations**: Users can SELECT, INSERT, UPDATE, and DELETE only rows where `user_id = auth.uid()`.
- **quotation_items**: Users can access items only through quotations they own (enforced via a subquery on the parent quotation's `user_id`).

## Authentication

The app uses Supabase's built-in email + password authentication. Sessions are persisted and automatically refreshed. All quotation management pages are protected — unauthenticated users are redirected to the login page. Email confirmation is disabled for ease of testing.

## Environment Variables

Create a `.env` file based on `.env.example`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

> **Important**: Never expose the Supabase service-role key in frontend code. Only the anon key is used.

## Local Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd software-quotation-management-system

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your Supabase project URL and anon key

# 4. Start the development server
npm run dev
```

## Supabase Setup

1. **Create a new Supabase project** at [supabase.com](https://supabase.com).

2. **Create the database tables and RLS policies** by running the SQL migration (found in the Supabase SQL Editor):

```sql
-- Create quotations table
CREATE TABLE quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  quotation_number text NOT NULL,
  customer_name text NOT NULL,
  company_name text,
  email text,
  phone text,
  quotation_date date NOT NULL,
  valid_until date,
  subtotal numeric NOT NULL DEFAULT 0,
  gst numeric NOT NULL DEFAULT 0,
  gst_rate numeric NOT NULL DEFAULT 18,
  total numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_quotations_user_id ON quotations(user_id);
CREATE INDEX idx_quotations_quotation_number ON quotations(quotation_number);

-- Create quotation_items table
CREATE TABLE quotation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  quantity numeric NOT NULL,
  unit_price numeric NOT NULL,
  discount numeric NOT NULL DEFAULT 0,
  amount numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_quotation_items_quotation_id ON quotation_items(quotation_id);

-- Enable RLS
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;

-- Quotation policies (owner-scoped CRUD)
CREATE POLICY "select_own_quotations" ON quotations FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_quotations" ON quotations FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_quotations" ON quotations FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_quotations" ON quotations FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Quotation item policies (scoped through parent ownership)
CREATE POLICY "select_own_quotation_items" ON quotation_items FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM quotations q WHERE q.id = quotation_items.quotation_id AND q.user_id = auth.uid())
  );
CREATE POLICY "insert_own_quotation_items" ON quotation_items FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM quotations q WHERE q.id = quotation_items.quotation_id AND q.user_id = auth.uid())
  );
CREATE POLICY "update_own_quotation_items" ON quotation_items FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM quotations q WHERE q.id = quotation_items.quotation_id AND q.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM quotations q WHERE q.id = quotation_items.quotation_id AND q.user_id = auth.uid())
  );
CREATE POLICY "delete_own_quotation_items" ON quotation_items FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM quotations q WHERE q.id = quotation_items.quotation_id AND q.user_id = auth.uid())
  );
```

3. **Authentication setup**: In your Supabase dashboard, go to Authentication → Providers and ensure Email is enabled. Disable email confirmation for easier testing.

## Running Locally

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview production build
npm run typecheck # Type checking
npm run lint     # ESLint
```

## Deployment on Vercel

1. Push your code to GitHub.
2. Go to [vercel.com](https://vercel.com) and import the repository.
3. Add the following environment variables in the Vercel project settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy — Vercel auto-detects Vite. The build command (`npm run build`) and output directory (`dist`) are configured automatically.

## Test Login Credentials

> Add your test credentials here before submitting:

```
Email: 
Password: 
```

## Project Structure

```
src/
  components/
    ui/           # Reusable UI primitives (Button, Input, Modal, Toast)
    dashboard/    # Dashboard-specific components (Header, SummaryCards)
    quotation/    # Quotation list component
  pages/          # Page-level components
  hooks/          # Custom hooks (useAuth, useRouter)
  lib/
    supabase/     # Supabase client
    calculations/ # Centralized calculation utilities
    validation/   # Form validation logic
    utils/        # Helper utilities (date formatting, quotation numbers)
  types/          # TypeScript type definitions
```
