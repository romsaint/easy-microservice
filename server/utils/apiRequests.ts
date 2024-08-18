import axios from 'axios'

const apiRequestAuth = axios.create({
    baseURL: "http://127.0.0.1:5002",
    withCredentials: true
})
const apiRequestDb = axios.create({
    baseURL: "http://127.0.0.1:5001",
    withCredentials: true
})


export { apiRequestAuth, apiRequestDb }