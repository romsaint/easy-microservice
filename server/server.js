const express = require('express')
const app = express()
const cookieParser = require('cookie-parser')
const cors = require('cors')
const helmet = require('helmet')
const { router } = require('./routers/router')

app.use(helmet())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(cors({
    origin: ['http://127.0.0.1:5001', 'http://127.0.0.1:5002'],
    credentials: true
}))


app.use(router)


app.listen(5000)