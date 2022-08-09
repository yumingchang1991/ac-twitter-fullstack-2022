const chatHelpers = require('../../helpers/chat-message-helpers')

const chatController = {
  getAllMessages: (req, res, next) => {
    chatHelpers.getPublicMessages(res)
  }
}

module.exports = chatController
