const express = require('express')
const router = express.Router()
const passport = require('../../config/passport')

const admin = require('./modules/admin')
const tweets = require('./modules/tweets')
const users = require('./modules/users')

const adminController = require('../../controllers/pages/admin-controller')
const userController = require('../../controllers/pages/user-controller')
const chatController = require('../../controllers/pages/chat-controller')

const { authenticated, authenticatedAdmin } = require('../../middleware/auth')
const { generalErrorHandler } = require('../../middleware/error-handler')

// admin route
router.get('/admin/signin', adminController.getSignin)
router.post('/admin/signin', passport.authenticate('local', { failureRedirect: '/admin/signin', failureFlash: true }), adminController.postSignin)
router.use('/admin', authenticatedAdmin, admin)

// tweets route
router.use('/tweets', authenticated, tweets)

// user route
router.use('/users', authenticated, users)

// others
router.get('/signup', userController.signUpPage)
router.post('/signup', userController.signUp)
router.get('/signin', userController.getSignin)
router.post('/signin', passport.authenticate('local', { failureRedirect: '/signin', failureFlash: true }), userController.postSignin)
router.get('/logout', userController.logout)

router.get('/setting', authenticated, userController.getSetting)
router.put('/setting', authenticated, userController.editSetting)

router.post('/followships', authenticated, userController.addFollowship)
router.delete('/followships/:followingId', authenticated, userController.deleteFollowship)

router.post('/subscription/:followingId', authenticated, userController.addSubscription)
router.delete('/subscription/:followingId', authenticated, userController.deleteSubscription)

router.get('/chatroom', authenticated, chatController.publicChatRoom)
router.get('/privateChat', authenticated, chatController.privateChatRoom)
router.get('/privateChat/:chatterId', authenticated, chatController.privateChat)

// fallback route
router.use('/', (req, res) => res.redirect('/tweets'))
router.use('/', generalErrorHandler)

module.exports = router
