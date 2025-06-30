// apps/api/test/setup.ts - Setup global pour tests TopSteel API
import { config } from 'dotenv';

// Charger les variables d'environnement de test
config({ path: '.env.test' });

// Configuration globale des tests
beforeAll(async () => {
  // Mock console pour éviter le spam en tests
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(async () => {
  // Restaurer console
  jest.restoreAllMocks();
});

// Configuration des timeouts pour les tests d'intégration
jest.setTimeout(30000);

// Variables d'environnement par défaut pour les tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-topsteel';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/topsteel_test';

// Mock global pour les modules externes si nécessaire
(global as any).mockData = {
  user: {
    id: 1,
    email: 'test@topsteel.fr',
    nom: 'Test',
    prenom: 'User',
    role: 'USER'
  },
  projet: {
    id: 1,
    nom: 'Projet Test',
    description: 'Description test',
    statut: 'EN_COURS'
  }
};