const path = window.location.pathname

if (path === '/signup' || path === '/setting') {
  addScript('/signup')
} else if (path.slice(0, 6) === '/users') {
  addScript('/users')
}

// 除註冊、登入頁及後台外，其他皆須通知
if (!['/signup', '/signin'].includes(path) && path.slice(0, 6) !== '/admin') {
  addScript('/socketio')
}

function addScript (route) {
  const BODY = document.getElementsByTagName('body')[0]
  const script = document.createElement('script')
  script.src = `/javascripts${route}.js`
  BODY.appendChild(script)
}
