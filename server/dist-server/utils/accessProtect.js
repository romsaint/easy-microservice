"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.accessProtect = accessProtect;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const axios_1 = require("axios");
const verifyToken = (token, secret) => {
    return new Promise((resolve, reject) => {
        jsonwebtoken_1.default.verify(token, secret, (err, decoded) => {
            if (err) {
                return reject(err);
            }
            resolve(decoded);
        });
    });
};
async function accessProtect(req, res, next) {
    const accessToken = req.accessToken;
    if (!accessToken) {
        return res.status(409).json({ ok: false, msg: 'Provide access token' });
    }
    if (!process.env.JWT_ACCESS_SECRET) {
        throw new Error('JWT_ACCESS_SECRET is not defined');
    }
    try {
        const decoded = await verifyToken(accessToken, process.env.JWT_ACCESS_SECRET);
        req.user = { id: decoded.user.id };
        return next();
    }
    catch (e) {
        if (e instanceof axios_1.AxiosError) {
            return res.status(e.response?.status || 500).json({ ok: false, msg: e.message });
        }
        return res.status(500).json({ ok: false, msg: 'Smth error...' });
    }
}
