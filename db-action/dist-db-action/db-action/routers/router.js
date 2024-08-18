"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const pg_1 = require("pg");
const axios_1 = require("axios");
const accessProtect_1 = require("../../server/utils/accessProtect");
const refreshToken_1 = require("../../server/utils/refreshToken");
const router = express_1.default.Router();
exports.router = router;
const client = new pg_1.Pool({
    user: 'postgres',
    host: 'localhost',
    database: process.env.SECRET_DBNAME_POSTGRE_DB,
    password: process.env.SECRET_PASSWORD_POSTGRE,
    port: 5432,
});
function connect() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield client.connect();
        }
        catch (err) {
            if (err instanceof axios_1.AxiosError) {
                console.error('Error', err.stack);
            }
            console.log('Error');
        }
    });
}
connect();
router.get('/api/entries', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const entries = yield client.query(`
    SELECT * FROM products
    ORDER BY id
    `);
        return res.status(200).json({ entries: entries.rows });
    }
    catch (e) {
        if (e instanceof axios_1.AxiosError) {
            return res.status(500).json({ ok: false, msg: e.message });
        }
        return res.status(500).json({ ok: false, msg: 'Smth error' });
    }
}));
router.post('/api/add-entry', refreshToken_1.refresh, accessProtect_1.accessProtect, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { name, price, company_name } = req.body;
        if (!name || !price || !company_name) {
            return res.status(400).json({ ok: false, msg: 'Provide the data!' });
        }
        if (typeof price !== 'number') {
            return res.status(400).json({ ok: false, msg: 'Price should be number' });
        }
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ ok: false, msg: "There's no user id" });
        }
        const query = `
    INSERT INTO products (name, price, company_name, user_id)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
        const values = [name, price, company_name, userId];
        const result = yield client.query(query, values);
        return res.status(201).json({ ok: true, msg: "SUCCESSFULLY CREATED!", result: result.rows });
    }
    catch (e) {
        if (e instanceof pg_1.DatabaseError) {
            if (e.code === '23503') {
                return res.status(500).json({ ok: false, msg: "There's no such company name" });
            }
            return res.status(500).json({ ok: false, msg: e.message });
        }
        else {
            return res.status(500).json({ ok: false, msg: 'An unknown error occurred' });
        }
    }
}));
router.post('/api/delete-entry', refreshToken_1.refresh, accessProtect_1.accessProtect, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.body;
        if (!id) {
            return res.status(409).json({ ok: false, msg: 'Auth please' });
        }
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ ok: false, msg: "There's no user id" });
        }
        const deleted = yield client.query(`
      DELETE FROM products
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, [id, userId]);
        if (deleted.rowCount === 0) {
            return res.status(400).json({ ok: true, msg: "Nothing to delete." });
        }
        return res.status(200).json({ ok: true, msg: "SUCCESSFULLY DELETED!" });
    }
    catch (e) {
        if (e instanceof pg_1.DatabaseError) {
            return res.status(500).json({ ok: false, msg: e.message });
        }
        else {
            return res.status(500).json({ ok: false, msg: 'An unknown error occurred' });
        }
    }
}));
router.post('/api/update-entry', refreshToken_1.refresh, accessProtect_1.accessProtect, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { idEntry, name, price, company_name } = req.body;
        if (!idEntry) {
            return res.status(409).json({ ok: false, msg: 'Provide product id' });
        }
        if (!name || !price || !company_name) {
            return res.status(400).json({ ok: false, msg: 'Provide the data!' });
        }
        if (typeof price !== 'number') {
            return res.status(400).json({ ok: false, msg: 'Price should be number' });
        }
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ ok: false, msg: "There's no user id" });
        }
        const query = `
      UPDATE products
      SET name = $1, price = $2, company_name = $3
      WHERE id = $4 AND user_id = $5
      RETURNING *
    `;
        const values = [name, price, company_name, idEntry, userId];
        const result = yield client.query(query, values);
        if (result.rowCount === 0) {
            return res.status(400).json({ ok: true, msg: "Nothing to update." });
        }
        return res.status(201).json({ ok: true, msg: "SUCCESSFULLY UPDATED!" });
    }
    catch (e) {
        if (e instanceof pg_1.DatabaseError) {
            return res.status(500).json({ ok: false, msg: e.message });
        }
        else {
            return res.status(500).json({ ok: false, msg: 'An unknown error occurred' });
        }
    }
}));
router.get('/api/test/transactions', refreshToken_1.refresh, accessProtect_1.accessProtect, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (userId) {
            yield client.query('BEGIN');
            const trans1 = yield client.query("INSERT INTO products (name, price, company_name, user_id) VALUES ($1, $2, $3, $4)", ['test1', 1, '1', userId]);
            const trans2 = yield client.query("INSERT INTO products (name, price, company_name, user_id) VALUES ($1, $2, $3, $4)", ['test2', 2, '1', userId - 1]);
            yield client.query('COMMIT');
        }
        return res.status(201).json({ ok: true, msg: "SUCCESSFULLY!" });
    }
    catch (e) {
        yield client.query('ROLLBACK');
        if (e instanceof pg_1.DatabaseError) {
            return res.status(500).json({ ok: false, msg: e.message });
        }
        else {
            return res.status(500).json({ ok: false, msg: 'An unknown error occurred' });
        }
    }
}));
