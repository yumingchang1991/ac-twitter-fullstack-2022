const { Tweet, User, Reply, Like } = require('../../models')
const helpers = require('../../_helpers')

const tweetController = {
  getTweets: (req, res, next) => {
    return Tweet.findAll({
      include: [User, Reply, Like],
      order: [['createdAt', 'DESC']]
    })
      .then(tweets => {
        const tweetData = tweets.map(t => ({
          ...t.toJSON(),
          replyCounts: t.Replies.length,
          likeCounts: t.Likes.length,
          isLiked: req.user?.Likes.some(l => l.TweetId === t.id)
        }))
        res.render('tweets', { tweetData })
      })
      .catch(err => next(err))
  },
  addTweet: (req, res, next) => {
    const UserId = helpers.getUser(req).id
    const { description } = req.body
    if (!description.trim()) {
      req.flash('error_messages', '推文不可空白')
      return res.redirect('/tweets')
    }
    if (description.length > 140) {
      req.flash('error_messages', '推文不可超過140字')
      return res.redirect('/tweets')
    }
    return Tweet.create({
      UserId,
      description
    })
      .then(() => {
        req.flash('success_messages', '成功發布推文')
        res.redirect('/tweets')
      })
      .catch(err => next(err))
  },
  addLike: (req, res, next) => {
    const UserId = helpers.getUser(req).id
    const TweetId = req.params.tweetId
    return Promise.all([
      Tweet.findByPk(TweetId),
      Like.findOne({
        where: {
          UserId,
          TweetId
        }
      })
    ])
      .then(([tweet, like]) => {
        if (!tweet) throw new Error('推文不存在')
        if (like) throw new Error('你已經按過愛心了')

        return Like.create({
          UserId,
          TweetId
        })
      })
      .then(() => res.redirect('back'))
      .catch(err => next(err))
  },
  deleteLike: (req, res, next) => {
    const UserId = helpers.getUser(req).id
    const TweetId = req.params.tweetId
    return Like.findOne({
      where: {
        UserId,
        TweetId
      }
    })
      .then(like => {
        if (!like) throw new Error('你還未按愛心')

        return like.destroy()
      })
      .then(() => res.redirect('back'))
      .catch(err => next(err))
  }
}

module.exports = tweetController
