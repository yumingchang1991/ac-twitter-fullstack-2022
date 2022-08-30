const chatHelpers = require('../../helpers/chat-message-helpers')
const privateMessageService = require('../../services/privateMessage-service')

const chatController = {
  getAllMessages: (req, res, next) => {
    chatHelpers.getPublicMessages(res)
  },
  getPrivateMessages: async (req, res, next) => {
    const receiverId = Number(req.user.id)
    const senderId = Number(req.params.senderId)
    const result = await privateMessageService.getPrivateMessages(senderId, receiverId)
    res.json(result)
  }
}

module.exports = chatController
