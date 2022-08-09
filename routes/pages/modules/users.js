const express = require('express')
const router = express.Router()

const userController = require('../../../controllers/pages/user-controller')
const chatController = require('../../../controllers/pages/chat-controller')

router.get('/chatroom/public', express.static('/socket.io'), chatController.getChatroomPublic)
router.get('/:userId/tweets', userController.getTweets)
router.get('/:userId/replies', userController.getReplies)
router.get('/:userId/likes', userController.getLikes)
router.get('/:userId/followings', userController.getFollowings)
router.get('/:userId/followers', userController.getFollowers)

module.exports = router
