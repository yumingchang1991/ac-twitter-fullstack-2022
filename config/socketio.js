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
  // public chatroom
  io.of('/chatroom').on('connection', socket => {
    console.log('a user is connected')

    socket.on('user connected', data => {
      const user = JSON.parse(data)
      user.socketId = socket.id
      socket.userdata = addUser(user)

      Message.findAll({
        include: [{ model: User, as: 'sender' }],
        where: { receiverId: null },
        raw: true,
        nest: true
      })
        .then(messages => {
          messages = messages.map(m => ({
            ...m,
            createdAt: dayjs(m.createdAt).format('YYYY-MM-DD'),
            time: dayjs(m.createdAt).format('a HH:mm'),
            selfMsg: m.sender.id === socket.userdata.id
          }))
          messages = group(messages, 'createdAt')

          socket.emit('history', JSON.stringify(messages))
        })

      io.of('/chatroom').emit('updateUserList', JSON.stringify(getUsers()))
      socket.broadcast.emit('broadcast', `${user.name}上線`)
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

      io.of('/chatroom').emit('updateUserList', JSON.stringify(getUsers()))
      socket.broadcast.emit('broadcast', `${user.name}離線`)
    })
  })

  // private chat
  io.of('/privateChat').on('connect', socket => {
    socket.on('user connected', data => {
      const user = JSON.parse(data)
      socket.userdata = user
      Promise.all([
        // user發送訊息的對象
        Message.findAll({
          attributes: [],
          include: [{ model: User, as: 'receiver' }],
          where: {
            [Op.and]: {
              senderId: user.id,
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
          where: { receiverId: user.id },
          group: ['senderId'],
          raw: true,
          nest: true
        })
      ])
        .then(([receivers, senders]) => {
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
          socket.emit('updateUserList', JSON.stringify(users))
        })
    })

    socket.on('join room', id => {
      socket.leave(socket.room)
      socket.receiverId = id
      const room = (socket.userdata.id < id) ? `${socket.userdata.id}-${id}` : `${id}-${socket.userdata.id}`
      socket.room = room
      socket.join(room)
    })

    socket.on('get messages', othersId => {
      const myId = socket.userdata.id
      Promise.all([
        User.findByPk(othersId, {
          raw: true,
          nest: true
        }),
        Message.findAll({
          where: {
            [Op.or]: [
              { [Op.and]: [{ senderId: myId }, { receiverId: othersId }] },
              { [Op.and]: [{ senderId: othersId }, { receiverId: myId }] }
            ]
          },
          order: [['createdAt', 'ASC']],
          raw: true,
          nest: true
        })
      ])
        .then(([otherUser, messages]) => {
          messages = messages.map(message => {
            if (message.senderId === socket.userdata.id) {
              message = addSocketIdInData(message, socket.id)
            }
            return historyMessageFormat(message)
          })
          messages = group(messages, 'createdAt')

          socket.emit('history', JSON.stringify({ otherUser, messages }))
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
      })
      socket.on('disconnected', () => {
        socket.leave(socket.room)
      })
    })
  })
}
