const helper = require('../../_helpers')

const chatController = {
  publicChatRoom: (req, res, next) => {
    const { id } = req.user
    res.render('chat', { id })
  },
  privateChatRoom: (req, res, next) => {
    const { id } = helper.getUser(req)
    res.render('chat', { id })
  },
  privateChat: (req, res, next) => {
    const { id } = helper.getUser(req)
    res.render('chat', { id })
  }
}

module.exports = chatController
