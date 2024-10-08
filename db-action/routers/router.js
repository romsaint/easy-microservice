require('dotenv').config();
const express = require('express')
const router = express.Router()
const { accessProtect } = require('../../server/utils/accessProtect')
const { refresh } = require('../../server/utils/refreshToken')

const { Pool } = require('pg');
const client = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: process.env.SECRET_DBNAME_POSTGRE_DB,
  password: process.env.SECRET_PASSWORD_POSTGRE,
  port: 5432,
});
async function connect() {
  try {
    await client.connect();
  } catch (err) {
    console.error('Error', err.stack);
  }
}
connect()


router.get('/api/entries', async (req, res) => {
  try {
    const entries = await client.query(`
    SELECT * FROM products
    ORDER BY id
    `)

    return res.status(200).json({ entries: entries.rows })
  } catch (e) {
    return res.status(500).json({ ok: false, msg: e.message })
  }
});
router.post('/api/add-entry', refresh, accessProtect, async (req, res) => {
  try {
    const { name, price, company_name } = req.body;

    if (!name || !price || !company_name) {
      return res.status(400).json({ ok: false, msg: 'Provide the data!' });
    }
    if (typeof price !== 'number') {
      return res.status(400).json({ ok: false, msg: 'Price should be number' });
    }

    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({ ok: false, msg: "There's no user id" });
    }

    const query = `
    INSERT INTO products (name, price, company_name, user_id)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
    const values = [name, price, company_name, userId];

    const result = await client.query(query, values);

    return res.status(201).json({ ok: true, msg: "SUCCESSFULLY CREATED!", result: result.rows });
  } catch (e) {
    if (e.original && e.original.code === '23503') {
      return res.status(500).json({ ok: false, msg: "There's no such company name" });
    }
    return res.status(500).json({ ok: false, msg: e.message });
  }
});

router.post('/api/delete-entry', refresh, accessProtect, async (req, res) => {
  try {
    const { id } = req.body

    if (!id) {
      return res.status(409).json({ ok: false, msg: 'Auth please' })
    }
    const userId = req.user.id

    if (!userId) {
      return res.status(401).json({ ok: false, msg: "There's no user id" })
    }

    const deleted = await client.query(`
      DELETE FROM products
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, [id, userId])

    if (deleted.rowCount === 0) {
      return res.status(400).json({ ok: true, msg: "Nothing to delete." })
    }

    return res.status(200).json({ ok: true, msg: "SUCCESSFULLY DELETED!" })
  } catch (e) {
    return res.status(500).json({ ok: false, msg: e.message })
  }
})

router.post('/api/update-entry', refresh, accessProtect, async (req, res) => {
  try {
    const { idEntry, name, price, company_name } = req.body

    if (!idEntry) {
      return res.status(409).json({ ok: false, msg: 'Provide product id' })
    }
    if (!name || !price || !company_name) {
      return res.status(400).json({ ok: false, msg: 'Provide the data!' })
    }
    if (typeof price !== 'number') {
      return res.status(400).json({ ok: false, msg: 'Price should be number' })
    }

    const userId = req.user.id

    if (!userId) {
      return res.status(401).json({ ok: false, msg: "There's no user id" })
    }

    const query = `
      UPDATE products
      SET name = $1, price = $2, company_name = $3
      WHERE id = $4 AND user_id = $5
      RETURNING *
    `;
    const values = [name, price, company_name, idEntry, userId];

    const result = await client.query(query, values);

    if (result.rowCount === 0) {
      return res.status(400).json({ ok: true, msg: "Nothing to update." });
    }

    return res.status(201).json({ ok: true, msg: "SUCCESSFULLY UPDATED!" })
  } catch (e) {
    return res.status(500).json({ ok: false, msg: e.message })
  }
})


router.get('/api/test/transactions', refresh, accessProtect, async (req, res) => {
  try {
    const userId = req.user.id

    await client.query('BEGIN')

    const trans1 = await client.query("INSERT INTO products (name, price, company_name, user_id) VALUES ($1, $2, $3, $4)", ['test1', 1, '1', userId])
    const trans2 = await client.query("INSERT INTO products (name, price, company_name, user_id) VALUES ($1, $2, $3, $4)", ['test2', 2, '1', userId - 1])

    await client.query('COMMIT')

    return res.status(201).json({ ok: true, msg: "SUCCESSFULLY!" })
  } catch (e) {
    await client.query('ROLLBACK')
    return res.status(500).json({ ok: false, msg: e.message })
  }
})

module.exports = { router }
