const request = require('supertest');
const app = require('../app');
const Project = require('../models/project');
const Client = require('../models/client');
const User = require('../models/user');
const jwt = require('jsonwebtoken');

describe('Project API', () => {
  let token;
  let testUser;
  let testClient;
  let testProject;

  beforeEach(async () => {

    await User.deleteMany({});
    await Client.deleteMany({});
    await Project.deleteMany({});


    testUser = await User.create({
      email: 'project.test@example.com',
      password: 'password123',
      status: 'VERIFIED'
    });


    testClient = await Client.create({
      name: 'Test Client',
      email: 'testclient@example.com',
      createdBy: testUser._id
    });


    token = jwt.sign(
      { userId: testUser._id },
      process.env.JWT_SECRET || 'testsecret',
      { expiresIn: '1d' }
    );
  });

  describe('POST /api/project', () => {
    it('should create a new project', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'Test Description',
        client: testClient._id
      };

      const res = await request(app)
        .post('/api/project')
        .set('Authorization', `Bearer ${token}`)
        .send(projectData);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('name', projectData.name);
      expect(res.body).toHaveProperty('client', testClient._id.toString());
      expect(res.body).toHaveProperty('createdBy', testUser._id.toString());
    });

    it('should not create project without authentication', async () => {
      const res = await request(app)
        .post('/api/project')
        .send({
          name: 'Test Project',
          client: testClient._id
        });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/project', () => {
    beforeEach(async () => {

      await Project.create([
        {
          name: 'Project 1',
          client: testClient._id,
          createdBy: testUser._id
        },
        {
          name: 'Project 2',
          client: testClient._id,
          createdBy: testUser._id
        }
      ]);
    });

    it('should get all projects', async () => {
      const res = await request(app)
        .get('/api/project')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBe(2);
    });
  });

  describe('GET /api/project/:id', () => {
    beforeEach(async () => {
      testProject = await Project.create({
        name: 'Test Project',
        client: testClient._id,
        createdBy: testUser._id
      });
    });

    it('should get a specific project', async () => {
      const res = await request(app)
        .get(`/api/project/${testProject._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('_id', testProject._id.toString());
      expect(res.body).toHaveProperty('name', testProject.name);
    });

    it('should return 404 for non-existent project', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .get(`/api/project/${nonExistentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /api/project/:id', () => {
    beforeEach(async () => {
      testProject = await Project.create({
        name: 'Original Name',
        client: testClient._id,
        createdBy: testUser._id
      });
    });

    it('should update project', async () => {
      const res = await request(app)
        .put(`/api/project/${testProject._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Name',
          description: 'Updated Description'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('name', 'Updated Name');
      expect(res.body).toHaveProperty('description', 'Updated Description');
    });
  });

  describe('PATCH /api/project/:id/archive', () => {
    beforeEach(async () => {
      testProject = await Project.create({
        name: 'Archive Test Project',
        client: testClient._id,
        createdBy: testUser._id
      });
    });

    it('should archive a project', async () => {
      const res = await request(app)
        .patch(`/api/project/${testProject._id}/archive`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('isArchived', true);
    });
  });

  describe('GET /api/project/archived', () => {
    beforeEach(async () => {
      await Project.create([
        {
          name: 'Archived Project 1',
          client: testClient._id,
          createdBy: testUser._id,
          isArchived: true
        },
        {
          name: 'Archived Project 2',
          client: testClient._id,
          createdBy: testUser._id,
          isArchived: true
        }
      ]);
    });

    it('should get all archived projects', async () => {
      const res = await request(app)
        .get('/api/project/archived')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBe(2);
      expect(res.body[0]).toHaveProperty('isArchived', true);
    });
  });

  describe('PATCH /api/project/:id/restore', () => {
    beforeEach(async () => {
      testProject = await Project.create({
        name: 'Restore Test Project',
        client: testClient._id,
        createdBy: testUser._id,
        isArchived: true
      });
    });

    it('should restore an archived project', async () => {
      const res = await request(app)
        .patch(`/api/project/${testProject._id}/restore`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('isArchived', false);
    });
  });

  describe('DELETE /api/project/:id', () => {
    beforeEach(async () => {
      testProject = await Project.create({
        name: 'Delete Test Project',
        client: testClient._id,
        createdBy: testUser._id
      });
    });

    it('should delete a project', async () => {
      const res = await request(app)
        .delete(`/api/project/${testProject._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);


      const deletedProject = await Project.findById(testProject._id);
      expect(deletedProject).toBeNull();
    });
  });
});