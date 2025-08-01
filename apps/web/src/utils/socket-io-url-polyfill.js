// Socket.IO URL polyfill
// Polyfill pour gérer les URL dans Socket.IO

export function url(uri, path, _loc) {
  let obj = uri

  // Convertir string en objet URL
  if (typeof uri === 'string') {
    try {
      const parsed = new URL(uri)
      obj = {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port,
        pathname: parsed.pathname,
        search: parsed.search,
        hash: parsed.hash,
        host: parsed.host,
        origin: parsed.origin,
      }
    } catch (_error) {
      // Utiliser les variables d'environnement pour les valeurs par défaut
      const defaultApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3002'
      const defaultUrl = new URL(defaultApiUrl)

      obj = {
        protocol: defaultUrl.protocol,
        hostname: defaultUrl.hostname,
        port: defaultUrl.port || (defaultUrl.protocol === 'https:' ? '443' : '3002'),
        pathname: '/',
        search: '',
        hash: '',
        host: defaultUrl.host,
        origin: defaultUrl.origin,
      }
    }
  }

  // Ajouter le path si fourni
  if (path) {
    obj.pathname = path
  }

  // Construire l'URL finale
  const protocol = obj.protocol || 'http:'
  const hostname = obj.hostname || '127.0.0.1'
  const port = obj.port || (protocol === 'https:' ? '443' : '80')
  const pathname = obj.pathname || '/'
  const search = obj.search || ''
  const hash = obj.hash || ''

  const finalUrl = `${protocol}//${hostname}:${port}${pathname}${search}${hash}`

  return {
    ...obj,
    href: finalUrl,
    toString: () => finalUrl,
  }
}

// Fonction pour parser les paramètres d'URL
export function parseqs(qs) {
  if (!qs || typeof qs !== 'string') return {}

  const params = {}
  const pairs = qs.replace(/^\?/, '').split('&')

  for (const pair of pairs) {
    const [key, value] = pair.split('=')
    if (key) {
      params[decodeURIComponent(key)] = decodeURIComponent(value || '')
    }
  }

  return params
}

// Fonction pour stringify les paramètres
export function stringifyqs(obj) {
  if (!obj || typeof obj !== 'object') return ''

  const pairs = []
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    }
  }

  return pairs.length ? `?${pairs.join('&')}` : ''
}

export default {
  url,
  parseqs,
  stringifyqs,
}
