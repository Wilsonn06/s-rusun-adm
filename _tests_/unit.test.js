const request = require('supertest');
const app = require('../app');

jest.mock('../db', () => {
  return {
    query: jest.fn(),
  };
});

jest.mock('axios', () => {
  return {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  };
});

const db = require('../db');
const axios = require('axios');

describe('Unit endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /unit', () => {
    it('should return list of units', async () => {
      const mockRows = [
        {
          unit_id: 'U001',
          unit_number: '101',
          pemilik_id: 'P001',
          floor_id: 'FL001',
          floor_number: 1,
          tower_id: 'T001',
          tower_name: 'Tower 1',
          flat_id: 'F001',
          flat_name: 'Rusun A',
        },
      ];

      db.query.mockResolvedValueOnce([mockRows]);

      const res = await request(app).get('/unit');

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockRows);
    });
  });

  describe('GET /unit/:unit_id', () => {
    it('should return one unit when found', async () => {
      const mockRows = [
        {
          unit_id: 'U001',
          unit_number: '101',
          pemilik_id: 'P001',
          pemilik_nama: 'Budi',
          floor_id: 'FL001',
          floor_number: 1,
          tower_id: 'T001',
          tower_name: 'Tower 1',
          flat_id: 'F001',
          flat_name: 'Rusun A',
        },
      ];

      db.query.mockResolvedValueOnce([mockRows]);

      const res = await request(app).get('/unit/U001');

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockRows[0]);
    });

    it('should return 404 when unit not found', async () => {
      db.query.mockResolvedValueOnce([[]]);

      const res = await request(app).get('/unit/UNKNOWN');

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('message', 'Unit tidak ditemukan.');
    });
  });

  describe('GET /unit/:unit_id/devices', () => {
    it('should return devices from app service', async () => {
      axios.get.mockResolvedValueOnce({
        data: { devices: [{ id: 'D1' }, { id: 'D2' }] },
      });

      const res = await request(app).get('/unit/U001/devices');

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([{ id: 'D1' }, { id: 'D2' }]);
      expect(axios.get).toHaveBeenCalled();
    });
  });

  describe('POST /unit', () => {
    it('should return 400 when required fields missing', async () => {
      const res = await request(app).post('/unit').send({
        unit_id: 'U002',
        floor_id: 'FL001',
      });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty(
        'message',
        'unit_id, unit_number, dan floor_id wajib diisi.'
      );
    });

    it('should return 400 when floor_id invalid', async () => {
      db.query.mockResolvedValueOnce([[]]);

      const res = await request(app).post('/unit').send({
        unit_id: 'U002',
        unit_number: '102',
        floor_id: 'INVALID',
      });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty(
        'message',
        "floor_id 'INVALID' tidak valid."
      );
    });

    it('should create unit when data valid (no pemilik)', async () => {
      db.query
        .mockResolvedValueOnce([[{ floor_id: 'FL001' }]]) 
        .mockResolvedValueOnce([{}]);

      const res = await request(app).post('/unit').send({
        unit_id: 'U002',
        unit_number: '102',
        floor_id: 'FL001',
      });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('message', 'Unit berhasil ditambahkan.');
    });

    it('should return 409 on duplicate unit_id', async () => {
      db.query
        .mockResolvedValueOnce([[{ floor_id: 'FL001' }]])
        .mockRejectedValueOnce({ code: 'ER_DUP_ENTRY' });

      const res = await request(app).post('/unit').send({
        unit_id: 'U002',
        unit_number: '102',
        floor_id: 'FL001',
      });

      expect(res.statusCode).toBe(409);
      expect(res.body).toHaveProperty(
        'message',
        "Unit dengan ID 'U002' sudah ada."
      );
    });
  });

  describe('DELETE /unit/:unit_id', () => {
    it('should delete unit and call devices delete on app', async () => {
      axios.delete.mockResolvedValueOnce({ data: {} });
      db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const res = await request(app).delete('/unit/U001');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty(
        'message',
        'Unit dan devices terkait berhasil dihapus.'
      );
      expect(axios.delete).toHaveBeenCalled();
    });

    it('should return 404 when unit not found', async () => {
      axios.delete.mockResolvedValueOnce({ data: {} });
      db.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

      const res = await request(app).delete('/unit/UNKNOWN');

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('message', 'Unit tidak ditemukan.');
    });
  });
});