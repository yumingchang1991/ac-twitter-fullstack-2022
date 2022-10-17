const { User, Tweet, Followship, sequelize } = require('../models')

const isAdmin = user => user.role === 'admin'

const userInfoHelper = UserId => {
  return new Promise((resolve, reject) => {
    if (!UserId) return resolve(null)

    User.findByPk(UserId, {
      attributes: {
        include: [
          [sequelize.literal('(SELECT COUNT(`id`) FROM `Followships` WHERE `followerId` = `User`.`id`)'), 'followingCounts'],
          [sequelize.literal('(SELECT COUNT(`id`) FROM `Followships` WHERE `followingId` = `User`.`id`)'), 'followerCounts'],
          [sequelize.fn('COUNT', sequelize.col('Tweets.id')), 'tweetCounts']
        ]
      },
      include: [
        { model: Tweet, attributes: [] }
      ],
      raw: true,
      nest: true
    })
      .then(user => resolve(user))
      .catch(err => reject(err))
  })
}

const getSubscribingUsers = async userId => {
  return [...(await Followship.findAll({
    attributes: ['followerId'],
    where: {
      followingId: userId,
      subscription: true
    },
    raw: true,
    nest: true
  }))]
    .map(user => user.followerId)
}

module.exports = {
  isAdmin,
  userInfoHelper,
  getSubscribingUsers
}
