const axios = require('axios')

const apiRequestAuth = axios.create({
    baseURL: "http://127.0.0.1:5002",
    withCredentials: true
})
const apiRequestDb = axios.create({
    baseURL: "http://127.0.0.1:5001",
    withCredentials: true
})


module.exports = { apiRequestAuth, apiRequestDb }