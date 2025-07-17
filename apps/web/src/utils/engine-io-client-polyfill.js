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
      hostname: 'localhost',
      port: '3001',
      pathname: '/',
      search: '',
      query: '',
      hash: ''
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
      hash: parsed.hash
    }
  } catch (error) {
    console.warn('URL parse error:', error)
    return {
      protocol: 'http',
      hostname: 'localhost',
      port: '3001',
      pathname: '/',
      search: '',
      query: '',
      hash: ''
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
      body: opts.data
    })
  }
}

export class NodeXHR {
  constructor() {
    // Polyfill pour Node.js XMLHttpRequest
  }
}

export class XHR {
  constructor() {
    // Polyfill pour XMLHttpRequest
  }
}

export class NodeWebSocket {
  constructor() {
    // Polyfill pour Node.js WebSocket
  }
}

export class WebSocket {
  constructor(url, protocols) {
    // Utiliser le WebSocket natif du navigateur
    return new globalThis.WebSocket(url, protocols)
  }
}

export class WebTransport {
  constructor() {
    // Polyfill pour WebTransport
  }
}

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

  send(data) {
    if (this.readyState !== 'open') return
    // Simuler l'envoi
    console.log('Engine.IO send:', data)
  }

  emit(event, ...args) {
    // Simuler l'émission d'événements
    console.log('Engine.IO emit:', event, args)
  }

  on(event, callback) {
    // Simuler l'écoute d'événements
    console.log('Engine.IO on:', event)
    return this
  }

  off(event, callback) {
    // Simuler le retrait d'événements
    console.log('Engine.IO off:', event)
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
  parse
}