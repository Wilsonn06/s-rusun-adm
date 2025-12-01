const request = require('supertest');
const app = require('../app');

jest.mock('../db', () => {
  return {
    query: jest.fn(),
  };
});

const db = require('../db');

describe('Tower endpoints', () => {
  let consoleErrorSpy;

  const muteConsoleError = () => {
    if (!consoleErrorSpy) {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (consoleErrorSpy) {
      consoleErrorSpy.mockRestore();
      consoleErrorSpy = null;
    }
  });

  describe('GET /tower', () => {
    it('should return list of towers', async () => {
      const mockRows = [
        { tower_id: 'T001', tower_name: 'Tower 1', flat_id: 'F001', flat_name: 'Rusun A' },
        { tower_id: 'T002', tower_name: 'Tower 2', flat_id: 'F001', flat_name: 'Rusun A' },
      ];

      db.query.mockResolvedValueOnce([mockRows]);

      const res = await request(app).get('/tower');

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockRows);
    });

    it('should return 500 when db query fails', async () => {
      muteConsoleError();
      db.query.mockRejectedValueOnce(new Error('DB error'));

      const res = await request(app).get('/tower');

      expect(res.statusCode).toBe(500);
      expect(res.body).toHaveProperty('message', 'Gagal mengambil data tower.');
    });
  });

  describe('GET /tower/:tower_id', () => {
    it('should return one tower when found', async () => {
      const mockRows = [
        { tower_id: 'T001', tower_name: 'Tower 1', flat_id: 'F001', flat_name: 'Rusun A' },
      ];

      db.query.mockResolvedValueOnce([mockRows]);

      const res = await request(app).get('/tower/T001');

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockRows[0]);
    });

    it('should return 404 when tower not found', async () => {
      db.query.mockResolvedValueOnce([[]]);

      const res = await request(app).get('/tower/UNKNOWN');

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('message', 'Tower tidak ditemukan.');
    });

    it('should return 500 when db query fails', async () => {
      muteConsoleError();
      db.query.mockRejectedValueOnce(new Error('DB error'));

      const res = await request(app).get('/tower/T001');

      expect(res.statusCode).toBe(500);
      expect(res.body).toHaveProperty('message', 'Gagal mengambil data tower.');
    });
  });

  describe('POST /tower', () => {
    it('should return 400 when required fields missing', async () => {
      const res = await request(app).post('/tower').send({
        tower_id: 'T003',
        flat_id: 'F001',
      });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty(
        'message',
        'tower_id, tower_name, dan flat_id wajib diisi.'
      );
    });

    it('should return 400 when flat_id not valid', async () => {
      db.query.mockResolvedValueOnce([[]]);

      const res = await request(app).post('/tower').send({
        tower_id: 'T003',
        tower_name: 'Tower 3',
        flat_id: 'INVALID',
      });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty(
        'message',
        "flat_id 'INVALID' tidak valid."
      );
    });

    it('should create tower when data valid', async () => {
      db.query
        .mockResolvedValueOnce([[{ flat_id: 'F001' }]]) // cek flat
        .mockResolvedValueOnce([{}]);                  // insert tower

      const res = await request(app).post('/tower').send({
        tower_id: 'T003',
        tower_name: 'Tower 3',
        flat_id: 'F001',
      });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('message', 'Tower berhasil ditambahkan.');
    });

    it('should return 409 on duplicate tower_id', async () => {
      muteConsoleError();
      db.query
        .mockResolvedValueOnce([[{ flat_id: 'F001' }]])
        .mockRejectedValueOnce({ code: 'ER_DUP_ENTRY' });

      const res = await request(app).post('/tower').send({
        tower_id: 'T003',
        tower_name: 'Tower 3',
        flat_id: 'F001',
      });

      expect(res.statusCode).toBe(409);
      expect(res.body).toHaveProperty(
        'message',
        "Tower dengan ID 'T003' sudah ada."
      );
    });

    it('should return 500 on unknown db error', async () => {
      muteConsoleError();
      db.query
        .mockResolvedValueOnce([[{ flat_id: 'F001' }]])
        .mockRejectedValueOnce(new Error('Unknown DB error'));

      const res = await request(app).post('/tower').send({
        tower_id: 'T004',
        tower_name: 'Tower 4',
        flat_id: 'F001',
      });

      expect(res.statusCode).toBe(500);
      expect(res.body).toHaveProperty(
        'message',
        'Gagal menambahkan tower.'
      );
    });
  });
});