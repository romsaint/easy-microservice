import express from 'express';
import {router} from './routers/router'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import helmet from 'helmet'

const app = express()

app.use(helmet())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser());
app.use(cors({
    origin: ['http://127.0.0.1:5001', 'http://127.0.0.1:5002'],
    credentials: true
}))


app.use(router)

app.listen(5000)