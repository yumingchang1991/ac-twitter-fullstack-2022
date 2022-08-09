function ensureAuthenticated (req) {
  return req.isAuthenticated()
}

function getUser (req) {
  return req.user
}

function getPathToRender (req) {
  if (req.path.startsWith('/users/chatroom')) return '/users/chatroom'
  if (req.path.startsWith('/users')) return '/users'
  return req.path
}

function socketioMiddleware (middleware) {
  return (socket, next) => middleware(socket.request, {}, next)
}

module.exports = {
  ensureAuthenticated,
  getUser,
  getPathToRender,
  socketioMiddleware
}
