// apps/api/src/config/app.config.ts - Configuration ports évolutive
export interface AppConfig {
  api: {
    port: number;
    fallbackPorts: number[];
    host: string;
  };
  web: {
    port: number;
    fallbackPorts: number[];
  };
  database: {
    maxRetries: number;
    retryDelay: number;
  };
}

export const appConfig: AppConfig = {
  api: {
    port: parseInt(process.env.API_PORT || '3001', 10),
    fallbackPorts: [3002, 3003, 3004, 3005],
    host: process.env.API_HOST || '0.0.0.0'
  },
  web: {
    port: parseInt(process.env.WEB_PORT || '3000', 10),
    fallbackPorts: [3006, 3007, 3008, 3009]
  },
  database: {
    maxRetries: 5,
    retryDelay: 2000
  }
};

export const getAvailablePort = async (preferredPort: number, fallbacks: number[]): Promise<number> => {
  const net = await import('net');
  
  const isPortFree = (port: number): Promise<boolean> => {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.listen(port, (err: any) => {
        if (err) {
          resolve(false);
        } else {
          server.close(() => resolve(true));
        }
      });
      server.on('error', () => resolve(false));
    });
  };

  if (await isPortFree(preferredPort)) {
    return preferredPort;
  }

  for (const port of fallbacks) {
    if (await isPortFree(port)) {
      console.warn(`⚠️ Port ${preferredPort} occupé, utilisation du port ${port}`);
      return port;
    }
  }

  throw new Error(`Aucun port disponible parmi: ${preferredPort}, ${fallbacks.join(', ')}`);
};
