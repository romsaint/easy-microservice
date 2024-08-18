import {Request} from 'express'

declare interface IMyCustomRequest extends Request {
    accessToken?: string | null
    user?: {
        id: number
    }
}

export {IMyCustomRequest}