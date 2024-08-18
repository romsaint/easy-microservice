import {Request} from 'express';

interface IMyCustomRequest extends Request {
    accessToken?: string | null
    user? : {
        id: number | undefined
    }
}
interface IJWTToken {
    user: {
        username: string
        id: number
    }
}

export {IMyCustomRequest, IJWTToken}