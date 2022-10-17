const dayjs = require('dayjs')
const { Op } = require('sequelize')
const passport = require('passport')
const { addUser, getUsers, removeUser, group, addSocketIdInData, historyMessageFormat, databaseHelpers } = require('../helpers/socketio-helpers')
const { getSubscribingUsers } = require('../helpers/user-helpers')
const { Message, User } = require('../models')
const sessionMiddleware = require('../middleware/session')

module.exports = io => {
  // middleware
  const wrap = middleware => (socket, next) => middleware(socket.request, {}, next)

  // Namespaces
  const mainSocket = io.of('/')
  const notiSocket = io.of('/notification')
  const publicSocket = io.of('/chatroom')
  const privateSocket = io.of('/privateChat')

  // use passport
  mainSocket.use(wrap(sessionMiddleware))
  mainSocket.use(wrap(passport.initialize()))
  mainSocket.use(wrap(passport.session()))
  mainSocket.use((socket, next) => {
    if (socket.request.user) {
      next()
    } else {
      next(new Error('unauthorized'))
    }
  })
  notiSocket.use(wrap(sessionMiddleware))
  notiSocket.use(wrap(passport.initialize()))
  notiSocket.use(wrap(passport.session()))
  notiSocket.use((socket, next) => {
    if (socket.request.user) {
      next()
    } else {
      next(new Error('unauthorized'))
    }
  })
  publicSocket.use(wrap(sessionMiddleware))
  publicSocket.use(wrap(passport.initialize()))
  publicSocket.use(wrap(passport.session()))
  publicSocket.use((socket, next) => {
    if (socket.request.user) {
      next()
    } else {
      next(new Error('unauthorized'))
    }
  })
  privateSocket.use(wrap(sessionMiddleware))
  privateSocket.use(wrap(passport.initialize()))
  privateSocket.use(wrap(passport.session()))
  privateSocket.use((socket, next) => {
    if (socket.request.user) {
      next()
    } else {
      next(new Error('unauthorized'))
    }
  })

  // notification
  mainSocket.on('connection', socket => {
    const userId = String(socket.request.user.id)
    socket.join(userId)

    socket.on('message:checkRead', async () => {
      const message = await databaseHelpers.checkRead(userId)

      if (message) {
        socket.emit('notify:private')
      } else {
        socket.emit('notify:noneprivate')
      }
    })

    socket.on('notify:checkRead', async () => {
      if (await databaseHelpers.checkNotification(socket.request.user.id)) {
        socket.emit('notify:noti')
      }
    })

    socket.on('submit:add-tweet', async () => {
      // 找出有訂閱的追隨者 id 列表
      const subscribingUserIds = await getSubscribingUsers(socket.request.user.id)

      // 發送即時通知
      subscribingUserIds.forEach(id => {
        mainSocket.to(String(id)).emit('notify:noti')
      })
    })

    socket.on('disconnect', () => {
      socket.leave(userId)
    })
  })

  notiSocket.on('connection', async socket => {
    const notifications = await databaseHelpers.getnotification(socket.request.user.id)
    socket.emit('noti', JSON.stringify(notifications))

    // 更新為已讀
    databaseHelpers.readNotification(socket.request.user.id)
  })

  // public chatroom
  publicSocket.on('connection', socket => {
    console.log('a user is connected')

    socket.on('user:connected', async selfId => {
      const user = await databaseHelpers.getUser(selfId)

      user.socketId = socket.id
      socket.userdata = addUser(user)

      let messages = await Message.findAll({
        include: [{ model: User, as: 'sender' }],
        where: { receiverId: null },
        raw: true,
        nest: true
      })
      messages = messages.map(m => {
        if (m.sender.id === socket.userdata.id) {
          m = addSocketIdInData(m, socket.id)
        }
        return historyMessageFormat(m)
      })

      socket.emit('history:public', JSON.stringify(group(messages, 'createdAt')))

      publicSocket.emit('user:updateList', JSON.stringify(getUsers()))
      socket.broadcast.emit('broadcast', `${user.name}上線`)
    })

    socket.on('chat message', msg => {
      const time = dayjs(new Date()).format('a HH:mm')

      Message.create({
        description: msg,
        senderId: socket.userdata.id
      })

      publicSocket.emit('chat message', JSON.stringify({ ...socket.userdata, msg, time }))
    })

    socket.on('disconnect', () => {
      console.log('a user disconnect')
      const user = removeUser(socket.id)

      publicSocket.emit('user:updateList', JSON.stringify(getUsers()))
      socket.broadcast.emit('broadcast', `${user.name}離線`)
    })
  })

  // private chat
  privateSocket.on('connect', socket => {
    socket.on('user:connected', async selfId => {
      const selfUser = await databaseHelpers.getUser(selfId)
      const privateChatList = await databaseHelpers.getprivateChatUserList(selfId)

      socket.userdata = selfUser

      socket.emit('user:updateList', JSON.stringify(privateChatList))
    })

    socket.on('user:connected with other', async data => {
      const { selfId, otherId } = JSON.parse(data)
      socket.userdata = await databaseHelpers.getUser(selfId)
      const otherUser = await databaseHelpers.getUser(otherId)
      const privateChatUserList = await databaseHelpers.getprivateChatUserList(selfId)

      if (!privateChatUserList.some(el => el.id === otherUser.id)) {
        privateChatUserList.push(otherUser)
      }

      // 兩人聊天紀錄
      let messages = await Message.findAll({
        where: {
          [Op.or]: [
            { [Op.and]: [{ senderId: selfId }, { receiverId: otherId }] },
            { [Op.and]: [{ senderId: otherId }, { receiverId: selfId }] }
          ]
        },
        order: [['createdAt', 'ASC']],
        raw: true,
        nest: true
      })
      // 聊天紀錄資料處理
      messages = messages.map(message => {
        if (message.senderId === socket.userdata.id) {
          message = addSocketIdInData(message, socket.id)
        }
        return historyMessageFormat(message)
      })
      messages = group(messages, 'createdAt')

      // 加入兩人房間
      socket.leave(socket.room)
      socket.receiverId = otherId
      const room = (socket.userdata.id < otherId) ? `${socket.userdata.id}-${otherId}` : `${otherId}-${socket.userdata.id}`
      socket.room = room
      socket.join(room)

      socket.emit('user:updateList', JSON.stringify(privateChatUserList))
      socket.emit('history:private', JSON.stringify({ otherUser, messages }))
    })

    socket.on('message:read', async data => {
      const { selfId, otherId } = JSON.parse(data)
      await databaseHelpers.updateRead(selfId, otherId)
      const message = await databaseHelpers.checkRead(selfId)
      if (message) {
        mainSocket.to(selfId).emit('notify:private')
      } else {
        mainSocket.to(selfId).emit('notify:noneprivate')
      }
    })

    socket.on('chat message', msg => {
      const time = dayjs(new Date()).format('a HH:mm')

      Message.create({
        description: msg,
        senderId: socket.userdata.id,
        receiverId: socket.receiverId
      })

      privateSocket.to(socket.room)
        .emit('chat message', JSON.stringify({ ...socket.userdata, msg, time, socketId: socket.id }))
      mainSocket.to(socket.receiverId).emit('notify:private')
    })

    socket.on('disconnected', () => {
      socket.leave(socket.room)
    })
  })
}
