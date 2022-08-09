if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}
const express = require('express')
const helpers = require('./_helpers')
const path = require('path')
const { engine } = require('express-handlebars')
const flash = require('connect-flash')
const methodOverride = require('method-override')
const session = require('express-session')
const http = require('http')
const { Server } = require('socket.io')

const passport = require('./config/passport')
const socketioConfig = require('./config/socketio')
const handlebarsHelpers = require('./helpers/handlebars-helpers')
const { pages, apis } = require('./routes')

const SESSION_SECRET = process.env.SESSION_SECRET || 'twitterSECRET'

const app = express()
const port = process.env.PORT || 3000
const server = http.createServer(app)
const io = new Server(server)

// use helpers.getUser(req) to replace req.user
// use helpers.ensureAuthenticated(req) to replace req.isAuthenticated()

require('./models/index')

app.engine('handlebars', engine({ defaultLayout: 'main', helpers: handlebarsHelpers }))
app.set('view engine', 'handlebars')

app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(session({ secret: SESSION_SECRET, resave: false, saveUninitialized: false }))
app.use(passport.initialize())
app.use(passport.session())
app.use(flash())
app.use(methodOverride('_method'))

app.use('/upload', express.static(path.join(__dirname, 'upload')))

app.use((req, res, next) => {
  res.locals.success_messages = req.flash('success_messages')
  res.locals.error_messages = req.flash('error_messages')
  res.locals.warning_messages = req.flash('warning_messages')
  res.locals.loginUser = helpers.getUser(req)
  res.locals.path = req.path.startsWith('/users') ? '/users' : req.path.startsWith('/chat') ? '/chat' : req.path
  next()
})

// const wrap = middleware => {
//   return (socket, next) =>
//     middleware(socket.request, {}, next)
// }
// io.use(wrap(session({ secret: SESSION_SECRET, resave: false, saveUninitialized: false })))
// io.use(wrap(passport.initialize()))
// io.use(wrap(passport.session()))
socketioConfig(io)

app.use('/api', apis)
app.use(pages)

server.listen(port, () => console.log(`Example app listening on port ${port}!`))

module.exports = app
