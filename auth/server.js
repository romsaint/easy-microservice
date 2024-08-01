const express = require('express')
const app = express()
const {router} = require('./routers/router')
const { OAuth2Client } = require('google-auth-library')

const cookieParser = require('cookie-parser')
const cors = require('cors')


app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser());
app.use(cors({
    origin: 'http://127.0.0.1:5000',
    credentials: true
}))


app.use(router)

app.listen(5002)