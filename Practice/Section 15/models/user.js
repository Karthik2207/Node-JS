const Sequelize = require('sequelize');

const sequelize = require('../util/database');

const User = sequelize.define('user', {  
  email: {
    type: Sequelize.STRING,    
    allowNull: false,
    primaryKey: true
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false
  }
});

module.exports = User;

// id: {
  //   type: Sequelize.INTEGER,
  //   autoIncrement: true,
  //   allowNull: false,
  //   primaryKey: true
  // },
  //name: Sequelize.STRING,