// apps/api/src/config/https.config.ts
// Configuration HTTPS pour TopSteel ERP en production

import { readFileSync } from 'fs';
import { join } from 'path';

export interface HttpsOptions {
  key: Buffer;
  cert: Buffer;
  ca?: Buffer;
}

export function getHttpsOptions(): HttpsOptions | null {
  if (process.env.NODE_ENV !== 'production') {
    return null;
  }

  try {
    const certPath = process.env.SSL_CERT_PATH ?? '/etc/ssl/certs/topsteel';
    
    return {
      key: readFileSync(join(certPath, 'private.key')),
      cert: readFileSync(join(certPath, 'certificate.crt')),
      ca: process.env.SSL_CA_PATH ? readFileSync(process.env.SSL_CA_PATH) : undefined,
    };
  } catch (_error) {
    console.warn('⚠️  Certificats SSL non trouvés, utilisation HTTP:', (_error as Error).message);
    return null;
  }
}

// Configuration SSL/TLS recommandée pour TopSteel ERP
export const TLS_CONFIG = {
  // Protocoles autorisés (TLS 1.2+ uniquement)
  secureProtocol: 'TLSv1_2_method',
  
  // Ciphers sécurisés pour un ERP
  ciphers: [
    'TLS_AES_256_GCM_SHA384',
    'TLS_CHACHA20_POLY1305_SHA256',
    'TLS_AES_128_GCM_SHA256',
    'ECDHE-RSA-AES128-GCM-SHA256',
    'ECDHE-RSA-AES256-GCM-SHA384',
  ].join(':'),
  
  // Options de sécurité
  honorCipherOrder: true,
  secureOptions: require('constants').SSL_OP_NO_SSLv2 | 
                  require('constants').SSL_OP_NO_SSLv3 |
                  require('constants').SSL_OP_NO_TLSv1 |
                  require('constants').SSL_OP_NO_TLSv1_1,
};
