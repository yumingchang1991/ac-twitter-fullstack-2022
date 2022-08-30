const dayjs = require('dayjs')
const relativeTime = require('dayjs/plugin/relativeTime')
dayjs.extend(relativeTime)

module.exports = {
  relativeTimeFromNow: a => dayjs(a).fromNow(),
  ifCond: function (a, b, options) {
    return a === b ? options.fn(this) : options.inverse(this)
  },
  checkBanner: banner => banner || '/images/user-defaultBanner.png',
  checkAvatar: avatar => avatar || '/images/user-defaultAvatar.png',
  isAdmin: userRole => userRole === 'admin',
  numberformat: number => {
    if (number >= 1000) return `${Math.floor(number / 100) / 10}k`
    return number
  },
  isRestPath: path => {
    if (path.startsWith('/users/chatroom') || path === '/setting') return false
    return true
  },
  isTheSame: (a, b) => a === b,
  timeFormatForPrivateMessageUsersList (time) {
    if (dayjs().isSame(time, 'day')) {
      return dayjs(time).fromNow()
    }
    return dayjs(time).format('MM/D')
  }
}
