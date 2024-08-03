const { Sequelize, DataTypes } = require('sequelize')

const {sequelizeUsers} = require('../../configs/dbConfigs/db')

async function connection() {
    try {
        await sequelizeUsers.authenticate();
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}


const Users = sequelizeUsers.define('Users', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    unique: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  date_created: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'users', // Имя таблицы в базе данных
  timestamps: false // Отключение автоматических полей createdAt и updatedAt
});


connection()


module.exports = {Users};