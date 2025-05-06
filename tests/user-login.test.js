const request = require('supertest');
const app = require('../app');
const User = require('../models/user');

describe('User Login API', () => {
  beforeEach(async () => {
    // Crear un usuario de prueba
    const user = new User({
      email: 'login@example.com',
      password: 'password123',
      status: 'VERIFIED' // El usuario debe estar verificado para poder iniciar sesión
    });
    await user.save();
  });
  
  describe('POST /api/user/login', () => {
    it('should login with correct credentials', async () => {
      const res = await request(app)
        .post('/api/user/login')
        .send({
          email: 'login@example.com',
          password: 'password123'
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe('login@example.com');
      expect(res.body.user.status).toBe('VERIFIED');
    });
    
    it('should not login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/user/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword'
        });
      
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toContain('Credenciales invalidas');
    });
    
    it('should not login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/user/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });
      
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toContain('Credenciales invalidas');
    });
    
    it('should not login with unverified email', async () => {
      // Creamos un usuario de prueba con estado PENDING
      const unverifiedUser = new User({
        email: 'unverified@example.com',
        password: 'password123',
        status: 'PENDING'
      });
      await unverifiedUser.save();
      
      const res = await request(app)
        .post('/api/user/login')
        .send({
          email: 'unverified@example.com',
          password: 'password123'
        });
      
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toContain('Email no verificado');
    });
  });
});