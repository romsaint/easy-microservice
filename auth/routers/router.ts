import 'dotenv/config';
import express, {Request, Response} from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Client } from 'pg';
import {OAuth2Client} from 'google-auth-library'
import axios, {AxiosError} from 'axios'
import uuid from 'uuid'

import { refresh } from '../../server/utils/refreshToken';
import { accessProtect } from '../../server/utils/accessProtect';
import {IMyCustomRequest} from '../interfaces/authInterfaces'


const router = express.Router()

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

    }
}
connect()


router.post('/api/registration', async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body
        //  || !validator.isStrongPassword(password)
        if (!username || !password) {
            return res.status(409).json({ ok: false, msg: "Provide the data or check your password" })
        }

        const isUserExistsQuery = `
        SELECT * FROM users
        WHERE username = $1
      `;
        const isUserExistsValues = [username];

        const isUserExistsResult = await client.query(isUserExistsQuery, isUserExistsValues);

        if (isUserExistsResult.rows.length > 0) {
            return res.status(400).json({ ok: false, msg: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const insertIntoQuery = `
            INSERT INTO users (username, password)
            VALUES ($1, $2)
            RETURNING id, username
        `;
        const insertIntoValues = [username, hashedPassword];

        const insertIntoResult = await client.query(insertIntoQuery, insertIntoValues);
        const createdUser = insertIntoResult.rows[0];

        if (!process.env.JWT_REFRESH_SECRET) {
            throw new Error('JWT_REFRESH_SECRET is not defined');
        }

        const refreshToken = jwt.sign(
            { user: { username: createdUser.username, id: createdUser.id } },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '30d' }
        );

        return res.status(201).json({ ok: true, refreshToken, msg: "Successfully created!", id: createdUser.id });

    } catch (e) {
        if(e instanceof AxiosError){
            return res.status(e?.response?.status || 500).json({ ok: false, msg: e.message })
        }
        return res.status(500).json({ ok: false, msg: 'Smth error' })
    }
})

router.post('/api/login', async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body

        if (!username || !password) {
            return res.status(409).json({ ok: false, msg: "Provide the data or check your password" })
        }

        const isUserExistsQuery = `
        SELECT * FROM users
        WHERE username = $1
      `;
        const isUserExistsValues = [username];

        const isUserExistsResult = await client.query(isUserExistsQuery, isUserExistsValues);

        if (isUserExistsResult.rows.length === 0) {
            return res.status(400).json({ ok: false, msg: "User doesn't exists." })
        }

        const isPasswordValid = await bcrypt.compare(password, isUserExistsResult.rows[0].password)
        if (!isPasswordValid) {
            return res.status(400).json({ ok: false, msg: "Wrong password." })
        }
        if (!process.env.JWT_REFRESH_SECRET) {
            throw new Error('JWT_REFRESH_SECRET is not defined');
        }

        const refreshToken = jwt.sign(
            { user: { username: isUserExistsResult.rows[0].username, id: isUserExistsResult.rows[0].id } },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '30d' }
        )

        return res.status(201).json({ ok: true, refreshToken, msg: "Successfully log in!", id: isUserExistsResult.rows[0].id })

    } catch (e) {
        if(e instanceof AxiosError){
            return res.status(e?.response?.status || 500).json({ ok: false, msg: e.message })
        }
        return res.status(500).json({ ok: false, msg: 'Smth error' })
    }
})

router.get('/api/logout', refresh, accessProtect, async (req: IMyCustomRequest, res: Response) => {
    try {
        res.clearCookie('refreshToken', {
            secure: true, httpOnly: true, sameSite: 'strict', maxAge: 2592000000
        })
        req.accessToken = null

        return res.status(200).json({ ok: true, msg: "Successfully logout" })
    } catch (e) {
        if(e instanceof AxiosError){
            return res.status(e?.response?.status || 500).json({ ok: false, msg: e.message })
        }
        return res.status(500).json({ ok: false, msg: 'Smth error' })
    }
})
//     OAUTH

router.post('/api/oauth', async (req, res) => {
    const redirectUri = 'http://127.0.0.1:5000/oauth/redirect'
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

async function getDataOauth(accessToken: string) {
    try {
        const res = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`)
        return res.data
    } catch (e) {
        throw new Error('Error during axios operation')
    }
}

router.get('/api/oauth/redirect', async (req, res) => {
    const code = req.query.code as string

    try {
        if (code) {
            const redirectUri = 'http://127.0.0.1:5000/oauth/redirect'
            const oauth = new OAuth2Client({
                clientId: process.env.GOOGLE_SECRET_ID, clientSecret: process.env.GOOGLE_SECRET_SECRET, redirectUri
            })

            async function getTokens(code: string): Promise<any>{
                return await oauth.getToken(code)
            }
            
            const { tokens } = await getTokens(code)
            await oauth.setCredentials(tokens)

            const userData = await getDataOauth(tokens.access_token)
            const givenName = userData.given_name

            const username = `${givenName}_${uuid.v4()}`
            const password = uuid.v4().slice(3, 11)
            const hashedPassword = await bcrypt.hash(password, 10)


            const insertIntoQuery = `
                INSERT INTO users (username, password)
                VALUES ($1, $2)
                RETURNING id, username
            `;
            const insertIntoValues = [username, hashedPassword];

            const insertIntoResult = await client.query(insertIntoQuery, insertIntoValues);
            const createdUser = insertIntoResult.rows[0];
            const id = createdUser.id

            if (!process.env.JWT_REFRESH_SECRET) {
                throw new Error('JWT_REFRESH_SECRET is not defined');
            }

            const refreshToken = jwt.sign(
                { user: { username: createdUser.username, id: createdUser.id } },
                process.env.JWT_REFRESH_SECRET,
                { expiresIn: '30d' }
            );

            return res.status(200).json({ ok: true, id, refreshToken })
        }

        return res.status(400).json({ ok: false, msg: "There's no code" })
        
    } catch (e) {
        if(e instanceof AxiosError){
            return res.status(e?.response?.status || 500).json({ ok: false, msg: e.message })
        }
        return res.status(500).json({ ok: false, msg: 'Smth error' })
    }
})

router.get('/api/protect-route', refresh, accessProtect, (req, res) => {
    return res.status(200).json({msg: "NICE"})
})


export {router}