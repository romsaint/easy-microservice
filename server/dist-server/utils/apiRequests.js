"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRequestDb = exports.apiRequestAuth = void 0;
const axios_1 = __importDefault(require("axios"));
const apiRequestAuth = axios_1.default.create({
    baseURL: "http://127.0.0.1:5002",
    withCredentials: true
});
exports.apiRequestAuth = apiRequestAuth;
const apiRequestDb = axios_1.default.create({
    baseURL: "http://127.0.0.1:5001",
    withCredentials: true
});
exports.apiRequestDb = apiRequestDb;
