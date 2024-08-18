"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refresh = refresh;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const axios_1 = require("axios");
function refresh(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            const { refreshToken } = req.cookies;
            if (!refreshToken) {
                return res.status(409).json({ ok: false, msg: 'Provide refresh token' });
            }
            try {
                if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
                    throw new Error('JWT_ACCESS_SECRET is not defined');
                }
                const decoded = yield jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
                const accessToken = jsonwebtoken_1.default.sign({ user: { username: decoded.user.username, id: decoded.user.id } }, process.env.JWT_ACCESS_SECRET, { expiresIn: '30s' });
                req.accessToken = accessToken;
                return next();
            }
            catch (err) {
                if (err instanceof axios_1.AxiosError) {
                    return res.status(((_a = err.response) === null || _a === void 0 ? void 0 : _a.status) || 500).json({ ok: false, msg: err.message });
                }
                return res.status(500).json({ ok: false, msg: 'Smth error...' });
            }
        }
        catch (err) {
            if (err instanceof axios_1.AxiosError) {
                return res.status(((_b = err.response) === null || _b === void 0 ? void 0 : _b.status) || 500).json({ ok: false, msg: err.message });
            }
            return res.status(500).json({ ok: false, msg: 'Smth error...' });
        }
    });
}
