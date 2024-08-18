"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refresh = refresh;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const axios_1 = require("axios");
async function refresh(req, res, next) {
    try {
        const { refreshToken } = req.cookies;
        if (!refreshToken) {
            return res.status(409).json({ ok: false, msg: 'Provide refresh token' });
        }
        try {
            if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
                throw new Error('JWT_ACCESS_SECRET is not defined');
            }
            const decoded = await jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            const accessToken = jsonwebtoken_1.default.sign({ user: { username: decoded.user.username, id: decoded.user.id } }, process.env.JWT_ACCESS_SECRET, { expiresIn: '30s' });
            req.accessToken = accessToken;
            return next();
        }
        catch (err) {
            if (err instanceof axios_1.AxiosError) {
                return res.status(err.response?.status || 500).json({ ok: false, msg: err.message });
            }
            return res.status(500).json({ ok: false, msg: 'Smth error...' });
        }
    }
    catch (err) {
        if (err instanceof axios_1.AxiosError) {
            return res.status(err.response?.status || 500).json({ ok: false, msg: err.message });
        }
        return res.status(500).json({ ok: false, msg: 'Smth error...' });
    }
}
