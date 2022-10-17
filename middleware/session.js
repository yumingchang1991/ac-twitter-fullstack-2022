const session = require('express-session')

const SESSION_SECRET = process.env.SESSION_SECRET || 'twitterSECRET'
const sessionMiddleware = session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false
})

module.exports = sessionMiddleware
