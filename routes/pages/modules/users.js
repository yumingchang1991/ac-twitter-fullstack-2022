const express = require('express')
const router = express.Router()

const privateChatInitialization = require('../../../middleware/privateChat-initialization')
const privateChatCookTargetUser = require('../../../middleware/privateChat-cookTargetUser')
const userController = require('../../../controllers/pages/user-controller')
const chatController = require('../../../controllers/pages/chat-controller')
const notification = require('../../../middleware/notification')

router.get('/chatroom/public', chatController.getChatroomPublic)
router.post('/chatroom/private', privateChatInitialization, privateChatCookTargetUser, chatController.getChatroomPrivate)
router.get('/chatroom/private', privateChatInitialization, notification.countUnreadPrivateChatIndividual, chatController.getChatroomPrivate)
router.get('/:userId/tweets', userController.getTweets)
router.get('/:userId/replies', userController.getReplies)
router.get('/:userId/likes', userController.getLikes)
router.get('/:userId/followings', userController.getFollowings)
router.get('/:userId/followers', userController.getFollowers)

module.exports = router
