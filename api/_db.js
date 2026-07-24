import { createClient } from '@libsql/client';

let client;

export function getDb() {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url || !authToken) {
      throw new Error('TURSO_DATABASE_URL / TURSO_AUTH_TOKEN not set in environment variables');
    }
    client = createClient({ url, authToken });
  }
  return client;
}

export function makeReceiptNo() {
  const now = new Date();
  const y = now.getFullYear();
  const rand = Math.floor(100 + Math.random() * 900);
  return `VRM${y}${Date.now().toString().slice(-6)}${rand}`;
}

export const PURPOSES = ['Marriage', 'Reception', 'Puberty (Half Saree)', 'Ear Boring', 'Others'];

export function isValidDate(d) {
  return typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);
}

export function isValidEmail(e) {
  return typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

export function isValidMobile(m) {
  return typeof m === 'string' && /^[0-9]{10}$/.test(m.replace(/\D/g, '').slice(-10));
}
