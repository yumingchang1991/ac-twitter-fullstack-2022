const dayjs = require('dayjs')
const { Op } = require('sequelize')
const { addUser, getUsers, removeUser } = require('../helpers/socketio-helpers')
const { Message, User } = require('../models')

function group (data, key) {
  const result = []
  data.forEach(value => {
    let index = result.findIndex(element => element[key] === value[key])

    if (index < 0) {
      index = result.push({
        createdAt: value[key],
        messages: []
      }) - 1
    }

    result[index].messages.push(value)
  })

  return result
}

function addSocketIdInData (data, socketId) {
  return { ...data, socketId }
}

function historyMessageFormat (message) {
  return {
    ...message,
    createdAt: dayjs(message.createdAt).format('YYYY-MM-DD'),
    time: dayjs(message.createdAt).format('a HH:mm')
  }
}

module.exports = io => {
  // notification
  io.of('/').on('connection', socket => {
    const userId = String(socket.request.user.id)
    socket.join(userId)

    Message.findOne({
      where: {
        receiverId: userId,
        isread: false
      }
    })
      .then(message => {
        if (message) {
          socket.emit('notify:private')
        }
      })

    socket.on('disconnect', () => {
      socket.leave(userId)
    })
  })

  // public chatroom
  io.of('/chatroom').on('connection', socket => {
    console.log('a user is connected')

    socket.on('user:connected', selfId => {
      Promise.all([
        User.findByPk(selfId, {
          raw: true,
          nest: true
        }),
        Message.findAll({
          include: [{ model: User, as: 'sender' }],
          where: { receiverId: null },
          raw: true,
          nest: true
        })
      ])
        .then(([user, messages]) => {
          user.socketId = socket.id
          socket.userdata = addUser(user)

          messages = messages.map(m => {
            if (m.sender.id === socket.userdata.id) {
              m = addSocketIdInData(m, socket.id)
            }
            return historyMessageFormat(m)
          })
          messages = group(messages, 'createdAt')

          socket.emit('history:public', JSON.stringify(messages))

          io.of('/chatroom').emit('user:updateList', JSON.stringify(getUsers()))
          socket.broadcast.emit('broadcast', `${user.name}上線`)
        })
    })

    socket.on('chat message', msg => {
      const time = dayjs(new Date()).format('a HH:mm')

      Message.create({
        description: msg,
        senderId: socket.userdata.id
      })

      socket.emit('chat message', JSON.stringify({ ...socket.userdata, msg, selfMsg: true, time }))
      socket.broadcast.emit('chat message', JSON.stringify({ ...socket.userdata, msg, time }))
    })

    socket.on('disconnect', () => {
      console.log('a user disconnect')
      const user = removeUser(socket.id)

      io.of('/chatroom').emit('user:updateList', JSON.stringify(getUsers()))
      socket.broadcast.emit('broadcast', `${user.name}離線`)
    })
  })

  // private chat
  io.of('/privateChat').on('connect', socket => {
    socket.on('user:connected', selfId => {
      Promise.all([
        // 本人資料
        User.findByPk(selfId, {
          raw: true,
          nest: true
        }),
        // user發送訊息的對象
        Message.findAll({
          attributes: [],
          include: [{ model: User, as: 'receiver' }],
          where: {
            [Op.and]: {
              senderId: selfId,
              receiverId: { [Op.not]: null }
            }
          },
          group: ['receiverId'],
          raw: true,
          nest: true
        }),
        // user為接收者的對象
        Message.findAll({
          attributes: [],
          include: [{ model: User, as: 'sender' }],
          where: { receiverId: selfId },
          group: ['senderId'],
          raw: true,
          nest: true
        })
      ])
        .then(([selfUser, receivers, senders]) => {
          socket.userdata = selfUser
          receivers = receivers.map(r => ({
            ...r.receiver
          }))
          senders = senders.map(s => ({
            ...s.sender
          }))
          // 合併receivers和senders，並移除重複
          const users = receivers.concat(senders)
            .filter((v, i, arr) => {
              return arr.findIndex(el => el.id === v.id) === i
            })
          socket.emit('user:updateList', JSON.stringify(users))
        })
    })

    socket.on('user:connected with other', data => {
      const { selfId, otherId } = JSON.parse(data)
      Promise.all([
        // 本人資料
        User.findByPk(selfId, {
          raw: true,
          nest: true
        }),
        // 聊天對象個人資料
        User.findByPk(otherId, {
          raw: true,
          nest: true
        }),
        // user發送訊息的對象
        Message.findAll({
          attributes: [],
          include: [{ model: User, as: 'receiver' }],
          where: {
            [Op.and]: {
              senderId: selfId,
              receiverId: { [Op.not]: null }
            }
          },
          group: ['receiverId'],
          raw: true,
          nest: true
        }),
        // user為接收者的對象
        Message.findAll({
          attributes: [],
          include: [{ model: User, as: 'sender' }],
          where: { receiverId: selfId },
          group: ['senderId'],
          raw: true,
          nest: true
        }),
        // 兩人聊天紀錄
        Message.findAll({
          where: {
            [Op.or]: [
              { [Op.and]: [{ senderId: selfId }, { receiverId: otherId }] },
              { [Op.and]: [{ senderId: otherId }, { receiverId: selfId }] }
            ]
          },
          order: [['createdAt', 'ASC']],
          raw: true,
          nest: true
        }),
        Message.update({ isread: true }, {
          where: { [Op.and]: [{ senderId: otherId }, { receiverId: selfId }] }
        }
        )
      ])
        .then(([selfUser, otherUser, receivers, senders, messages]) => {
          socket.userdata = selfUser
          receivers = receivers.map(r => ({
            ...r.receiver
          }))
          senders = senders.map(s => ({
            ...s.sender
          }))
          // 合併receivers和senders，並移除重複
          const users = receivers.concat(senders)
            .filter((v, i, arr) => {
              return arr.findIndex(el => el.id === v.id) === i
            })
          socket.emit('user:updateList', JSON.stringify(users))

          // 加入兩人房間
          socket.leave(socket.room)
          socket.receiverId = otherId
          const room = (socket.userdata.id < otherId) ? `${socket.userdata.id}-${otherId}` : `${otherId}-${socket.userdata.id}`
          socket.room = room
          socket.join(room)

          // 聊天紀錄資料處理
          messages = messages.map(message => {
            if (message.senderId === socket.userdata.id) {
              message = addSocketIdInData(message, socket.id)
            }
            return historyMessageFormat(message)
          })
          messages = group(messages, 'createdAt')

          socket.emit('history:private', JSON.stringify({ otherUser, messages }))
        })
    })

    socket.on('chat message', msg => {
      const time = dayjs(new Date()).format('a HH:mm')

      Message.create({
        description: msg,
        senderId: socket.userdata.id,
        receiverId: socket.receiverId
      })

      io.of('/privateChat').to(socket.room)
        .emit('chat message', JSON.stringify({ ...socket.userdata, msg, time, socketId: socket.id }))
      io.of('/').to(socket.receiverId).emit('notify:private')
    })

    socket.on('disconnected', () => {
      socket.leave(socket.room)
    })
  })
}
