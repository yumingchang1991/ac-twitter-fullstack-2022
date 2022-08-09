const { PublicMessage, User } = require('../models')

const chatHelpers = {
  savePublicMessage (UserId, message) {
    return PublicMessage
      .create({
        UserId,
        message
      })
      .catch(err => {
        throw new Error(err)
      })
  },
  getPublicMessages (res) {
    PublicMessage
      .find({
        raw: true,
        nest: true,
        include: User
      })
      .then(messages => {
        res.json({ messages })
      })
      .catch(err => {
        throw new Error(err)
      })
  }
}

module.exports = chatHelpers
