import jwt from 'jsonwebtoken'
import { IMyCustomRequest, IJWTToken } from '../interfaces/serverInterface';
import { Response, NextFunction } from 'express';
import { AxiosError } from 'axios'


async function refresh(req: IMyCustomRequest, res: Response, next: NextFunction) {
    try {
        const { refreshToken } = req.cookies

        if (!refreshToken) {
            return res.status(409).json({ ok: false, msg: 'Provide refresh token' })
        }
        try {
            if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
                throw new Error('JWT_ACCESS_SECRET is not defined');
            }

            const decoded = await jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET) as IJWTToken;

            const accessToken = jwt.sign(
                { user: { username: decoded.user.username, id: decoded.user.id } },
                process.env.JWT_ACCESS_SECRET,
                { expiresIn: '30s' })

            req.accessToken = accessToken

            return next()
        } catch (err) {
            if (err instanceof AxiosError) {
                return res.status(err.response?.status || 500).json({ ok: false, msg: err.message });
            }

            return res.status(500).json({ ok: false, msg: 'Smth error...' });
        }
    } catch (err) {
        if (err instanceof AxiosError) {
            return res.status(err.response?.status || 500).json({ ok: false, msg: err.message });
        }

        return res.status(500).json({ ok: false, msg: 'Smth error...' });
    }
}


export { refresh }