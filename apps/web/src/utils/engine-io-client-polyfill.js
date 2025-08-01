// Engine.IO Client polyfill
// Polyfill minimal pour engine.io-client

export const protocol = 4

export const transports = ['polling', 'websocket']

// Timer functions polyfill
export function installTimerFunctions(obj, opts) {
  if (opts.useNativeTimers) {
    obj.setTimeoutFn = setTimeout
    obj.clearTimeoutFn = clearTimeout
  } else {
    obj.setTimeoutFn = setTimeout
    obj.clearTimeoutFn = clearTimeout
  }
}

// Next tick polyfill
export function nextTick(fn) {
  if (typeof window !== 'undefined' && window.queueMicrotask) {
    window.queueMicrotask(fn)
  } else {
    setTimeout(fn, 0)
  }
}

// URL parse polyfill
export function parse(url) {
  if (!url || typeof url !== 'string') {
    return {
      protocol: 'http',
      hostname: '127.0.0.1',
      port: '3001',
      pathname: '/',
      search: '',
      query: '',
      hash: '',
    }
  }

  try {
    const parsed = new URL(url)
    return {
      protocol: parsed.protocol.replace(':', ''),
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? '443' : '80'),
      pathname: parsed.pathname,
      search: parsed.search,
      query: parsed.search.replace('?', ''),
      hash: parsed.hash,
    }
  } catch (_error) {
    return {
      protocol: 'http',
      hostname: '127.0.0.1',
      port: '3001',
      pathname: '/',
      search: '',
      query: '',
      hash: '',
    }
  }
}

export class Fetch {
  constructor(opts = {}) {
    this.opts = opts
  }

  request(opts = {}) {
    // Polyfill pour les requêtes Engine.IO
    return fetch(opts.uri || opts.url, {
      method: opts.method || 'GET',
      headers: opts.headers || {},
      body: opts.data,
    })
  }
}

export class NodeXHR {}

export class XHR {}

export class NodeWebSocket {}

export class WebSocket {
  constructor(url, protocols) {
    // Utiliser le WebSocket natif du navigateur
    return new globalThis.WebSocket(url, protocols)
  }
}

export class WebTransport {}

export class Socket {
  constructor(opts = {}) {
    this.opts = opts
    this.readyState = 'closed'
    this.transport = null
    this.id = null
    this.upgrades = []
    this.pingInterval = null
    this.pingTimeout = null
    this.pingIntervalTimer = null
    this.pingTimeoutTimer = null
  }

  open() {
    if (this.readyState === 'open') return this
    this.readyState = 'opening'

    // Simuler l'ouverture
    setTimeout(() => {
      this.readyState = 'open'
      this.emit('open')
    }, 100)

    return this
  }

  close() {
    if (this.readyState === 'closed') return this
    this.readyState = 'closing'

    setTimeout(() => {
      this.readyState = 'closed'
      this.emit('close')
    }, 100)

    return this
  }

  send(_data) {
    if (this.readyState !== 'open') return
  }

  emit(_event, ..._args) {}

  on(_event, _callback) {
    return this
  }

  off(_event, _callback) {
    return this
  }
}

export default {
  protocol,
  transports,
  Socket,
  Fetch,
  NodeXHR,
  XHR,
  NodeWebSocket,
  WebSocket,
  WebTransport,
  installTimerFunctions,
  nextTick,
  parse,
}
