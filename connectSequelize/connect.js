const {Sequelize, DataTypes} = require('sequelize')


const sequelize = new Sequelize(process.env.SECRET_DBNAME_POSTGRE_DB, 'postgres', process.env.SECRET_PASSWORD_POSTGRE, {
    dialect: "postgres",
    host: 'localhost',
});

async function syncModels() {
    try {
        await sequelize.sync({ force: false }); // force: false означает, что существующие таблицы не будут удалены
        console.log('Models synchronized successfully.');
    } catch (error) {
        console.error('Unable to synchronize models:', error);
    }
}

syncModels();