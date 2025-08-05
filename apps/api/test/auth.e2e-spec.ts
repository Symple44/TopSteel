// apps/api/test/auth.e2e-spec.ts
import { type INestApplication, ValidationPipe } from '@nestjs/common'
import { Test, type TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import request from 'supertest'
import { AppModule } from '../src/app.module'
import { User } from '../src/modules/users/entities/user.entity'

describe('AuthController (e2e)', () => {
  let app: INestApplication
  let _userRepository

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(new ValidationPipe())
    await app.init()

    _userRepository = moduleFixture.get(getRepositoryToken(User))
  })

  afterAll(async () => {
    await app.close()
  })

  describe('/auth/register (POST)', () => {
    it('should register a new user', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'Password123!',
        nom: 'Test',
        prenom: 'User',
      }

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerDto)
        .expect(201)

      expect(response.body).toHaveProperty('accessToken')
      expect(response.body).toHaveProperty('refreshToken')
      expect(response.body.user).toMatchObject({
        email: registerDto.email,
        nom: registerDto.nom,
        prenom: registerDto.prenom,
      })
    })

    it('should fail with invalid email', async () => {
      const registerDto = {
        email: 'invalid-email',
        password: 'Password123!',
        nom: 'Test',
        prenom: 'User',
      }

      await request(app.getHttpServer()).post('/api/auth/register').send(registerDto).expect(400)
    })

    it('should fail with duplicate email', async () => {
      const registerDto = {
        email: 'duplicate@example.com',
        password: 'Password123!',
        nom: 'Test',
        prenom: 'User',
      }

      // Premier enregistrement
      await request(app.getHttpServer()).post('/api/auth/register').send(registerDto).expect(201)

      // Tentative de duplication
      await request(app.getHttpServer()).post('/api/auth/register').send(registerDto).expect(409)
    })
  })

  describe('/auth/login (POST)', () => {
    beforeEach(async () => {
      // Créer un utilisateur de test
      await request(app.getHttpServer()).post('/api/auth/register').send({
        email: 'login@example.com',
        password: 'Password123!',
        nom: 'Login',
        prenom: 'Test',
      })
    })

    it('should login successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Password123!',
        })
        .expect(200)

      expect(response.body).toHaveProperty('accessToken')
      expect(response.body).toHaveProperty('refreshToken')
    })

    it('should fail with wrong password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword',
        })
        .expect(401)
    })
  })

  describe('/auth/profile (GET)', () => {
    let accessToken: string

    beforeEach(async () => {
      const response = await request(app.getHttpServer()).post('/api/auth/register').send({
        email: 'profile@example.com',
        password: 'Password123!',
        nom: 'Profile',
        prenom: 'Test',
      })

      accessToken = response.body.accessToken
    })

    it('should get user profile with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('email', 'profile@example.com')
    })

    it('should fail without token', async () => {
      await request(app.getHttpServer()).get('/api/auth/profile').expect(401)
    })
  })

  describe('Complete Authentication Flow (Critical)', () => {
    const testUser = {
      email: 'authflow@topsteel.com',
      password: 'AuthFlow123!',
      nom: 'AuthFlow',
      prenom: 'Test',
    }

    beforeEach(async () => {
      // Nettoyer les utilisateurs de test précédents
      try {
        await request(app.getHttpServer()).post('/api/auth/register').send(testUser)
      } catch {
        // Utilisateur peut déjà exister
      }
    })

    it('should complete full authentication flow 5/5 tests', async () => {
      let accessToken: string
      let companyId: string

      // Test 1/5: User Login
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          login: testUser.email,
          password: testUser.password,
        })
        .expect(200)

      expect(loginResponse.body).toHaveProperty('data')
      expect(loginResponse.body.data).toHaveProperty('accessToken')
      expect(loginResponse.body.data).toHaveProperty('user')
      expect(loginResponse.body.data.user.email).toBe(testUser.email)

      accessToken = loginResponse.body.data.accessToken

      // Test 2/5: Get User Companies
      const companiesResponse = await request(app.getHttpServer())
        .get('/api/auth/societes')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(companiesResponse.body).toHaveProperty('data')
      expect(Array.isArray(companiesResponse.body.data)).toBe(true)
      expect(companiesResponse.body.data.length).toBeGreaterThan(0)

      const companies = companiesResponse.body.data
      const defaultCompany = companies.find((c: any) => c.isDefault === true)
      expect(defaultCompany).toBeDefined()

      companyId = defaultCompany.id

      // Test 3/5: Check Default Company API
      const defaultCompanyResponse = await request(app.getHttpServer())
        .get('/api/auth/user/default-company')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(defaultCompanyResponse.body).toHaveProperty('data')
      expect(defaultCompanyResponse.body.data).toHaveProperty('success', true)
      expect(defaultCompanyResponse.body.data).toHaveProperty('data')
      expect(defaultCompanyResponse.body.data.data).toHaveProperty('nom')

      // Test 4/5: Auto-Select Default Company
      const selectCompanyResponse = await request(app.getHttpServer())
        .post(`/api/auth/login-societe/${companyId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(200)

      expect(selectCompanyResponse.body).toHaveProperty('data')
      expect(selectCompanyResponse.body.data).toHaveProperty('tokens')
      expect(selectCompanyResponse.body.data.tokens).toHaveProperty('accessToken')
      expect(selectCompanyResponse.body.data).toHaveProperty('user')
      expect(selectCompanyResponse.body.data.user).toHaveProperty('societe')

      const multiTenantToken = selectCompanyResponse.body.data.tokens.accessToken

      // Test 5/5: Verify Multi-Tenant Token
      const verifyResponse = await request(app.getHttpServer())
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${multiTenantToken}`)
        .expect(200)

      expect(verifyResponse.body).toHaveProperty('data')
      expect(verifyResponse.body.data).toHaveProperty('email', testUser.email)
      expect(verifyResponse.body.data).toHaveProperty('id')

      // 🎉 Si on arrive ici, les 5 tests critiques sont passés
    })

    it('should handle missing default company gracefully', async () => {
      // Test avec un utilisateur sans société par défaut
      const noCompanyUser = {
        email: 'nocompany@topsteel.com',
        password: 'NoCompany123!',
        nom: 'NoCompany',
        prenom: 'Test',
      }

      await request(app.getHttpServer()).post('/api/auth/register').send(noCompanyUser)

      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          login: noCompanyUser.email,
          password: noCompanyUser.password,
        })
        .expect(200)

      const accessToken = loginResponse.body.data.accessToken

      // Devrait retourner une liste vide ou sans société par défaut
      const companiesResponse = await request(app.getHttpServer())
        .get('/api/auth/societes')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      // Le test ne doit pas planter même sans société par défaut
      expect(companiesResponse.body).toHaveProperty('data')
    })
  })
})
