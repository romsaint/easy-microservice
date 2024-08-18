"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const pg_1 = require("pg");
const google_auth_library_1 = require("google-auth-library");
const axios_1 = __importStar(require("axios"));
const uuid_1 = __importDefault(require("uuid"));
const refreshToken_1 = require("../../server/utils/refreshToken");
const accessProtect_1 = require("../../server/utils/accessProtect");
const router = express_1.default.Router();
exports.router = router;
const client = new pg_1.Client({
    user: 'postgres',
    host: 'localhost',
    database: process.env.SECRET_DBNAME_POSTGRE_USERS,
    password: process.env.SECRET_PASSWORD_POSTGRE,
    port: 5432,
});
async function connect() {
    try {
        await client.connect();
    }
    catch (err) {
    }
}
connect();
router.post('/api/registration', async (req, res) => {
    try {
        const { username, password } = req.body;
        //  || !validator.isStrongPassword(password)
        if (!username || !password) {
            return res.status(409).json({ ok: false, msg: "Provide the data or check your password" });
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
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
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
        const refreshToken = jsonwebtoken_1.default.sign({ user: { username: createdUser.username, id: createdUser.id } }, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });
        return res.status(201).json({ ok: true, refreshToken, msg: "Successfully created!", id: createdUser.id });
    }
    catch (e) {
        if (e instanceof axios_1.AxiosError) {
            return res.status(e?.response?.status || 500).json({ ok: false, msg: e.message });
        }
        return res.status(500).json({ ok: false, msg: 'Smth error' });
    }
});
router.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(409).json({ ok: false, msg: "Provide the data or check your password" });
        }
        const isUserExistsQuery = `
        SELECT * FROM users
        WHERE username = $1
      `;
        const isUserExistsValues = [username];
        const isUserExistsResult = await client.query(isUserExistsQuery, isUserExistsValues);
        if (isUserExistsResult.rows.length === 0) {
            return res.status(400).json({ ok: false, msg: "User doesn't exists." });
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, isUserExistsResult.rows[0].password);
        if (!isPasswordValid) {
            return res.status(400).json({ ok: false, msg: "Wrong password." });
        }
        if (!process.env.JWT_REFRESH_SECRET) {
            throw new Error('JWT_REFRESH_SECRET is not defined');
        }
        const refreshToken = jsonwebtoken_1.default.sign({ user: { username: isUserExistsResult.rows[0].username, id: isUserExistsResult.rows[0].id } }, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });
        return res.status(201).json({ ok: true, refreshToken, msg: "Successfully log in!", id: isUserExistsResult.rows[0].id });
    }
    catch (e) {
        if (e instanceof axios_1.AxiosError) {
            return res.status(e?.response?.status || 500).json({ ok: false, msg: e.message });
        }
        return res.status(500).json({ ok: false, msg: 'Smth error' });
    }
});
router.get('/api/logout', refreshToken_1.refresh, accessProtect_1.accessProtect, async (req, res) => {
    try {
        res.clearCookie('refreshToken', {
            secure: true, httpOnly: true, sameSite: 'strict', maxAge: 2592000000
        });
        req.accessToken = null;
        return res.status(200).json({ ok: true, msg: "Successfully logout" });
    }
    catch (e) {
        if (e instanceof axios_1.AxiosError) {
            return res.status(e?.response?.status || 500).json({ ok: false, msg: e.message });
        }
        return res.status(500).json({ ok: false, msg: 'Smth error' });
    }
});
//     OAUTH
router.post('/api/oauth', async (req, res) => {
    const redirectUri = 'http://127.0.0.1:5000/oauth/redirect';
    const oauth = new google_auth_library_1.OAuth2Client({
        clientId: process.env.GOOGLE_SECRET_ID, clientSecret: process.env.GOOGLE_SECRET_SECRET, redirectUri
    });
    const url = oauth.generateAuthUrl({
        access_type: 'offline',
        scope: "https://www.googleapis.com/auth/userinfo.profile",
        prompt: "consent"
    });
    return res.status(200).json({ ok: true, url });
});
async function getDataOauth(accessToken) {
    try {
        const res = await axios_1.default.get(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`);
        return res.data;
    }
    catch (e) {
        throw new Error('Error during axios operation');
    }
}
router.get('/api/oauth/redirect', async (req, res) => {
    const code = req.query.code;
    try {
        if (code) {
            const redirectUri = 'http://127.0.0.1:5000/oauth/redirect';
            const oauth = new google_auth_library_1.OAuth2Client({
                clientId: process.env.GOOGLE_SECRET_ID, clientSecret: process.env.GOOGLE_SECRET_SECRET, redirectUri
            });
            async function getTokens(code) {
                return await oauth.getToken(code);
            }
            const { tokens } = await getTokens(code);
            await oauth.setCredentials(tokens);
            const userData = await getDataOauth(tokens.access_token);
            const givenName = userData.given_name;
            const username = `${givenName}_${uuid_1.default.v4()}`;
            const password = uuid_1.default.v4().slice(3, 11);
            const hashedPassword = await bcryptjs_1.default.hash(password, 10);
            const insertIntoQuery = `
                INSERT INTO users (username, password)
                VALUES ($1, $2)
                RETURNING id, username
            `;
            const insertIntoValues = [username, hashedPassword];
            const insertIntoResult = await client.query(insertIntoQuery, insertIntoValues);
            const createdUser = insertIntoResult.rows[0];
            const id = createdUser.id;
            if (!process.env.JWT_REFRESH_SECRET) {
                throw new Error('JWT_REFRESH_SECRET is not defined');
            }
            const refreshToken = jsonwebtoken_1.default.sign({ user: { username: createdUser.username, id: createdUser.id } }, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });
            return res.status(200).json({ ok: true, id, refreshToken });
        }
        return res.status(400).json({ ok: false, msg: "There's no code" });
    }
    catch (e) {
        if (e instanceof axios_1.AxiosError) {
            return res.status(e?.response?.status || 500).json({ ok: false, msg: e.message });
        }
        return res.status(500).json({ ok: false, msg: 'Smth error' });
    }
});
router.get('/api/protect-route', refreshToken_1.refresh, accessProtect_1.accessProtect, (req, res) => {
    return res.status(200).json({ msg: "NICE" });
});
