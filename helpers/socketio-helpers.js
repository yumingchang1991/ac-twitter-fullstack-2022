const dayjs = require('dayjs')
const { Op, QueryTypes } = require('sequelize')
const { User, Message, Tweet, TweetNotification, sequelize } = require('../models')

// public chatroom
const publicChatroomUsers = []

const addUser = user => {
  if (publicChatroomUsers.some(u => u.account === user.account)) {
    return
  }
  publicChatroomUsers.push(user)
  return user
}

const removeUser = socketId => {
  const removeId = publicChatroomUsers.findIndex(user => user.socketId === socketId)
  const user = publicChatroomUsers[removeId]

  publicChatroomUsers.splice(removeId, 1)
  return user
}

const getUsers = () => {
  return publicChatroomUsers
}

// data
const group = (data, key) => {
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

const addSocketIdInData = (data, socketId) => {
  return { ...data, socketId }
}

const historyMessageFormat = message => {
  return {
    ...message,
    createdAt: dayjs(message.createdAt).format('YYYY-MM-DD'),
    time: dayjs(message.createdAt).format('a HH:mm')
  }
}

// database
const databaseHelpers = {
  getUser: userId => {
    return User.findByPk(userId, {
      raw: true,
      nest: true
    })
  },
  checkRead: userId => {
    return Message.findOne({
      where: {
        receiverId: userId,
        isread: false
      }
    })
  },
  updateRead: (selfId, otherId) => {
    return Message.update({
      isread: true
    }, {
      where: { [Op.and]: [{ senderId: otherId }, { receiverId: selfId }] }
    })
  },
  getprivateChatUserList: async selfId => {
    // user發送訊息的對象
    const receivers = await sequelize.query(`
      SELECT description, Message.createdAt, User.id, User.name, User.account, User.avatar 
      FROM Messages AS Message 
      INNER JOIN (SELECT Max(id) AS id, receiverId FROM Messages GROUP BY receiverId) AS m2 USING(id) 
      LEFT JOIN Users AS User ON User.id = Message.receiverId 
      WHERE (Message.senderId = ${selfId} AND Message.receiverId IS NOT NULL);
    `, { type: QueryTypes.SELECT })

    // user為接收者的對象
    const senders = await sequelize.query(`
      SELECT description, Message.createdAt, User.id, User.name, User.account, User.avatar 
      FROM Messages AS Message 
      INNER JOIN (SELECT Max(id) AS id, senderId FROM Messages GROUP BY senderId) AS m2 USING(id) 
      LEFT JOIN Users AS User ON User.id = Message.senderId 
      WHERE Message.receiverId = ${selfId};
    `, { type: QueryTypes.SELECT })

    // 合併receivers和senders，並移除重複
    const chatUsers = receivers.concat(senders)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .filter((v, i, arr) => {
        return arr.findIndex(el => el.id === v.id) === i
      })
      .map(user => {
        let time = ''
        if (new Date(user.createdAt) < new Date(dayjs().add(-1, 'M'))) {
          time = dayjs(user.createdAt).format('YYYY/MM/DD')
        } else {
          time = dayjs(user.createdAt).fromNow()
            .replace('ago', '')
            .replace(/[a-z\s]+/, m => {
              if (m === 'a few seconds ') return '幾秒'
              if (m === 'a minute ') return '1分'
              if (m === ' minutes ') return '分'
              if (m === 'an hour ') return '1小時'
              if (m === ' hours ') return '小時'
              if (m === 'a day ') return '1天'
              if (m === ' days ') return '天'
            })
        }
        return {
          ...user,
          description: user.description.length > 20 ? user.description.substring(0, 20) + '...' : user.description,
          time
        }
      })

    return chatUsers
  },
  getnotification: async selfId => {
    return await TweetNotification.findAll({
      include: [
        { model: Tweet, include: [User] }
      ],
      where: {
        UserId: selfId
      },
      order: [['id', 'desc']],
      raw: true,
      nest: true
    })
  },
  checkNotification: async UserId => {
    const newNotification = await TweetNotification.findOne({
      where: {
        UserId,
        isRead: false
      },
      raw: true,
      nest: true
    })

    return !!newNotification
  },
  readNotification: UserId => {
    TweetNotification.update(
      { isRead: true },
      { where: { UserId } }
    )
  }
}

module.exports = {
  addUser,
  getUsers,
  removeUser,
  group,
  addSocketIdInData,
  historyMessageFormat,
  databaseHelpers
}
