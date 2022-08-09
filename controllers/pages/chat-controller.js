// const { User } = require('../../models')

const chatController = {
  publicChatRoom: (req, res, next) => {
    const { id } = req.user
    res.render('chat', { id })
  }
}

module.exports = chatController
