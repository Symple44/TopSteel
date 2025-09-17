// Debug polyfill pour Socket.IO
function createDebug(namespace) {
  return function debug(..._args) {
    if (window?.localStorage?.getItem('debug')?.includes(namespace)) {
    }
  }
}

createDebug.enabled = (namespace) => window?.localStorage?.getItem('debug')?.includes(namespace)

export default createDebug
