const request = require('supertest');
const app = require('../app');

jest.mock('../db', () => {
  return {
    query: jest.fn(),
  };
});

const db = require('../db');

describe('Pemilik endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /pemilik', () => {
    it('should return list of pemilik with total_unit', async () => {
      const mockRows = [
        {
          pemilik_id: 'P001',
          nama: 'Budi',
          nik: '123',
          total_unit: 2,
        },
      ];

      db.query.mockResolvedValueOnce([mockRows]);

      const res = await request(app).get('/pemilik');

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockRows);
    });
  });

  describe('GET /pemilik/:pemilik_id', () => {
    it('should return one pemilik when found', async () => {
      const mockRows = [
        {
          pemilik_id: 'P001',
          nama: 'Budi',
          nik: '123',
        },
      ];

      db.query.mockResolvedValueOnce([mockRows]);

      const res = await request(app).get('/pemilik/P001');

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockRows[0]);
    });

    it('should return 404 when pemilik not found', async () => {
      db.query.mockResolvedValueOnce([[]]);

      const res = await request(app).get('/pemilik/UNKNOWN');

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('message', 'Pemilik tidak ditemukan.');
    });
  });

  describe('POST /pemilik', () => {
    it('should return 400 when required fields missing', async () => {
      const res = await request(app).post('/pemilik').send({
        pemilik_id: 'P002',
        nama: 'Siti',
      });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty(
        'message',
        'pemilik_id, nama, dan nik wajib diisi.'
      );
    });

    it('should create pemilik when data valid', async () => {
      db.query.mockResolvedValueOnce([{}]);

      const res = await request(app).post('/pemilik').send({
        pemilik_id: 'P002',
        nama: 'Siti',
        nik: '456',
        tanggal_lahir: '1990-01-01',
        jenis_kelamin: 'P',
        no_telepon: '0800000',
        alamat: 'Jl. X',
      });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty(
        'message',
        'Pemilik berhasil ditambahkan.'
      );
    });

    it('should return 400 on duplicate pemilik_id', async () => {
      db.query.mockRejectedValueOnce({ code: 'ER_DUP_ENTRY' });

      const res = await request(app).post('/pemilik').send({
        pemilik_id: 'P002',
        nama: 'Siti',
        nik: '456',
      });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('DELETE /pemilik/:pemilik_id', () => {
    it('should delete pemilik when exists', async () => {
      db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const res = await request(app).delete('/pemilik/P001');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty(
        'message',
        'Pemilik berhasil dihapus.'
      );
    });

    it('should return 404 when pemilik not found', async () => {
      db.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

      const res = await request(app).delete('/pemilik/UNKNOWN');

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('message', 'Pemilik tidak ditemukan.');
    });
  });
});