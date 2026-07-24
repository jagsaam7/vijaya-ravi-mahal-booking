import { getDb, makeReceiptNo, PURPOSES, isValidDate, isValidEmail, isValidMobile } from './_db.js';

export default async function handler(req, res) {
  const db = getDb();

  // ── GET: return only the list of booked dates (no personal guest data) ──
  // This powers the public red/green calendar.
  if (req.method === 'GET') {
    try {
      const result = await db.execute('SELECT event_date FROM bookings');
      const bookedDates = result.rows.map(r => r.event_date);
      return res.status(200).json({ bookedDates });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Could not load availability. Please try again.' });
    }
  }

  // ── POST: create a new guest booking ──
  if (req.method === 'POST') {
    try {
      const { name, email, mobile, date, purpose } = req.body || {};

      if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required.' });
      if (!isValidEmail(email)) return res.status(400).json({ error: 'A valid email is required.' });
      if (!isValidMobile(mobile)) return res.status(400).json({ error: 'A valid 10-digit mobile number is required.' });
      if (!isValidDate(date)) return res.status(400).json({ error: 'A valid date is required.' });
      if (!PURPOSES.includes(purpose)) return res.status(400).json({ error: 'Please select a valid purpose.' });

      const today = new Date().toISOString().slice(0, 10);
      if (date < today) return res.status(400).json({ error: 'Cannot book a past date.' });

      const receiptNo = makeReceiptNo();

      try {
        const insertResult = await db.execute({
          sql: `INSERT INTO bookings (receipt_no, name, email, mobile, event_date, purpose, status)
                VALUES (?, ?, ?, ?, ?, ?, 'confirmed')`,
          args: [receiptNo, name.trim(), email.trim(), mobile.trim(), date, purpose],
        });

        const booking = {
          id: Number(insertResult.lastInsertRowid),
          receipt_no: receiptNo,
          name: name.trim(),
          email: email.trim(),
          mobile: mobile.trim(),
          event_date: date,
          purpose,
          status: 'confirmed',
          created_at: new Date().toISOString(),
        };
        return res.status(201).json({ success: true, booking });
      } catch (dbErr) {
        // UNIQUE constraint on event_date fires if the date got booked in the meantime
        const msg = String(dbErr?.message || '');
        if (msg.includes('UNIQUE') || msg.includes('constraint')) {
          return res.status(409).json({ error: 'Sorry — this date was just booked by someone else. Please choose another date.' });
        }
        throw dbErr;
      }
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Could not complete the booking. Please try again.' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}
