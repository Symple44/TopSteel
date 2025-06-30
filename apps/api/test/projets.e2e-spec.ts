// apps/api/test/projets.e2e-spec.ts
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('ProjetsController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let clientId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Créer un utilisateur et se connecter
    const authResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'projets.test@example.com',
        password: 'Password123!',
        nom: 'Test',
        prenom: 'Projets',
        role: 'ADMIN',
      });

    accessToken = authResponse.body.accessToken;

    // Créer un client de test
    const clientResponse = await request(app.getHttpServer())
      .post('/api/clients')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        nom: 'Client Test',
        type: 'PROFESSIONNEL',
        email: 'client@test.com',
        telephone: '0123456789',
        adresse: {
          rue: '123 rue Test',
          codePostal: '75000',
          ville: 'Paris',
        },
      });

    clientId = clientResponse.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/projets (POST)', () => {
    it('should create a new projet', async () => {
      const createProjetDto = {
        clientId,
        description: 'Projet de test - Garde-corps',
        type: 'GARDE_CORPS',
        priorite: 'NORMALE',
        adresseChantier: {
          rue: '456 rue Chantier',
          codePostal: '75001',
          ville: 'Paris',
        },
      };

      const response = await request(app.getHttpServer())
        .post('/api/projets')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createProjetDto)
        .expect(201);

      expect(response.body).toHaveProperty('reference');
      expect(response.body.description).toBe(createProjetDto.description);
      expect(response.body.clientId).toBe(clientId);
    });
  });

  describe('/projets (GET)', () => {
    it('should get list of projets', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/projets')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter projets by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/projets?statut=EN_COURS')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.every((p: any) => p.statut === 'EN_COURS')).toBe(true);
    });
  });
});