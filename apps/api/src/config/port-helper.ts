// apps/api/src/config/port-helper.ts - Helper gestion ports intelligente
import { createServer } from 'net';

export interface PortConfig {
  preferred: number;
  fallbacks: number[];
  host: string;
}

export const defaultPortConfig: PortConfig = {
  preferred: 3001,
  fallbacks: [3002, 3003, 3004, 3005],
  host: '0.0.0.0'
};

/**
 * Trouve un port disponible de manière intelligente
 */
export async function findAvailablePort(config: PortConfig = defaultPortConfig): Promise<number> {
  const isPortFree = (port: number): Promise<boolean> => {
    return new Promise((resolve) => {
      const server = createServer();
      
      server.listen(port, config.host, () => {
        server.close(() => resolve(true));
      });
      
      server.on('error', () => resolve(false));
    });
  };

  // Test port préféré
  if (await isPortFree(config.preferred)) {
    return config.preferred;
  }

  console.warn(`⚠️ Port ${config.preferred} occupé, recherche alternative...`);

  // Test ports de fallback
  for (const port of config.fallbacks) {
    if (await isPortFree(port)) {
      console.warn(`✅ Port ${port} disponible, utilisation en cours`);
      return port;
    }
  }

  throw new Error(`❌ Aucun port disponible parmi: ${config.preferred}, ${config.fallbacks.join(', ')}`);
}

/**
 * Wrapper pour app.listen avec gestion ports intelligente
 */
export async function listenWithPortFallback(
  app: any, 
  configService: any, 
  logger: any
): Promise<number> {
  const preferredPort = configService.get<number>("app.port", 3001);
  const host = configService.get<string>("app.host", "0.0.0.0");
  
  const portConfig: PortConfig = {
    preferred: preferredPort,
    fallbacks: [3002, 3003, 3004, 3005],
    host: host
  };

  try {
    const availablePort = await findAvailablePort(portConfig);
    
    await app.listen(availablePort, host);
    
    if (availablePort !== preferredPort) {
      logger.warn(`⚠️ Port ${preferredPort} indisponible, utilisation du port ${availablePort}`);
    }
    
    return availablePort;
  } catch (error) {
    logger.error('❌ Erreur lors du démarrage du serveur:', error.message);
    throw error;
  }
}
