require('dotenv').config()
const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const validator = require('validator')
const { Client } = require('pg')
const {OAuth2Client} = require('google-auth-library')
const axios = require('axios')

const router = express.Router()
const { refresh } = require('../../server/utils/refreshToken')
const { accessProtect } = require('../../server/utils/accessProtect')

const {Worker, parentPort, isMainThread, workerData} = require('worker_threads')
const os = require('os')
const path = require('path')
const fs = require('fs');


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


router.post('/api/oauth', async (req, res) => {
    const redirectUri = 'http://127.0.0.1:5002/api/oauth/redirect'
    const oauth = new OAuth2Client({
        clientId: process.env.GOOGLE_SECRET_ID, clientSecret: process.env.GOOGLE_SECRET_SECRET, redirectUri
    })

    const url = oauth.generateAuthUrl({
        access_type: 'offline',
        scope: "https://www.googleapis.com/auth/userinfo.profile",
        prompt: "consent"
    })
    

    return res.status(200).json({ ok: true, url })
})

async function getDataOauth(accessToken){
    try{
        const res = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`)

        return res.data
    }catch(e){
        return res.status(e.response?.status || 500).json({ ok: false, msg: e.message })
    }
} 

router.get('/api/oauth/redirect', async (req, res) => {
    const code = req.query.code

    try{
        if(code){
            const redirectUri = 'http://127.0.0.1:5002/api/oauth/redirect'
            const oauth = new OAuth2Client({
                clientId: process.env.GOOGLE_SECRET_ID, clientSecret: process.env.GOOGLE_SECRET_SECRET, redirectUri
            })

            const {tokens} = await oauth.getToken(code)
            await oauth.setCredentials(tokens)

            const userData = await getDataOauth(tokens.access_token)

            return res.status(200).json({ok: true, userData})
        }

        return res.status(200).json({ok: false, msg: "There's no code"})
    }catch(e){
        return res.status(e.response?.status || 500).json({ ok: false, msg: e.message })
    }
})



module.exports = {router}