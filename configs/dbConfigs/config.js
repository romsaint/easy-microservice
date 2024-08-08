module.exports = {
    database1: {
        database: process.env.SECRET_DBNAME_POSTGRE_DB,
        username: 'postgres',
        password: process.env.SECRET_PASSWORD_POSTGRE,
        dialect: 'postgres',
        host: 'localhost',
    },
    database2: {
        database: process.env.SECRET_DBNAME_POSTGRE_USERS,
        username: 'postgres',
        password: process.env.SECRET_PASSWORD_POSTGRE,
        dialect: 'postgres',
        host: 'localhost',
    },
};