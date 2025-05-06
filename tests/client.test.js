const request = require('supertest');
const app = require('../app');
const Client = require('../models/client');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const sendValidationEmail = require('../utils/sendValidationEmail'); 

jest.mock('../utils/sendValidationEmail');

describe('Client API', () => {
  let token;
  let testUser;

  beforeEach(async () => {
    // Creamos un usuario de prueba
    testUser = await User.create({
      email: 'client.test@example.com',
      password: 'password123',
      status: 'VERIFIED'
    });

    // Generamos un token JWT para el usuario de prueba
    token = jwt.sign(
      { userId: testUser._id },
      process.env.JWT_SECRET || 'testsecret',
      { expiresIn: '1d' }
    );
    sendValidationEmail.mockClear(); // Limpia el mock antes de cada test
  });

  describe('POST /api/client', () => {
    it('should create a new client and send validation email', async () => {
      const clientData = {
        name: 'Test Client',
        email: 'testclient@example.com',
        phone: '123456789'
      };

      const res = await request(app)
        .post('/api/client')
        .set('Authorization', `Bearer ${token}`)
        .send(clientData);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('name', clientData.name);
      expect(res.body).toHaveProperty('email', clientData.email);
      expect(res.body).toHaveProperty('createdBy', testUser._id.toString());
      expect(sendValidationEmail).toHaveBeenCalledWith(expect.objectContaining({
        email: clientData.email
      }));
    });

    it('should not create client without authentication', async () => {
      const res = await request(app)
        .post('/api/client')
        .send({
          name: 'Test Client',
          email: 'testclient@example.com'
        });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/client', () => {
    beforeEach(async () => {
      // Creamos algunos clientes de prueba
      await Client.create([
        {
          name: 'Client 1',
          email: 'client1@example.com',
          createdBy: testUser._id
        },
        {
          name: 'Client 2',
          email: 'client2@example.com',
          createdBy: testUser._id
        }
      ]);
    });

    it('should get all clients', async () => {
      const res = await request(app)
        .get('/api/client')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBe(2);
    });
  });

  describe('PUT /api/client/:id', () => {
    let testClient;

    beforeEach(async () => {
      testClient = await Client.create({
        name: 'Original Name',
        email: 'original@example.com',
        createdBy: testUser._id
      });
    });

    it('should update client', async () => {
      const res = await request(app)
        .put(`/api/client/${testClient._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Name',
          phone: '987654321'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('name', 'Updated Name');
      expect(res.body).toHaveProperty('phone', '987654321');
    });
  });
});