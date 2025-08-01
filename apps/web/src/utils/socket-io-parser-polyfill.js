// Socket.IO Parser polyfill
// Polyfill minimal pour l'export protocol de socket.io-parser

export const protocol = 5

export const PacketType = {
  CONNECT: 0,
  DISCONNECT: 1,
  EVENT: 2,
  ACK: 3,
  CONNECT_ERROR: 4,
  BINARY_EVENT: 5,
  BINARY_ACK: 6,
}

export class Encoder {
  encode(obj) {
    return [JSON.stringify(obj)]
  }
}

export class Decoder {
  constructor() {
    this.reconstructor = null
  }

  add(obj) {
    let packet
    if (typeof obj === 'string') {
      packet = JSON.parse(obj)
    } else {
      packet = obj
    }
    return packet
  }

  destroy() {
    if (this.reconstructor) {
      this.reconstructor.finishedReconstruction()
    }
  }
}

export default {
  protocol,
  PacketType,
  Encoder,
  Decoder,
}
