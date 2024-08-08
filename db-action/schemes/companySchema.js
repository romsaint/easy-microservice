const { Sequelize, DataTypes } = require('sequelize')

const sequelize = new Sequelize(process.env.SECRET_DBNAME_POSTGRE_DB, 'postgres', process.env.SECRET_PASSWORD_POSTGRE, {
    dialect: "postgres",
    host: 'localhost',
})
async function connection() {
    try {
        await sequelize.authenticate();
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}


const Company = sequelize.define('Company', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    company_turnover: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'company', // Имя таблицы в базе данных
    timestamps: false // Отключение автоматических полей createdAt и updatedAt
})

connection();


module.exports = {Company}