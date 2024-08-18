import jwt from 'jsonwebtoken';
import { IMyCustomRequest } from '../interfaces/serverInterface';
import { Response, NextFunction } from 'express';
import {AxiosError} from 'axios'

const verifyToken = (token: string, secret: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        jwt.verify(token, secret, (err, decoded) => {
            if (err) {
                return reject(err);
            }
            resolve(decoded);
        });
    });
};

async function accessProtect(req: IMyCustomRequest, res: Response, next: NextFunction) {
    const accessToken = req.accessToken;

    if (!accessToken) {
        return res.status(409).json({ ok: false, msg: 'Provide access token' });
    }

    if (!process.env.JWT_ACCESS_SECRET) {
        throw new Error('JWT_ACCESS_SECRET is not defined');
    }

    try {
        const decoded = await verifyToken(accessToken, process.env.JWT_ACCESS_SECRET);
        req.user = { id: decoded.user.id };
        
        return next();
    } catch (e) {
        if(e instanceof AxiosError){
            return res.status(e.response?.status || 500).json({ ok: false, msg: e.message });
        }

        return res.status(500).json({ ok: false, msg: 'Smth error...'});
    }
}

export { accessProtect };