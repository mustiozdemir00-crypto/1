/*
  # Email Management System

  Creates tables and security policies for company email integration.

  ## New Tables
  
  ### `emails`
  Stores all incoming and outgoing emails
  - `id` (uuid, primary key) - Unique email identifier
  - `message_id` (text, unique) - Email message ID from provider
  - `from_address` (text) - Sender email address
  - `from_name` (text, nullable) - Sender display name
  - `to_addresses` (text[]) - Array of recipient email addresses
  - `cc_addresses` (text[], nullable) - CC recipients
  - `bcc_addresses` (text[], nullable) - BCC recipients
  - `subject` (text) - Email subject line
  - `body_text` (text, nullable) - Plain text email body
  - `body_html` (text, nullable) - HTML email body
  - `headers` (jsonb, nullable) - Full email headers as JSON
  - `is_read` (boolean) - Read/unread status
  - `is_archived` (boolean) - Archive status
  - `direction` (text) - 'inbound' or 'outbound'
  - `received_at` (timestamptz) - When email was received/sent
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ### `email_attachments`
  Stores email attachment metadata
  - `id` (uuid, primary key) - Unique attachment identifier
  - `email_id` (uuid, foreign key) - References parent email
  - `filename` (text) - Original filename
  - `content_type` (text) - MIME type
  - `size_bytes` (integer) - File size in bytes
  - `storage_path` (text) - Path in Supabase Storage
  - `created_at` (timestamptz) - Record creation timestamp

  ## Security
  
  ### Row Level Security
  - Enable RLS on both tables
  - Admins can access all emails
  - Staff with 'emails' permission can access emails
  - Read, insert, update, and delete policies based on user permissions
  
  ## Performance
  
  ### Indexes
  - Index on message_id for quick lookups
  - Index on from_address for sender filtering
  - Index on received_at for chronological sorting
  - Index on is_read and is_archived for status filtering
  - Composite index on direction and received_at
  - Index on email_id in attachments table for join optimization
*/

-- Create emails table
CREATE TABLE IF NOT EXISTS emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id text UNIQUE NOT NULL,
  from_address text NOT NULL,
  from_name text,
  to_addresses text[] NOT NULL DEFAULT '{}',
  cc_addresses text[],
  bcc_addresses text[],
  subject text NOT NULL DEFAULT '',
  body_text text,
  body_html text,
  headers jsonb,
  is_read boolean DEFAULT false,
  is_archived boolean DEFAULT false,
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  received_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create email_attachments table
CREATE TABLE IF NOT EXISTS email_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id uuid NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  filename text NOT NULL,
  content_type text NOT NULL,
  size_bytes integer NOT NULL DEFAULT 0,
  storage_path text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_emails_message_id ON emails(message_id);
CREATE INDEX IF NOT EXISTS idx_emails_from_address ON emails(from_address);
CREATE INDEX IF NOT EXISTS idx_emails_received_at ON emails(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_is_read ON emails(is_read);
CREATE INDEX IF NOT EXISTS idx_emails_is_archived ON emails(is_archived);
CREATE INDEX IF NOT EXISTS idx_emails_direction_received ON emails(direction, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_attachments_email_id ON email_attachments(email_id);

-- Enable Row Level Security
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_attachments ENABLE ROW LEVEL SECURITY;

-- Emails policies: Users with 'emails' permission or admins can view emails
CREATE POLICY "Users with emails permission can view emails"
  ON emails FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.id::text = auth.uid()::text
      AND (
        staff.role = 'admin' 
        OR 'emails' = ANY(staff.permissions)
      )
    )
  );

CREATE POLICY "Users with emails permission can insert emails"
  ON emails FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.id::text = auth.uid()::text
      AND (
        staff.role = 'admin' 
        OR 'emails' = ANY(staff.permissions)
      )
    )
  );

CREATE POLICY "Users with emails permission can update emails"
  ON emails FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.id::text = auth.uid()::text
      AND (
        staff.role = 'admin' 
        OR 'emails' = ANY(staff.permissions)
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.id::text = auth.uid()::text
      AND (
        staff.role = 'admin' 
        OR 'emails' = ANY(staff.permissions)
      )
    )
  );

CREATE POLICY "Users with emails permission can delete emails"
  ON emails FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.id::text = auth.uid()::text
      AND staff.role = 'admin'
    )
  );

-- Email attachments policies: Same permissions as emails
CREATE POLICY "Users with emails permission can view attachments"
  ON email_attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.id::text = auth.uid()::text
      AND (
        staff.role = 'admin' 
        OR 'emails' = ANY(staff.permissions)
      )
    )
  );

CREATE POLICY "Users with emails permission can insert attachments"
  ON email_attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.id::text = auth.uid()::text
      AND (
        staff.role = 'admin' 
        OR 'emails' = ANY(staff.permissions)
      )
    )
  );

CREATE POLICY "Users with emails permission can delete attachments"
  ON email_attachments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.id::text = auth.uid()::text
      AND staff.role = 'admin'
    )
  );

-- Create storage bucket for email attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('email-attachments', 'email-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policy for email attachments
CREATE POLICY "Users with emails permission can access email attachments"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'email-attachments'
    AND EXISTS (
      SELECT 1 FROM staff
      WHERE staff.id::text = auth.uid()::text
      AND (
        staff.role = 'admin' 
        OR 'emails' = ANY(staff.permissions)
      )
    )
  );

CREATE POLICY "Service role can insert email attachments"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'email-attachments'
  );