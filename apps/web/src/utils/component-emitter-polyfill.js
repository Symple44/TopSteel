// Component Emitter polyfill pour Socket.IO
// Polyfill minimal pour @socket.io/component-emitter

export class Emitter {
  constructor() {
    this.callbacks = {}
  }

  on(event, fn) {
    this.callbacks[event] = this.callbacks[event] || []
    this.callbacks[event].push(fn)
    return this
  }

  once(event, fn) {
    const wrapper = (...args) => {
      this.off(event, wrapper)
      fn.apply(this, args)
    }
    wrapper.fn = fn
    this.on(event, wrapper)
    return this
  }

  off(event, fn) {
    if (!this.callbacks[event]) return this

    if (!fn) {
      delete this.callbacks[event]
      return this
    }

    const callbacks = this.callbacks[event]
    let cb
    let i = 0
    while (i < callbacks.length) {
      cb = callbacks[i]
      if (cb === fn || cb.fn === fn) {
        callbacks.splice(i, 1)
        break
      } else {
        i++
      }
    }
    return this
  }

  emit(event, ...args) {
    const callbacks = this.callbacks[event]
    if (callbacks) {
      callbacks.forEach((fn) => fn.apply(this, args))
    }
    return this
  }

  listeners(event) {
    return this.callbacks[event] || []
  }

  hasListeners(event) {
    return !!this.listeners(event).length
  }
}

export default Emitter
