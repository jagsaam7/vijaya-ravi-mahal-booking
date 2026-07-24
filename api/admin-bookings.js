import { getDb, makeReceiptNo, isValidDate } from './_db.js';

function checkAuth(req) {
  const token = req.headers['x-admin-token'];
  return token && process.env.ADMIN_PASSWORD && token === process.env.ADMIN_PASSWORD;
}

export default async function handler(req, res) {
  if (!checkAuth(req)) {
    return res.status(401).json({ error: 'Invalid admin password.' });
  }

  const db = getDb();

  // ── GET: full booking list with guest details, for the admin dashboard ──
  if (req.method === 'GET') {
    try {
      const result = await db.execute('SELECT * FROM bookings ORDER BY event_date ASC');
      return res.status(200).json({ bookings: result.rows });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Could not load bookings.' });
    }
  }

  // ── POST: admin manually blocks a date (maintenance hold, offline booking, etc.) ──
  if (req.method === 'POST') {
    try {
      const { date, reason } = req.body || {};
      if (!isValidDate(date)) return res.status(400).json({ error: 'A valid date is required.' });

      const receiptNo = makeReceiptNo();
      const insertResult = await db.execute({
        sql: `INSERT INTO bookings (receipt_no, name, email, mobile, event_date, purpose, status)
              VALUES (?, 'Admin Hold', '-', '-', ?, ?, 'admin_block')`,
        args: [receiptNo, date, (reason && reason.trim()) || 'Blocked by admin'],
      });
      return res.status(201).json({ success: true, id: Number(insertResult.lastInsertRowid) });
    } catch (dbErr) {
      const msg = String(dbErr?.message || '');
      if (msg.includes('UNIQUE') || msg.includes('constraint')) {
        return res.status(409).json({ error: 'That date is already booked or blocked.' });
      }
      console.error(dbErr);
      return res.status(500).json({ error: 'Could not block the date.' });
    }
  }

  // ── DELETE: cancel a booking / unblock a date, freeing it back up ──
  if (req.method === 'DELETE') {
    try {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'Booking id is required.' });
      await db.execute({ sql: 'DELETE FROM bookings WHERE id = ?', args: [id] });
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Could not cancel the booking.' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
  return res.status(405).json({ error: 'Method not allowed' });
}
