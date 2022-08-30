const privateMessageServices = require('../services/privateMessage-service')
const chatHelpers = require('../helpers/chat-message-helpers')

module.exports = async (req, res, next) => {
  const receiverId = Number(req.user.id)
  const privateUsersList = await privateMessageServices.getPrivateUsersList(receiverId)
  if (privateUsersList.length > 0) {
    await appendDisplayDataToRequest(req, privateUsersList)
  } else {
    appendNoDataToRequest(req)
  }
  next()
}

async function appendDisplayDataToRequest (req, privateUsersList) {
  // cook users list
  await chatHelpers.appendLatestMessageToUser(
    Number(req.user.id),
    privateUsersList
  )
  privateUsersList.sort(chatHelpers.sortMessageDateFromLatest)

  // get messages based on first user in users list
  const latestSenderId = privateUsersList[0].userId
  const privateMessages = await privateMessageServices.getPrivateMessages(
    latestSenderId,
    Number(req.user.id)
  )
  req.privateChatInitialization = {
    status: 'success',
    privateUsersList,
    historyMessages: privateMessages
  }
}

function appendNoDataToRequest (req) {
  req.privateChatInitialization = {
    status: 'no-chat-history',
    textToRender: '尚無聊天紀錄'
  }
}
