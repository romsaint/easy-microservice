require('dotenv').config()
const express = require('express')
const app = express()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const validator = require('validator')
const { OAuth2Client } = require('google-auth-library')
const { Client } = require('pg')
const cookieParser = require('cookie-parser')
const cors = require('cors')

const { refresh } = require('../server/utils/refreshToken')
const { accessProtect } = require('../server/utils/accessProtect')

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

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser());
app.use(cors())


app.post('/api/registration', async (req, res) => {
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
        const accessToken = jwt.sign(
            { user: { username: createdUser.rows[0].username, id: createdUser.rows[0].id } },
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: '30s' })

        req.user = { id: createdUser.rows[0].id }

        return res.status(201).json({ ok: true, accessToken, refreshToken, msg: "Successfully created!", id: createdUser.rows[0].id })
    } catch (e) {
        if(e.code === '23505') return res.status(400).json({ ok: false, msg: "User already exists" })
        
        return res.status(e.response?.status || 500).json({ ok: false, msg: e.message })
    }
})


app.get('/api/protect-route', refresh, accessProtect, async (req, res) => {
    return res.status(200).json({ ok: true, msg: 'NICE' })
})


app.listen(5002)