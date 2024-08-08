const { Sequelize } = require('sequelize');
const config = require('./config');

const sequelizeProducts = new Sequelize(config.database1.database, config.database1.username, config.database1.password, {
    dialect: config.database1.dialect,
    host: config.database1.host,
});

const sequelizeUsers = new Sequelize(config.database2.database, config.database2.username, config.database2.password, {
    dialect: config.database2.dialect,
    host: config.database2.host,
});

module.exports = {
    sequelizeProducts,
    sequelizeUsers,
};