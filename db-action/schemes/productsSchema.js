const { Model, DataTypes } = require('sequelize')

const { Company } = require('./companySchema')
const { Users } = require('../../auth/schemas/userSchema')

const { sequelizeProducts } = require('../../configs/dbConfigs/db')

async function connection() {
    try {
        await sequelizeProducts.authenticate();
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

class UserProducts extends Model {}

UserProducts.init({
    // Define the foreign keys to reference the Users and Products models
    userId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Users', // 'Users' refers to the table name
            key: 'id'
        },
        allowNull: false
    },
    productId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Products', // 'Products' refers to the table name
            key: 'id'
        },
        allowNull: false
    }
    // You can add additional fields here if needed
    // role: DataTypes.STRING
}, {
    sequelize: sequelizeProducts,
    modelName: 'UserProducts',
    tableName: 'user_products', // Specify the table name if it's different from the model name
    timestamps: false // Set to true if you want Sequelize to manage createdAt and updatedAt fields
});

const Products = sequelizeProducts.define('Products', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        unique: true
    },
    price: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    date_created: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    company_name: {
        type: DataTypes.STRING,
        references: {
            model: Company,
            key: 'name'
        }
    },
    user_id: {
        type: DataTypes.INTEGER,
        references: {
            model: Users,
            key: "id"
        }
    }
}, {
    tableName: "products",
    timestamps: false
});

Users.hasMany(Products, {
    foreignKey: "user_id",
    sourceKey: "id"
});

Products.belongsToMany(Users, {
    through: UserProducts, // Specify the join table model here
    foreignKey: "product_id", // This should be the foreign key in the join table that references Products
    otherKey: "user_id" // This should be the foreign key in the join table that references Users
});

connection();


module.exports = { Products }