require('dotenv').config();
const express = require('express')
const app = express()
const axios = require('axios')
const cookieParser = require('cookie-parser')
const cors = require('cors')

const { apiRequestAuth } = require('./utils/apiRequests')
const { apiRequestDb } = require('./utils/apiRequests')


app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(cors())


app.get('/entries', async (req, res) => {
    try {
        const entries = await apiRequestDb.get('/api/entries')

        return res.status(200).json({ entries: entries.data })
    } catch (e) {
        return res.status(error.response?.status || 500).json({ ok: false, msg: error.response?.data?.msg || error.message });
    }
})

app.post('/add-entry', async (req, res) => {
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

app.post('/delete-entry', async (req, res) => {
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
        console.log(error.message)
        return res.status(error.response?.status || 500).json({ ok: false, msg: error.response?.data?.msg || error.message });
    }
})

app.post('/update-entry', async (req, res) => {
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
        console.log(error.message)
        return res.status(error.response?.status || 500).json({ ok: false, msg: error.response?.data?.msg || error.message });
    }
})

app.post('/registration', async (req, res) => {
    try {
        const { username, password } = req.body

        const response = await apiRequestAuth.post('http://127.0.0.1:5002/api/registration', { username, password });

        if (response.data.ok) {
            res.cookie('refreshToken', response.data.refreshToken,
                { maxAge: 2592000000, httpOnly: true, secure: true, sameSite: 'lax', domain: "127.0.0.1" }
            )
        }

        req.user = { id: response.data.id }

        return res.status(response.status).json({ data: response?.data });
    } catch (error) {
        return res.status(error.response?.status || 500).json({ ok: false, msg: error.response?.data?.msg || error.message });
    }
})

app.get('/protect-route', async (req, res) => {
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


app.listen(5000)