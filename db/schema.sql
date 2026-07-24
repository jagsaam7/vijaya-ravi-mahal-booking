-- Vijaya Ravi Mahal — Booking Database Schema (Turso / libSQL)
-- Run this once against your Turso database before first deploy:
--   turso db shell <your-db-name> < db/schema.sql

CREATE TABLE IF NOT EXISTS bookings (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  receipt_no   TEXT NOT NULL UNIQUE,
  name         TEXT NOT NULL,
  email        TEXT NOT NULL,
  mobile       TEXT NOT NULL,
  event_date   TEXT NOT NULL UNIQUE,   -- 'YYYY-MM-DD' — UNIQUE = only one booking per day, enforced by the DB itself
  purpose      TEXT NOT NULL,          -- Marriage | Reception | Puberty (Half Saree) | Ear Boring | Others
  status       TEXT NOT NULL DEFAULT 'confirmed',  -- confirmed | admin_block
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(event_date);
