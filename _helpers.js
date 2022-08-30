function ensureAuthenticated (req) {
  return req.isAuthenticated()
}

function getUser (req) {
  return req.user
}

function getPathToRender (req) {
  if (req.path.startsWith('/users/chatroom/public')) return '/users/chatroom/public'
  if (req.path.startsWith('/users/chatroom/private')) return '/users/chatroom/private'
  if (req.path.startsWith('/users')) return '/users'
  return req.path
}

function getNotification (req) {
  return req.notification
}

function socketioMiddleware (middleware) {
  return (socket, next) => middleware(socket.request, {}, next)
}

module.exports = {
  ensureAuthenticated,
  getUser,
  getPathToRender,
  socketioMiddleware,
  getNotification
}
