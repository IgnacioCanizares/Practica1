const request = require('supertest');
const app = require('../app');
const DeliveryNote = require('../models/deliveryNote');
const Project = require('../models/project');
const Client = require('../models/client');
const User = require('../models/user');
const jwt = require('jsonwebtoken');

describe('DeliveryNote API', () => {
  let token;
  let testUser;
  let testClient;
  let testProject;
  let testDeliveryNote;

  beforeEach(async () => {
    // Limpiamos la base de datos antes de cada prueba
    await User.deleteMany({});
    await Client.deleteMany({});
    await Project.deleteMany({});
    await DeliveryNote.deleteMany({});

    // Creamos un usuario de prueba
    testUser = await User.create({
      email: 'deliverynote.test@example.com',
      password: 'password123',
      status: 'VERIFIED'
    });

    // Creamos un cliente de prueba
    testClient = await Client.create({
      name: 'Test Client',
      email: 'testclient@example.com',
      createdBy: testUser._id
    });

    // Creamos un proyecto de prueba
    testProject = await Project.create({
      name: 'Test Project',
      description: 'Test Description',
      client: testClient._id,
      createdBy: testUser._id
    });

    // Generamos un token de prueba
    token = jwt.sign(
      { userId: testUser._id },
      process.env.JWT_SECRET || 'testsecret',
      { expiresIn: '1d' }
    );
  });

  describe('POST /api/deliverynote', () => {
    it('should create a new delivery note', async () => {
      const deliveryNoteData = {
        projectId: testProject._id,
        items: [
          {
            type: 'HOURS',
            description: 'Development work',
            quantity: 8,
            unitPrice: 50,
            person: 'John Doe',
            date: new Date('2025-05-05')
          },
          {
            type: 'MATERIAL',
            description: 'Server hardware',
            quantity: 1,
            unitPrice: 1200,
            reference: 'SRV-2023-001'
          }
        ],
        notes: 'Work completed as requested'
      };

      const res = await request(app)
        .post('/api/deliverynote')
        .set('Authorization', `Bearer ${token}`)
        .send(deliveryNoteData);

      expect(res.statusCode).toBe(201);
      expect(res.body.project._id).toBe(testProject._id.toString());
      expect(res.body.items).toHaveLength(2);
      expect(res.body.createdBy._id).toBe(testUser._id.toString());
    });

    it('should not create delivery note without authentication', async () => {
      const res = await request(app)
        .post('/api/deliverynote')
        .send({
          projectId: testProject._id,
          items: []
        });

      expect(res.statusCode).toBe(401);
    });

    it('should not create delivery note with invalid project ID', async () => {
      const res = await request(app)
        .post('/api/deliverynote')
        .set('Authorization', `Bearer ${token}`)
        .send({
          projectId: 'invalid-id',
          items: []
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/deliverynote', () => {
    beforeEach(async () => {
      testDeliveryNote = await DeliveryNote.create({
        project: testProject._id,
        client: testClient._id,
        items: [
          {
            type: 'HOURS',
            description: 'Test work',
            quantity: 4,
            unitPrice: 40,
            person: 'Jane Doe',
            date: new Date()
          }
        ],
        totalAmount: 160,
        createdBy: testUser._id
      });
    });

    it('should get all delivery notes', async () => {
      const res = await request(app)
        .get('/api/deliverynote')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBe(1);
      expect(res.body[0]._id).toBe(testDeliveryNote._id.toString());
    });

    it('should filter delivery notes by project', async () => {
      const res = await request(app)
        .get(`/api/deliverynote?projectId=${testProject._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBe(1);
    });
  });

  describe('GET /api/deliverynote/:id', () => {
    beforeEach(async () => {
      testDeliveryNote = await DeliveryNote.create({
        project: testProject._id,
        client: testClient._id,
        items: [
          {
            type: 'HOURS',
            description: 'Test work',
            quantity: 4,
            unitPrice: 40,
            person: 'Jane Doe',
            date: new Date()
          }
        ],
        totalAmount: 160,
        createdBy: testUser._id
      });
    });

    it('should get a specific delivery note', async () => {
      const res = await request(app)
        .get(`/api/deliverynote/${testDeliveryNote._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('_id', testDeliveryNote._id.toString());
      expect(res.body.items[0].description).toBe('Test work');
    });

    it('should return 404 for non-existent delivery note', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .get(`/api/deliverynote/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /api/deliverynote/pdf/:id', () => {
    beforeEach(async () => {
      testDeliveryNote = await DeliveryNote.create({
        project: testProject._id,
        client: testClient._id,
        items: [
          {
            type: 'HOURS',
            description: 'PDF Test work',
            quantity: 4,
            unitPrice: 40,
            person: 'Jane Doe',
            date: new Date()
          }
        ],
        totalAmount: 160,
        createdBy: testUser._id
      });
    });

    it('should generate PDF for delivery note', async () => {
      const res = await request(app)
        .get(`/api/deliverynote/pdf/${testDeliveryNote._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
    });

    it('should return 404 for non-existent delivery note PDF', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .get(`/api/deliverynote/pdf/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /api/deliverynote/:id/sign', () => {
    beforeEach(async () => {
      testDeliveryNote = await DeliveryNote.create({
        project: testProject._id,
        client: testClient._id,
        items: [
          {
            type: 'HOURS',
            description: 'Signature Test work',
            quantity: 4,
            unitPrice: 40,
            person: 'Jane Doe',
            date: new Date()
          }
        ],
        totalAmount: 160,
        createdBy: testUser._id,
        status: 'DRAFT'
      });
    });

    it('should sign a delivery note', async () => {
      const mockSignature = Buffer.from('fake image data');

      const res = await request(app)
        .post(`/api/deliverynote/${testDeliveryNote._id}/sign`)
        .set('Authorization', `Bearer ${token}`)
        .attach('signature', mockSignature, 'signature.png');

      expect(res.statusCode).toBe(200);
      expect(res.body.deliveryNote).toHaveProperty('signature');
      expect(res.body.deliveryNote.signature).toHaveProperty('date');
      expect(res.body.deliveryNote.signature).toHaveProperty('imageUrl');
      expect(res.body.deliveryNote.status).toBe('SIGNED');
    });

    it('should not sign a delivery note without a file', async () => {
      const res = await request(app)
        .post(`/api/deliverynote/${testDeliveryNote._id}/sign`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/deliverynote/:id', () => {
    beforeEach(async () => {
      testDeliveryNote = await DeliveryNote.create({
        project: testProject._id,
        client: testClient._id,
        items: [
          {
            type: 'HOURS',
            description: 'Delete Test work',
            quantity: 4,
            unitPrice: 40,
            person: 'Jane Doe',
            date: new Date()
          }
        ],
        totalAmount: 160,
        createdBy: testUser._id,
        status: 'DRAFT',
        isArchived: false
      });
    });

    it('should delete a delivery note', async () => {
      const res = await request(app)
        .delete(`/api/deliverynote/${testDeliveryNote._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message');
      expect(await DeliveryNote.findById(testDeliveryNote._id)).toBeNull();
    });
  });

  describe('DELETE /api/deliverynote/:id (signed note)', () => {
    beforeEach(async () => {
      testDeliveryNote = await DeliveryNote.create({
        project: testProject._id,
        client: testClient._id,
        items: [
          {
            type: 'HOURS',
            description: 'Signed Test work',
            quantity: 4,
            unitPrice: 40,
            person: 'Jane Doe',
            date: new Date()
          }
        ],
        totalAmount: 160,
        createdBy: testUser._id,
        status: 'SIGNED',
        isArchived: false,
        signature: { 
          date: new Date(), 
          imageUrl: '/uploads/fake.png',
          signedBy: testUser._id
        }
      });
    });

    it('should not delete a signed delivery note', async () => {
      const res = await request(app)
        .delete(`/api/deliverynote/${testDeliveryNote._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error', 'No se puede eliminar un albarán firmado');
      const stillExists = await DeliveryNote.findById(testDeliveryNote._id);
      expect(stillExists).not.toBeNull();
    });
  });

  describe('Extra edge cases', () => {
    it('should not allow creating a delivery note with negative quantity', async () => {
      const res = await request(app)
        .post('/api/deliverynote')
        .set('Authorization', `Bearer ${token}`)
        .send({
          projectId: testProject._id,
          items: [
            {
              type: 'HOURS',
              description: 'Negative quantity',
              quantity: -5,
              unitPrice: 10
            }
          ]
        });

      expect(res.statusCode).toBe(400);
    });

    it('should not allow creating a delivery note with negative unitPrice', async () => {
      const res = await request(app)
        .post('/api/deliverynote')
        .set('Authorization', `Bearer ${token}`)
        .send({
          projectId: testProject._id,
          items: [
            {
              type: 'MATERIAL',
              description: 'Negative price',
              quantity: 1,
              unitPrice: -100
            }
          ]
        });

      expect(res.statusCode).toBe(400);
    });

    it('should not allow creating a delivery note with empty items array', async () => {
      const res = await request(app)
        .post('/api/deliverynote')
        .set('Authorization', `Bearer ${token}`)
        .send({
          projectId: testProject._id,
          items: []
        });

      expect(res.statusCode).toBe(400);
    });

    it('should not allow accessing a delivery note without authentication', async () => {
      const note = await DeliveryNote.create({
        project: testProject._id,
        client: testClient._id,
        items: [
          {
            type: 'HOURS',
            description: 'No auth',
            quantity: 1,
            unitPrice: 10
          }
        ],
        totalAmount: 10,
        createdBy: testUser._id
      });

      const res = await request(app)
        .get(`/api/deliverynote/${note._id}`);

      expect(res.statusCode).toBe(401);
    });

    it('should not allow deleting a delivery note without authentication', async () => {
      const note = await DeliveryNote.create({
        project: testProject._id,
        client: testClient._id,
        items: [
          {
            type: 'HOURS',
            description: 'No auth delete',
            quantity: 1,
            unitPrice: 10
          }
        ],
        totalAmount: 10,
        createdBy: testUser._id
      });

      const res = await request(app)
        .delete(`/api/deliverynote/${note._id}`);

      expect(res.statusCode).toBe(401);
    });
  });

  describe('Edge cases and negative scenarios', () => {
    it('should not allow signing a delivery note that is already signed', async () => {
      const signedNote = await DeliveryNote.create({
        project: testProject._id,
        client: testClient._id,
        items: [
          {
            type: 'HOURS',
            description: 'Already signed',
            quantity: 1,
            unitPrice: 10,
            person: 'Jane Doe',
            date: new Date()
          }
        ],
        totalAmount: 10,
        createdBy: testUser._id,
        status: 'SIGNED',
        signature: { date: new Date(), imageUrl: '/uploads/fake.png' }
      });

      const mockSignature = Buffer.from('fake image data');
      const res = await request(app)
        .post(`/api/deliverynote/${signedNote._id}/sign`)
        .set('Authorization', `Bearer ${token}`)
        .attach('signature', mockSignature, 'signature.png');


      expect(res.statusCode).toBe(400);
    });

    it('should return 404 when deleting a non-existent delivery note', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .delete(`/api/deliverynote/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
    });

    it('should not create a delivery note with missing required fields', async () => {
      const res = await request(app)
        .post('/api/deliverynote')
        .set('Authorization', `Bearer ${token}`)
        .send({
          projectId: testProject._id,
          items: [
            {
              description: 'Missing fields',
              quantity: 1
            }
          ]
        });

      expect(res.statusCode).toBe(400);
    });

    it('should not create a delivery note with invalid item type', async () => {
      const res = await request(app)
        .post('/api/deliverynote')
        .set('Authorization', `Bearer ${token}`)
        .send({
          projectId: testProject._id,
          items: [
            {
              type: 'INVALID_TYPE',
              description: 'Invalid',
              quantity: 1,
              unitPrice: 10
            }
          ]
        });

      expect(res.statusCode).toBe(400);
    });

    it('should return an empty array when no delivery notes exist', async () => {
      await DeliveryNote.deleteMany({});
      const res = await request(app)
        .get('/api/deliverynote')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBe(0);
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Client.deleteMany({});
    await Project.deleteMany({});
    await DeliveryNote.deleteMany({});
  });
});