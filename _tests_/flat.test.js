const request = require('supertest');
const app = require('../app');

jest.mock('../db', () => {
  return {
    query: jest.fn(),
  };
});

const db = require('../db');

describe('Flat endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /flat', () => {
    it('should return list of flats', async () => {
      const mockRows = [
        { flat_id: 'F001', flat_name: 'Rusun A', flat_address: 'Jl. A' },
        { flat_id: 'F002', flat_name: 'Rusun B', flat_address: 'Jl. B' },
      ];

      db.query.mockResolvedValueOnce([mockRows]);

      const res = await request(app).get('/flat');

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockRows);
    });

    it('should return 500 when db query fails', async () => {
      db.query.mockRejectedValueOnce(new Error('DB error'));

      const res = await request(app).get('/flat');

      expect(res.statusCode).toBe(500);
      expect(res.body).toHaveProperty('message', 'Gagal mengambil data flat.');
    });
  });

  describe('GET /flat/:flat_id', () => {
    it('should return one flat when found', async () => {
      const mockRows = [
        { flat_id: 'F001', flat_name: 'Rusun A', flat_address: 'Jl. A' },
      ];

      db.query.mockResolvedValueOnce([mockRows]);

      const res = await request(app).get('/flat/F001');

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockRows[0]);
    });

    it('should return 404 when flat not found', async () => {
      db.query.mockResolvedValueOnce([[]]);

      const res = await request(app).get('/flat/UNKNOWN');

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('message', 'Flat tidak ditemukan.');
    });
  });

  describe('GET /flat/:flat_id/tower', () => {
    it('should return towers for given flat', async () => {
      const mockRows = [
        { tower_id: 'T001', tower_name: 'Tower 1', flat_id: 'F001' },
        { tower_id: 'T002', tower_name: 'Tower 2', flat_id: 'F001' },
      ];

      db.query.mockResolvedValueOnce([mockRows]);

      const res = await request(app).get('/flat/F001/tower');

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockRows);
    });

    it('should return 500 when db query fails', async () => {
      db.query.mockRejectedValueOnce(new Error('DB error'));

      const res = await request(app).get('/flat/F001/tower');

      expect(res.statusCode).toBe(500);
      expect(res.body).toHaveProperty(
        'message',
        'Gagal mengambil tower di flat ini.'
      );
    });
  });

  describe('POST /flat', () => {
    it('should return 400 when required fields missing', async () => {
      const res = await request(app).post('/flat').send({
        flat_name: 'Rusun X',
      });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty(
        'message',
        'flat_id dan flat_name wajib diisi.'
      );
    });

    it('should create flat when data valid', async () => {
      db.query.mockResolvedValueOnce([{}]);

      const res = await request(app).post('/flat').send({
        flat_id: 'F003',
        flat_name: 'Rusun C',
        flat_address: 'Jl. C',
      });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty(
        'message',
        'Flat berhasil ditambahkan.'
      );
    });

    it('should return 409 on duplicate flat_id', async () => {
      db.query.mockRejectedValueOnce({ code: 'ER_DUP_ENTRY' });

      const res = await request(app).post('/flat').send({
        flat_id: 'F001',
        flat_name: 'Rusun A',
      });

      expect(res.statusCode).toBe(409);
      expect(res.body).toHaveProperty(
        'message',
        "Rusun dengan ID 'F001' sudah ada."
      );
    });
  });

  describe('PUT /flat/:flat_id', () => {
    it('should update flat when exists', async () => {
      db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const res = await request(app).put('/flat/F001').send({
        flat_name: 'Rusun A Baru',
        flat_address: 'Jl. A No. 1',
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty(
        'message',
        'Flat berhasil diperbarui.'
      );
    });

    it('should return 404 when flat not found', async () => {
      db.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

      const res = await request(app).put('/flat/UNKNOWN').send({
        flat_name: 'Rusun X',
        flat_address: 'Jl. X',
      });

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty(
        'message',
        'Flat tidak ditemukan.'
      );
    });
  });

  describe('DELETE /flat/:flat_id', () => {
    it('should delete flat when exists', async () => {
      db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const res = await request(app).delete('/flat/F001');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty(
        'message',
        'Flat berhasil dihapus.'
      );
    });

    it('should return 404 when flat not found', async () => {
      db.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

      const res = await request(app).delete('/flat/UNKNOWN');

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty(
        'message',
        'Flat tidak ditemukan.'
      );
    });
  });
});