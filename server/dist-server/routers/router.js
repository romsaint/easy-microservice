"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const apiRequests_1 = require("../utils/apiRequests");
const axios_1 = require("axios");
const router = express_1.default.Router();
exports.router = router;
router.get('/entries', async (req, res) => {
    try {
        const entries = await apiRequests_1.apiRequestDb.get('/api/entries');
        return res.status(200).json({ entries: entries.data });
    }
    catch (error) {
        if (error instanceof axios_1.AxiosError) {
            return res.status(error.response?.status || 500).json({ ok: false, msg: error.response?.data?.msg || error.message });
        }
        return res.status(500).json({ ok: false, msg: 'Smth error' });
    }
});
router.post('/add-entry', async (req, res) => {
    try {
        const { name, price, company_name } = req.body;
        const response = await apiRequests_1.apiRequestDb.post('/api/add-entry', { name, price, company_name }, {
            headers: {
                Cookie: req.headers.cookie
            }
        });
        return res.status(response?.status || 201).json({ response: response.data });
    }
    catch (error) {
        if (error instanceof axios_1.AxiosError) {
            return res.status(error.response?.status || 500).json({ ok: false, msg: error.response?.data?.msg || error.message });
        }
        return res.status(500).json({ ok: false, msg: 'Smth error' });
    }
});
router.post('/delete-entry', async (req, res) => {
    const { id } = req.body;
    try {
        const response = await apiRequests_1.apiRequestDb.post('/api/delete-entry', { id }, {
            headers: {
                Cookie: req.headers.cookie
            }
        });
        return res.status(response?.status || 201).json({ response: response.data });
    }
    catch (error) {
        if (error instanceof axios_1.AxiosError) {
            return res.status(error.response?.status || 500).json({ ok: false, msg: error.response?.data?.msg || error.message });
        }
        return res.status(500).json({ ok: false, msg: 'Smth error' });
    }
});
router.post('/update-entry', async (req, res) => {
    const { idEntry, name, price, company_name } = req.body;
    try {
        const response = await apiRequests_1.apiRequestDb.post('/api/update-entry', { idEntry, name, price, company_name }, {
            headers: {
                Cookie: req.headers.cookie
            }
        });
        return res.status(response?.status || 201).json({ response: response.data });
    }
    catch (error) {
        if (error instanceof axios_1.AxiosError) {
            return res.status(error.response?.status || 500).json({ ok: false, msg: error.response?.data?.msg || error.message });
        }
        return res.status(500).json({ ok: false, msg: 'Smth error' });
    }
});
router.post('/registration', async (req, res) => {
    try {
        const { username, password } = req.body;
        const response = await apiRequests_1.apiRequestAuth.post('/api/registration', { username, password });
        if (response.data.ok) {
            res.cookie('refreshToken', response.data.refreshToken, { maxAge: 2592000000, httpOnly: true, secure: true, sameSite: 'strict' });
            req.user = { id: response.data.id };
        }
        return res.status(response.status).json({ data: response?.data });
    }
    catch (error) {
        if (error instanceof axios_1.AxiosError) {
            return res.status(error.response?.status || 500).json({ ok: false, msg: error.response?.data?.msg || error.message });
        }
        return res.status(500).json({ ok: false, msg: 'Smth error' });
    }
});
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const response = await apiRequests_1.apiRequestAuth.post('/api/login', { username, password });
        if (response.data.ok) {
            res.cookie('refreshToken', response.data.refreshToken, { maxAge: 2592000000, httpOnly: true, secure: true, sameSite: 'strict' });
            req.user = { id: response.data.id };
        }
        return res.status(response.status).json({ data: response?.data });
    }
    catch (error) {
        if (error instanceof axios_1.AxiosError) {
            return res.status(error.response?.status || 500).json({ ok: false, msg: error.response?.data?.msg || error.message });
        }
        return res.status(500).json({ ok: false, msg: 'Smth error' });
    }
});
router.post('/logout', async (req, res) => {
    try {
        const response = await apiRequests_1.apiRequestAuth.get('/api/logout', {
            headers: {
                Cookie: req.headers.cookie
            }
        });
        if (response.data.ok) {
            res.clearCookie('refreshToken', {
                secure: true, httpOnly: true, sameSite: 'strict', maxAge: 2592000000
            });
            req.user = undefined;
        }
        return res.status(response.status).json({ data: response?.data });
    }
    catch (error) {
        if (error instanceof axios_1.AxiosError) {
            return res.status(error.response?.status || 500).json({ ok: false, msg: error.response?.data?.msg || error.message });
        }
        return res.status(500).json({ ok: false, msg: 'Smth error' });
    }
});
router.get('/protect-route', async (req, res) => {
    try {
        const response = await apiRequests_1.apiRequestAuth.get('/api/protect-route', {
            headers: {
                Cookie: req.headers.cookie
            }
        });
        return res.status(200).json({ data: response.data });
    }
    catch (error) {
        if (error instanceof axios_1.AxiosError) {
            return res.status(error.response?.status || 500).json({ ok: false, msg: error.response?.data?.msg || error.message });
        }
        return res.status(500).json({ ok: false, msg: 'Smth error' });
    }
});
router.post('/oauth', async (rqe, res) => {
    try {
        const response = await apiRequests_1.apiRequestAuth.post('/api/oauth');
        return res.status(response.status).json({ response: response.data });
    }
    catch (error) {
        if (error instanceof axios_1.AxiosError) {
            return res.status(error.response?.status || 500).json({ ok: false, msg: error.response?.data?.msg || error.message });
        }
        return res.status(500).json({ ok: false, msg: 'Smth error' });
    }
});
router.get('/oauth/redirect', async (req, res) => {
    try {
        const response = await apiRequests_1.apiRequestAuth.get(`/api/oauth/redirect?code=${req.query.code}`);
        res.cookie('refreshToken', response.data.refreshToken, { maxAge: 2592000000, httpOnly: true, secure: true, sameSite: 'strict' });
        req.user = { id: response.data.id };
        return res.status(response.status || 200).json({ response: response.data });
    }
    catch (error) {
        if (error instanceof axios_1.AxiosError) {
            return res.status(error.response?.status || 500).json({ ok: false, msg: error.response?.data?.msg || error.message });
        }
        return res.status(500).json({ ok: false, msg: 'Smth error' });
    }
});
