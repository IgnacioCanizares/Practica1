const request = require('supertest');
const app = require('../app');
const User = require('../models/user');
const jwt = require('jsonwebtoken');

describe('User Validation API', () => {
  let token;
  let testUser;
  let verificationCode = '123456';
  
  beforeEach(async () => {
    await User.deleteMany({});
    
    const codeExpiration = new Date();
    codeExpiration.setHours(codeExpiration.getHours() + 24);
    
    testUser = await User.create({
      email: 'validate@example.com',
      password: 'password123',
      status: 'PENDING',
      verificationCode: {
        code: verificationCode,
        attempts: 3,
        expiresAt: codeExpiration
      }
    });
    
    token = jwt.sign(
      { userId: testUser._id },
      process.env.JWT_SECRET || 'testsecret',
      { expiresIn: '1d' }
    );
  });
  
  describe('PUT /api/user/validate', () => {
    it('should validate a user with correct code', async () => {
      const res = await request(app)
        .put('/api/user/validate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          code: verificationCode
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('status');
      expect(res.body.status).toBe('VERIFIED');
      
      const user = await User.findById(testUser._id);
      expect(user.status).toBe('VERIFIED');
    });
    
    it('should not validate with incorrect code', async () => {
      const res = await request(app)
        .put('/api/user/validate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          code: '999999'
        });
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('attemptsLeft');
      expect(res.body.attemptsLeft).toBe(2);
      
      const user = await User.findById(testUser._id);
      expect(user.verificationCode.attempts).toBe(2);
    });
    
    it('should not validate an already verified user', async () => {

      testUser.status = 'VERIFIED';
      testUser.verificationCode = undefined;
      await testUser.save();
      
      const res = await request(app)
        .put('/api/user/validate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          code: verificationCode
        });
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toContain('ya verificado');
    });
    
    it('should not validate with expired code', async () => {

      testUser.verificationCode.expiresAt = new Date(Date.now() - 3600000);
      await testUser.save();
      
      const res = await request(app)
        .put('/api/user/validate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          code: verificationCode
        });
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toContain('expirado');
    });
    
    it('should not validate after too many attempts', async () => {

      testUser.verificationCode.attempts = 0;
      await testUser.save();
      
      const res = await request(app)
        .put('/api/user/validate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          code: verificationCode
        });
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toContain('intentos');
    });
    
    it('should not validate without authentication', async () => {
      const res = await request(app)
        .put('/api/user/validate')
        .send({
          code: verificationCode
        });
      
      expect(res.statusCode).toBe(401);
    });
  });
});