require('dotenv').config();
const express = require('express')
const { apiRequestDb, apiRequestAuth } = require('../utils/apiRequests')
const router = express.Router()
const axios = require('axios')

router.get('/entries', async (req, res) => {
    try {
        const entries = await apiRequestDb.get('/api/entries')

        return res.status(200).json({ entries: entries.data })
    } catch (error) {
        return res.status(error.response?.status || 500).json({ ok: false, msg: error.response?.data?.msg || error.message });
    }
})

router.post('/add-entry', async (req, res) => {
    try {
        const { name, price, company_name } = req.body

        const response = await apiRequestDb.post('/api/add-entry',
            { name, price, company_name },
            {
                headers: {
                    Cookie: req.headers.cookie
                }
            }
        )

        return res.status(response?.status || 201).json({ response: response.data })
    } catch (error) {

        return res.status(error.response?.status || 500).json({ ok: false, msg: error.response?.data?.msg || error.message });
    }
})

router.post('/delete-entry', async (req, res) => {
    const { id } = req.body
    try {
        const response = await apiRequestDb.post('/api/delete-entry',
            { id },
            {
                headers: {
                    Cookie: req.headers.cookie
                }
            }
        )

        return res.status(response?.status || 201).json({ response: response.data })
    } catch (error) {
      
        return res.status(error.response?.status || 500).json({ ok: false, msg: error.response?.data?.msg || error.message });
    }
})

router.post('/update-entry', async (req, res) => {
    const { idEntry, name, price, company_name } = req.body
    try {
        const response = await apiRequestDb.post('/api/update-entry',
            { idEntry, name, price, company_name },
            {
                headers: {
                    Cookie: req.headers.cookie
                }
            }
        )

        return res.status(response?.status || 201).json({ response: response.data })
    } catch (error) {

        return res.status(error.response?.status || 500).json({ ok: false, msg: error.response?.data?.msg || error.message });
    }
})

router.post('/registration', async (req, res) => {
    try {
        const { username, password } = req.body

        const response = await apiRequestAuth.post('/api/registration', { username, password });

        if (response.data.ok) {
            res.cookie('refreshToken', response.data.refreshToken,
                { maxAge: 2592000000, httpOnly: true, secure: true, sameSite: 'strict' }
            )

            req.user = { id: response.data.id }
        }

        return res.status(response.status).json({ data: response?.data });
    } catch (error) {
        return res.status(error.response?.status || 500).json({ ok: false, msg: error.response?.data?.msg || error.message });
    }
})

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body

        const response = await apiRequestAuth.post('/api/login', { username, password })

        if (response.data.ok) {
            res.cookie('refreshToken', response.data.refreshToken, { username, password },
                { maxAge: 2592000000, httpOnly: true, secure: true, sameSite: 'strict' }
            )

            req.user = { id: response.data.id }
        }

        return res.status(response.status).json({ data: response?.data });
    } catch (error) {
        return res.status(error.response?.status || 500).json({ ok: false, msg: error.response?.data?.msg || error.message });
    }
})

router.post('/logout', async (req, res) => {
    try {
        const response = await apiRequestAuth.get('/api/logout', {
            headers: {
                Cookie: req.headers.cookie
            }
        })

        if (response.data.ok) {
            res.clearCookie('refreshToken', {
                secure: true, httpOnly: true, sameSite: 'strict', maxAge: 2592000000
            })
            req.user = null
        }

        return res.status(response.status).json({ data: response?.data });
    } catch (error) {
        return res.status(error.response?.status || 500).json({ ok: false, msg: error.response?.data?.msg || error.message });
    }
})

router.get('/protect-route', async (req, res) => {
    try {
        const response = await apiRequestAuth.get('/api/protect-route', {
            headers: {
                Cookie: req.headers.cookie
            }
        });

        return res.status(200).json({ data: response.data });
    } catch (error) {

        return res.status(error.response?.status || 500).json({ ok: false, msg: error.response?.data?.msg || error.message });
    }
});


router.post('/oauth', async (rqe, res) => {
    try {
        const response = await apiRequestAuth.post('/api/oauth')
        
        return res.status(response.status).json({ response: response.data })
     } catch (error) {
        return res.status(error.response?.status || 500).json({ ok: false, msg: error.response?.data?.msg || error.message });
    }
})

router.get('/oauth/redirect', async (req, res) => {
    try {
        const response = await apiRequestAuth.get(`/api/oauth/redirect?code=${req.query.code}`)

        res.cookie('refreshToken', response.data.refreshToken,
            { maxAge: 2592000000, httpOnly: true, secure: true, sameSite: 'strict' }
        )

        req.user = { id: response.data.id }
        

        return res.status(response.status || 200).json({ response: response.data })
     } catch (error) {
        return res.status(error.response?.status || 500).json({ ok: false, msg: error.response?.data?.msg || error.message });
    }
})


module.exports = { router }