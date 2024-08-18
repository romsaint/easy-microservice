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
function accessProtect(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const accessToken = req.accessToken;
        if (!accessToken) {
            return res.status(409).json({ ok: false, msg: 'Provide access token' });
        }
        if (!process.env.JWT_ACCESS_SECRET) {
            throw new Error('JWT_ACCESS_SECRET is not defined');
        }
        try {
            const decoded = yield verifyToken(accessToken, process.env.JWT_ACCESS_SECRET);
            req.user = { id: decoded.user.id };
            return next();
        }
        catch (e) {
            if (e instanceof axios_1.AxiosError) {
                return res.status(((_a = e.response) === null || _a === void 0 ? void 0 : _a.status) || 500).json({ ok: false, msg: e.message });
            }
            return res.status(500).json({ ok: false, msg: 'Smth error...' });
        }
    });
}
