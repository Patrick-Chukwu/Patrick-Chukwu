CREATE TABLE issuer_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  professional_name TEXT NOT NULL,
  business_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  payment_instructions TEXT NOT NULL DEFAULT '',
  default_terms TEXT NOT NULL DEFAULT '',
  default_notes TEXT NOT NULL DEFAULT '',
  logo_file TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL
);

CREATE TABLE clients (
  id TEXT PRIMARY KEY,
  business_name TEXT NOT NULL,
  contact_person TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  billing_address TEXT NOT NULL DEFAULT '',
  tax_details TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE invoices (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  doc_year INTEGER NOT NULL,
  doc_seq INTEGER NOT NULL,
  lifecycle TEXT NOT NULL CHECK (lifecycle IN ('draft', 'issued', 'cancelled')),
  client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  client_snapshot_json TEXT,
  issuer_snapshot_json TEXT,
  currency TEXT NOT NULL DEFAULT 'NGN',
  issue_date TEXT,
  due_date TEXT,
  project_title TEXT NOT NULL DEFAULT '',
  project_description TEXT NOT NULL DEFAULT '',
  po_reference TEXT NOT NULL DEFAULT '',
  payment_terms TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  terms TEXT NOT NULL DEFAULT '',
  discount_minor INTEGER NOT NULL DEFAULT 0 CHECK (discount_minor >= 0),
  discount_label TEXT NOT NULL DEFAULT '',
  tax_rate_bps INTEGER NOT NULL DEFAULT 0 CHECK (tax_rate_bps >= 0 AND tax_rate_bps <= 10000),
  tax_label TEXT NOT NULL DEFAULT '',
  subtotal_minor INTEGER NOT NULL DEFAULT 0,
  tax_minor INTEGER NOT NULL DEFAULT 0,
  total_minor INTEGER NOT NULL DEFAULT 0,
  milestone_mode TEXT NOT NULL DEFAULT 'none' CHECK (milestone_mode IN ('none', 'percent', 'amount')),
  revision INTEGER NOT NULL DEFAULT 1,
  supersedes_invoice_id TEXT REFERENCES invoices(id),
  issued_at TEXT,
  cancelled_at TEXT,
  cancel_reason TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (doc_year, doc_seq)
);

CREATE TABLE invoice_lines (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  description TEXT NOT NULL,
  quantity_milli INTEGER NOT NULL CHECK (quantity_milli > 0),
  unit_price_minor INTEGER NOT NULL CHECK (unit_price_minor >= 0),
  line_total_minor INTEGER NOT NULL CHECK (line_total_minor >= 0)
);

CREATE INDEX idx_invoice_lines_invoice ON invoice_lines(invoice_id, position);

CREATE TABLE invoice_milestones (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  description TEXT NOT NULL,
  trigger_label TEXT NOT NULL DEFAULT '',
  percent_bps INTEGER,
  amount_minor INTEGER NOT NULL DEFAULT 0,
  rounding_adjustment_minor INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_invoice_milestones_invoice ON invoice_milestones(invoice_id, position);

CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL REFERENCES invoices(id),
  amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
  received_on TEXT NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('bank_transfer', 'cash', 'card', 'other')),
  method_detail TEXT NOT NULL DEFAULT '',
  reference TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  idempotency_key TEXT NOT NULL UNIQUE,
  request_hash TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('recorded', 'reversed')),
  overpayment_minor INTEGER NOT NULL DEFAULT 0,
  overpayment_confirmed INTEGER NOT NULL DEFAULT 0,
  reversed_at TEXT,
  reversal_reason TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE INDEX idx_payments_invoice ON payments(invoice_id, status);

CREATE TABLE receipts (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  doc_year INTEGER NOT NULL,
  doc_seq INTEGER NOT NULL,
  payment_id TEXT NOT NULL UNIQUE REFERENCES payments(id),
  invoice_id TEXT NOT NULL REFERENCES invoices(id),
  amount_minor INTEGER NOT NULL,
  snapshot_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (doc_year, doc_seq)
);

CREATE TABLE document_revisions (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL REFERENCES invoices(id),
  revision INTEGER NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  snapshot_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (invoice_id, revision)
);

CREATE TABLE audit_events (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  summary TEXT NOT NULL,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE INDEX idx_audit_created ON audit_events(created_at);
