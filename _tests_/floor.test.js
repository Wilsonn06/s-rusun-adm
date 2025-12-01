const request = require('supertest');
const app = require('../app');

jest.mock('../db', () => {
  return {
    query: jest.fn(),
  };
});

const db = require('../db');

describe('Floor endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /floor', () => {
    it('should return list of floors', async () => {
      const mockRows = [
        {
          floor_id: 'FL001',
          floor_number: 1,
          tower_id: 'T001',
          tower_name: 'Tower 1',
          flat_id: 'F001',
          flat_name: 'Rusun A',
        },
      ];

      db.query.mockResolvedValueOnce([mockRows]);

      const res = await request(app).get('/floor');

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockRows);
    });
  });

  describe('GET /floor/:floor_id', () => {
    it('should return one floor when found', async () => {
      const mockRows = [
        {
          floor_id: 'FL001',
          floor_number: 1,
          tower_id: 'T001',
          tower_name: 'Tower 1',
          flat_id: 'F001',
          flat_name: 'Rusun A',
        },
      ];

      db.query.mockResolvedValueOnce([mockRows]);

      const res = await request(app).get('/floor/FL001');

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockRows[0]);
    });

    it('should return 404 when floor not found', async () => {
      db.query.mockResolvedValueOnce([[]]);

      const res = await request(app).get('/floor/UNKNOWN');

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('message', 'Floor tidak ditemukan.');
    });
  });

  describe('POST /floor', () => {
    it('should return 400 when required fields missing', async () => {
      const res = await request(app).post('/floor').send({
        floor_id: 'FL002',
        tower_id: 'T001',
      });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty(
        'message',
        'floor_id, floor_number, dan tower_id wajib diisi.'
      );
    });

    it('should return 400 when tower_id not valid', async () => {
      db.query.mockResolvedValueOnce([[]]);

      const res = await request(app).post('/floor').send({
        floor_id: 'FL002',
        floor_number: 2,
        tower_id: 'INVALID',
      });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty(
        'message',
        "tower_id 'INVALID' tidak valid."
      );
    });

    it('should create floor when data valid', async () => {
      db.query
        .mockResolvedValueOnce([[{ tower_id: 'T001' }]])
        .mockResolvedValueOnce([{}]);

      const res = await request(app).post('/floor').send({
        floor_id: 'FL002',
        floor_number: 2,
        tower_id: 'T001',
      });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('message', 'Floor berhasil ditambahkan.');
    });

    it('should return 409 on duplicate floor_id', async () => {
      db.query
        .mockResolvedValueOnce([[{ tower_id: 'T001' }]])
        .mockRejectedValueOnce({ code: 'ER_DUP_ENTRY' });

      const res = await request(app).post('/floor').send({
        floor_id: 'FL002',
        floor_number: 2,
        tower_id: 'T001',
      });

      expect(res.statusCode).toBe(409);
      expect(res.body).toHaveProperty(
        'message',
        "Lantai dengan ID 'FL002' sudah ada."
      );
    });
  });
});