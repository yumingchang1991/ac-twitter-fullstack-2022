const { createServer } = require('http')
const { Server } = require('socket.io')
const passport = require('passport')
const { socketioMiddleware } = require('../_helpers')
const privateMessageServices = require('../services/privateMessage-service')
const privateChatInitialization = require('../middleware/privateChat-initialization')
const privateChatCookTargetUser = require('../middleware/privateChat-cookTargetUser')
const chatHelpers = require('../helpers/chat-message-helpers')
const TEXT = {
  MYSTERIOUS_USER: 'mysterious user'
}
const connectedUsers = []

module.exports = (app, PORT, expressSession) => {
  const httpServer = createServer(app)
  const io = new Server(httpServer)

  io.use(socketioMiddleware(expressSession))
    .use(socketioMiddleware(passport.initialize()))
    .use(socketioMiddleware(passport.session()))

  io.on('connection', async socket => {
    addConnectedUsers(socket, connectedUsers)

    io.emit('user-join-chat', {
      name: socket.request.user?.name || TEXT.MYSTERIOUS_USER,
      usersCount: io.engine.clientsCount,
      connectedUsers
    })

    socket.on('send-chat', message => {
      chatHelpers.savePublicMessage(socket.request.user.id, message)
      io.emit('render-chat', {
        socketId: socket.id,
        message,
        name: socket.request.user?.name || TEXT.MYSTERIOUS_USER,
        avatar: socket.request.user?.avatar
      })
    })

    socket.on('disconnecting', () => {
      removeConnectedUsers(socket, connectedUsers)
      io.emit('user-leave-chat', {
        name: socket.request.user?.name || TEXT.MYSTERIOUS_USER,
        usersCount: io.engine.clientsCount,
        leavingId: socket.request.user?.id,
        connectedUsers
      })
    })
  })

  const notification = io.of('/notification')

  notification
    .use(socketioMiddleware(expressSession))
    .use(socketioMiddleware(passport.initialize()))
    .use(socketioMiddleware(passport.session()))

  notification.on('connection', socket => {
    const { id } = socket.request.user
    socket.join(id)
  })

  const privateChat = io.of('/private-chatroom')

  privateChat
    .use(socketioMiddleware(expressSession))
    .use(socketioMiddleware(passport.initialize()))
    .use(socketioMiddleware(passport.session()))
    .use(socketioMiddleware(privateChatInitialization))
    .use(socketioMiddleware(privateChatCookTargetUser))

  privateChat.on('connection', socket => {
    let room = ''
    if (socket.request.privateChatInitialization.status === 'no-chat-history') {
      privateChat.emit('no-chat-history', {})
      socket.on('no-chat-history-frontend', data => {
        socket.request.privateChatInitialization.privateUsersList = [
          {
            userId: Number(data.receiver)
          }
        ]
        room = chatHelpers.generateRoomName(
          Number(data.receiver),
          Number(socket.request.user.id)
        )
        socket.join(room)
      })
    } else {
      room = chatHelpers.generateRoomName(
        Number(socket.request.privateChatInitialization.privateUsersList[0].userId),
        Number(socket.request.user.id)
      )
      socket.join(room)
    }

    socket.on('send-chat', async data => {
      const receiverId = Number(data.receiver)
      const senderId = Number(socket.request.user.id)

      const newMessage = await privateMessageServices.addMessage(
        receiverId,
        senderId,
        data.message
      )

      privateChat.to(room).emit('render-chat', {
        ...newMessage,
        sender: senderId,
        avatar: socket.request.user.avatar
      })

      notification.to(receiverId).emit('new-private-messages', { senderId })
    })

    socket.on('read-private-messages', async data => {
      const { senderId } = data
      const receiverId = socket.request.user.id
      const countUnreadPrivateMessages = await privateMessageServices.setMessagesRead(senderId, receiverId)
      notification
        .to(receiverId)
        .to(senderId)
        .emit('private-messages-read', {
          countUnreadPrivateMessages,
          senderId
        })
    })

    socket.on('disconnecting', () => {
      socket.leave('roomname')
    })
  })

  httpServer.listen(PORT, () => console.log(`http server is listening on port${PORT}`))
}

function addConnectedUsers (socket, connectedUsers) {
  const socketId = socket.id
  const sessionId = socket.request.sessionID
  const userObj = socket.request.user
  if (userObj) {
    const result = {
      sessionId,
      socketId,
      userId: userObj.id,
      account: userObj.account,
      name: userObj.name,
      avatar: userObj.avatar
    }
    if (!connectedUsers.some(user => user.id === result.userId)) {
      return connectedUsers.push(result)
    }
    for (const user of connectedUsers) {
      if (user.id === result.userId) {
        user.socketId = result.socketId
        user.sessionId = result.sessionId
        break
      }
    }
  }
}

function removeConnectedUsers (socket, connectedUsers) {
  let currentIndex = 0
  for (const user of connectedUsers) {
    if (user.socketId === socket.id) {
      connectedUsers.splice(currentIndex, 1)
    }
    currentIndex++
  }
}
