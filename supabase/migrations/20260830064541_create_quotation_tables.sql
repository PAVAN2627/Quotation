/*
# Create quotations and quotation_items tables

## Overview
Creates the two core tables for the Software Quotation Management System.
Each user only sees and manages their own quotations. Quotation items are
scoped through their parent quotation and cascade-delete with it.

## 1. New Tables

### quotations
- id (uuid, primary key)
- user_id (uuid, not null, defaults to auth.uid(), references auth.users, cascade delete)
- quotation_number (text)
- customer_name (text, not null)
- company_name (text, nullable)
- email (text, nullable)
- phone (text, nullable)
- quotation_date (date, not null)
- valid_until (date, nullable)
- subtotal (numeric, default 0)
- gst (numeric, default 0)  -- GST amount
- gst_rate (numeric, default 18)  -- GST percentage
- total (numeric, default 0)
- created_at (timestamptz, default now())

### quotation_items
- id (uuid, primary key)
- quotation_id (uuid, not null, references quotations, cascade delete)
- product_name (text, not null)
- quantity (numeric, not null)
- unit_price (numeric, not null)
- discount (numeric, default 0)  -- discount percentage
- amount (numeric, not null)  -- net amount after discount
- created_at (timestamptz, default now())

## 2. Indexes
- quotations.user_id, quotations.quotation_number, quotation_items.quotation_id

## 3. Security (RLS)
- RLS enabled on both tables.
- quotations: owner-scoped CRUD (auth.uid() = user_id).
- quotation_items: owner-scoped CRUD through parent ownership.
*/

CREATE TABLE IF NOT EXISTS quotations (
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

CREATE INDEX IF NOT EXISTS idx_quotations_user_id ON quotations(user_id);
CREATE INDEX IF NOT EXISTS idx_quotations_quotation_number ON quotations(quotation_number);

CREATE TABLE IF NOT EXISTS quotation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  quantity numeric NOT NULL,
  unit_price numeric NOT NULL,
  discount numeric NOT NULL DEFAULT 0,
  amount numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation_id ON quotation_items(quotation_id);

ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;

-- quotations policies
DROP POLICY IF EXISTS "select_own_quotations" ON quotations;
CREATE POLICY "select_own_quotations" ON quotations FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_quotations" ON quotations;
CREATE POLICY "insert_own_quotations" ON quotations FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_quotations" ON quotations;
CREATE POLICY "update_own_quotations" ON quotations FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_quotations" ON quotations;
CREATE POLICY "delete_own_quotations" ON quotations FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- quotation_items policies (scoped through parent ownership)
DROP POLICY IF EXISTS "select_own_quotation_items" ON quotation_items;
CREATE POLICY "select_own_quotation_items" ON quotation_items FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM quotations q WHERE q.id = quotation_items.quotation_id AND q.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_quotation_items" ON quotation_items;
CREATE POLICY "insert_own_quotation_items" ON quotation_items FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM quotations q WHERE q.id = quotation_items.quotation_id AND q.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_quotation_items" ON quotation_items;
CREATE POLICY "update_own_quotation_items" ON quotation_items FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM quotations q WHERE q.id = quotation_items.quotation_id AND q.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM quotations q WHERE q.id = quotation_items.quotation_id AND q.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_quotation_items" ON quotation_items;
CREATE POLICY "delete_own_quotation_items" ON quotation_items FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM quotations q WHERE q.id = quotation_items.quotation_id AND q.user_id = auth.uid())
  );
