'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class PublicMessage extends Model {
    static associate (models) {
      PublicMessage.belongsTo(models.User, { foreignKey: 'UserId' })
    }
  }
  PublicMessage.init({
    message: DataTypes.STRING,
    UserId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'PublicMessage',
    tableName: 'PublicMessages'
  })
  return PublicMessage
}
