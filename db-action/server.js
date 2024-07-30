require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { accessProtect } = require('../server/utils/accessProtect')
const { refresh } = require('../server/utils/refreshToken')

const { Client } = require('pg');

const client = new Client({
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


app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())

app.get('/api/entries', async (req, res) => {
  try {
    const entries = await client.query(`
      SELECT * FROM products
      ORDER BY id
    `)

    res.status(200).json({ entries: entries.rows })
  } catch (e) {
    return res.status(500).json({ ok: false, msg: e.message })
  }
});

app.post('/api/add-entry', refresh, accessProtect, async (req, res) => {
  try {
    const { name, price, company_name } = req.body
 
    if (!name || !price || !company_name) {
      return res.status(400).json({ ok: false, msg: 'Provide the data!' })
    }
    if (typeof price !== 'number') {
      return res.status(400).json({ ok: false, msg: 'Price should be number' })
    }

    await client.query(`
      INSERT INTO products (name, price, company_name)
      VALUES ($1, $2, $3)
    `, [name, price, company_name]);

    return res.status(201).json({ ok: true, msg: "SUCCESSFULLY CREATED!" })
  } catch (e) {
    return res.status(500).json({ ok: false, msg: e.message })
  }
})

app.delete('/api/delete-entry/:idEntry', async (req, res) => {
  try {
    const { idEntry } = req.params

    if (!idEntry) {
      return res.status(409).json({ ok: false, msg: 'Provide entry id' })
    }

    await client.query(`
      DELETE FROM products
      WHERE id = $1
    `, [idEntry])

    return res.status(200).json({ ok: true, msg: "SUCCESSFULLY DELETED!" })
  } catch (e) {
    return res.status(500).json({ ok: false, msg: e.message })
  }
})

app.post('/api/update-entry/:idEntry', async (req, res) => {
  try {
    const { name, price, company_name } = req.body
    const { idEntry } = req.params

    if (!idEntry) {
      return res.status(409).json({ ok: false, msg: 'Provide entry id' })
    }
    if (!name || !price || !company_name) {
      return res.status(400).json({ ok: false, msg: 'Provide the data!' })
    }
    if (typeof price !== 'number') {
      return res.status(400).json({ ok: false, msg: 'Price should be number' })
    }

    await client.query(`
      UPDATE products 
      SET name = $1, price = $2, company_name = $3)
      WHERE id = $4
    `, [name, price, company_name, idEntry]);

    return res.status(201).json({ ok: true, msg: "SUCCESSFULLY UPDATED!" })
  } catch (e) {
    return res.status(500).json({ ok: false, msg: e.message })
  }
})


app.listen(5001);