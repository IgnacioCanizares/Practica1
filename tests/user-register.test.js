const request = require('supertest');
const app = require('../app');
const User = require('../models/user');

describe('User Registration API', () => {
  // Testeamos el registro de un nuevo usuario
  describe('POST /api/user/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/user/register')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
      
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('test@example.com');
      
      // Verificamos que el usuario se haya guardado en la base de datos
      const user = await User.findOne({ email: 'test@example.com' });
      expect(user).not.toBeNull();
      expect(user.email).toBe('test@example.com');
    });

    it('should not register a user with an existing email', async () => {
      // Primero creamos un usuario con el correo electrónico existente
      await User.create({
        email: 'existing@example.com',
        password: 'password123',
        status: 'VERIFIED' // Comprobamos que el usuario esté verificado para poder iniciar sesión
      });

      // Intentamos registrar un nuevo usuario con el mismo correo electrónico
      const res = await request(app)
        .post('/api/user/register')
        .send({
          email: 'existing@example.com',
          password: 'password123'
        });
      
      expect(res.statusCode).toBe(409);
      expect(res.body).toHaveProperty('error');
    });

    it('should not register a user with invalid email format', async () => {
      const res = await request(app)
        .post('/api/user/register')
        .send({
          email: 'invalid-email',
          password: 'password123'
        });
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should not register a user with password less than 8 characters', async () => {
      const res = await request(app)
        .post('/api/user/register')
        .send({
          email: 'valid@example.com',
          password: 'short'
        });
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });
});