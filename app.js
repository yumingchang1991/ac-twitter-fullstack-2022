if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}
const express = require('express')
const helpers = require('./_helpers')
const path = require('path')
const { engine } = require('express-handlebars')
const flash = require('connect-flash')
const methodOverride = require('method-override')
const passport = require('./config/passport')
const handlebarsHelpers = require('./helpers/handlebars-helpers')
const { pages, apis } = require('./routes')

const SESSION_SECRET = process.env.SESSION_SECRET || 'twitterSECRET'
const expressSession = require('express-session')({ secret: SESSION_SECRET, resave: false, saveUninitialized: false })

const app = express()
const PORT = process.env.PORT || 3000
const socketio = require('./config/socketio')

// use helpers.getUser(req) to replace req.user
// use helpers.ensureAuthenticated(req) to replace req.isAuthenticated()

require('./models/index')

app.engine('handlebars', engine({ defaultLayout: 'main', helpers: handlebarsHelpers }))
app.set('view engine', 'handlebars')

app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(expressSession)
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
  res.locals.path = helpers.getPathToRender(req)
  next()
})

app.use('/api', apis)
app.use(pages)

socketio(app, PORT, expressSession)

// app.listen(PORT, () => console.log(`Example app listening on port ${port}!`))

module.exports = app
