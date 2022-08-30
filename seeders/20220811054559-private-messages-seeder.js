'use strict'
const faker = require('faker')
const { getNoRepeatRandomIndices } = require('../helpers/seeder-helpers')

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const users = await queryInterface.sequelize.query(
      'SELECT id FROM Users WHERE `role` <> "admin";',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    )

    await queryInterface.bulkInsert('PrivateMessages',
      users.reduce((acc, cur, index) => {
        return acc.concat(Array.from(
          getNoRepeatRandomIndices(users.length, null, index),
          (v, i) => ({
            receiver: cur.id,
            sender: users[v].id,
            message: faker.lorem.sentence(Math.ceil(Math.random() * 25 + 4)),
            isRead: false,
            createdAt: new Date(),
            updatedAt: new Date()
          })
        ))
      }, []), {}
    )
  },

  down: async (queryInterface, Sequelize) => {
    return await queryInterface.bulkDelete('PrivateMessages', null, {})
  }
}
