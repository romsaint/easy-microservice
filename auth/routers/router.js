require('dotenv').config()
const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const validator = require('validator')
const router = express.Router()

const { refresh } = require('../../server/utils/refreshToken')
const { accessProtect } = require('../../server/utils/accessProtect')

const { Users } = require('../schemas/userSchema')


router.post('/api/registration', async (req, res) => {
    try {
        const { username, password } = req.body
        //  || !validator.isStrongPassword(password)
        if (!username || !password) {
            return res.status(409).json({ ok: false, msg: "Provide the data or check your password" })
        }

        const isUserExists = await Users.findOne({where: {username}})

        if(isUserExists){
            return res.status(400).json({ ok: false, msg: "User already exists" })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const createdUser = await Users.create({username, password: hashedPassword}, {returning: true})

        const refreshToken = jwt.sign(
            { user: { username: createdUser.username, id: createdUser.id } },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '30d' })

        return res.status(201).json({ ok: true, refreshToken, msg: "Successfully created!", id: createdUser.id })
    } catch (e) {
        console.log(e)
        return res.status(e.response?.status || 500).json({ ok: false, msg: e.message })
    }
})

router.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body

        if (!username || !password) {
            return res.status(409).json({ ok: false, msg: "Provide the data or check your password" })
        }

        const isUserExists = await Users.findOne({where: {username}})

        if (isUserExists) {
            return res.status(400).json({ ok: false, msg: "User doesn't exists." })
        }

        const isPasswordValid = await bcrypt.compare(password, isUserExists.password)
        if (!isPasswordValid) {
            return res.status(400).json({ ok: false, msg: "Wrong password." })
        }

        const refreshToken = jwt.sign(
            { user: { username: isUserExists.username, id: isUserExists.id } },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '30d' }
        )

        return res.status(201).json({ ok: true, refreshToken, msg: "Successfully log in!", id: isUserExists.id })

    } catch (e) {
        return res.status(e.response?.status || 500).json({ ok: false, msg: e.message })
    }
})

router.get('/api/logout', refresh, accessProtect, async (req, res) => {
    try {
        res.clearCookie('refreshToken', {
            secure: true, httpOnly: true, sameSite: 'strict', maxAge: 2592000000
        })
        req.accessToken = null

        return res.status(200).json({ ok: true, msg: "Successfully logout" })
    } catch (e) {
        return res.status(e.response?.status || 500).json({ ok: false, msg: e.message })
    }
})

router.get('/api/protect-route', refresh, accessProtect, async (req, res) => {
    return res.status(200).json({ ok: true, msg: 'NICE' })
})


module.exports = { router }