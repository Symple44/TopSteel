// Debug polyfill pour Socket.IO
function createDebug(namespace) {
  return function debug(..._args) {
    if (
      typeof window !== 'undefined' &&
      window.localStorage?.getItem('debug')?.includes(namespace)
    ) {
    }
  }
}

createDebug.enabled = (namespace) =>
  typeof window !== 'undefined' && window.localStorage?.getItem('debug')?.includes(namespace)

export default createDebug
