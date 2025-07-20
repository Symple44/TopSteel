// Mock pour Sharp côté client
export default function sharp() {
  return {
    resize: () => sharp(),
    jpeg: () => sharp(),
    png: () => sharp(),
    webp: () => sharp(),
    toBuffer: () => Promise.resolve(Buffer.from('')),
    toFile: () => Promise.resolve(),
    metadata: () => Promise.resolve({}),
  }
}

export const format = {}
export const fit = {}
export const kernel = {}
export const strategy = {}