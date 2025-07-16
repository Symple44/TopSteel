const { WebSocketServer } = require('ws');

const wss = new WebSocketServer({ port: 3001 });

console.log('🔔 Serveur WebSocket démarré sur le port 3001');

wss.on('connection', function connection(ws, req) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const userId = url.searchParams.get('userId');
  
  console.log(`🔔 Client connecté: ${userId}`);

  ws.on('error', console.error);

  ws.on('message', function message(data) {
    console.log('🔔 Message reçu:', data.toString());
  });

  ws.on('close', function close() {
    console.log(`🔔 Client déconnecté: ${userId}`);
  });

  // Envoyer un message de bienvenue
  ws.send(JSON.stringify({
    id: 'welcome-' + Date.now(),
    type: 'info',
    category: 'system',
    title: 'Connexion WebSocket',
    message: 'Notifications temps réel activées',
    priority: 'NORMAL',
    createdAt: new Date().toISOString(),
    isRead: false,
    metadata: {
      category: 'system',
      source: 'websocket'
    }
  }));

  // Simuler des notifications périodiques pour les tests
  const interval = setInterval(() => {
    if (ws.readyState === ws.OPEN) {
      const testNotification = {
        id: 'test-' + Date.now(),
        type: 'info',
        category: 'system',
        title: 'Test notification',
        message: 'Ceci est une notification de test temps réel',
        priority: 'NORMAL',
        createdAt: new Date().toISOString(),
        isRead: false,
        metadata: {
          category: 'system',
          source: 'test'
        }
      };
      
      ws.send(JSON.stringify(testNotification));
    }
  }, 60000); // Toutes les minutes

  ws.on('close', () => {
    clearInterval(interval);
  });
});