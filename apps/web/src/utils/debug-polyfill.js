// Debug polyfill pour Socket.IO
function createDebug(namespace) {
  return function debug(...args) {
    if (typeof window !== 'undefined' && window.localStorage?.getItem('debug')?.includes(namespace)) {
      console.log(`[${namespace}]`, ...args)
    }
  }
}

createDebug.enabled = function(namespace) {
  return typeof window !== 'undefined' && 
         window.localStorage?.getItem('debug')?.includes(namespace)
}

export default createDebug