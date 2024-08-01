require('dotenv').config()
const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const validator = require('validator')
const router = express.Router()

const { Client } = require('pg')
const { refresh } = require('../../server/utils/refreshToken')
const { accessProtect } = require('../../server/utils/accessProtect')

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: process.env.SECRET_DBNAME_POSTGRE_USERS,
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


router.post('/api/registration', async (req, res) => {
    try {
        const { username, password } = req.body
        //  || !validator.isStrongPassword(password)
        if (!username || !password) {
            return res.status(409).json({ ok: false, msg: "Provide the data or check your password" })
        }

        const isUserExists = await client.query(`
        SELECT username FROM users
        WHERE username = $1 AND password = $2
    `, [username, password])

        const hashedPassword = await bcrypt.hash(password, 10)
        const createdUser = await client.query(`
            INSERT INTO users (username, password)
            VALUES ($1, $2)
            RETURNING *
        `, [username, hashedPassword])

        const refreshToken = jwt.sign(
            { user: { username: createdUser.rows[0].username, id: createdUser.rows[0].id } },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '30d' })

        return res.status(201).json({ ok: true, refreshToken, msg: "Successfully created!", id: createdUser.rows[0].id })
    } catch (e) {
        if (e.code === '23505') return res.status(400).json({ ok: false, msg: "User already exists" })

        return res.status(e.response?.status || 500).json({ ok: false, msg: e.message })
    }
})

router.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body

        if (!username || !password) {
            return res.status(409).json({ ok: false, msg: "Provide the data or check your password" })
        }

        const isUserExists = await client.query(`
            SELECT * FROM users
            WHERE username = $1`,
            [username]
        )

        if (isUserExists.rowCount === 0) {
            return res.status(400).json({ ok: false, msg: "User doesn't exists." })
        }

        const isPasswordValid = await bcrypt.compare(password, isUserExists.rows[0].password)
        if (!isPasswordValid) {
            return res.status(400).json({ ok: false, msg: "Wrong password." })
        }

        const refreshToken = jwt.sign(
            { user: { username: isUserExists.rows[0].username, id: isUserExists.rows[0].id } },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '30d' }
        )

        return res.status(201).json({ ok: true, refreshToken, msg: "Successfully log in!", id: isUserExists.rows[0].id })

    } catch (e) {
        return res.status(e.response?.status || 500).json({ ok: false, msg: e.message })
    }
})

router.get('/api/logout', refresh, accessProtect, async (req, res) => {
    try{
        res.clearCookie('refreshToken', {
            secure: true, httpOnly: true, sameSite: 'strict', maxAge: 2592000000
        })
        req.accessToken = null

        return res.status(200).json({ok: true, msg: "Successfully logout"})
    } catch (e) {
        return res.status(e.response?.status || 500).json({ ok: false, msg: e.message })
    }
})

router.get('/api/protect-route', refresh, accessProtect, async (req, res) => {
    return res.status(200).json({ ok: true, msg: 'NICE' })
})


module.exports = {router}