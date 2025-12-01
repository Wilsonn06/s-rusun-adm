const request = require('supertest');
const app = require('../app');

jest.mock('axios', () => {
  return {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  };
});

const axios = require('axios');

describe('Devices proxy endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /devices should return devices from app service', async () => {
    axios.get.mockResolvedValueOnce({ data: [{ id: 'D1' }] });

    const res = await request(app).get('/devices');

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([{ id: 'D1' }]);
  });

  it('GET /devices/unit/:unit_id should return devices by unit', async () => {
    axios.get.mockResolvedValueOnce({ data: { devices: [{ id: 'D2' }] } });

    const res = await request(app).get('/devices/unit/U001');

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ devices: [{ id: 'D2' }] });
  });

  it('POST /devices should proxy creation to app service', async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });

    const res = await request(app)
      .post('/devices')
      .send({ name: 'Device A' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ success: true });
  });

  it('DELETE /devices/:device_id should proxy delete to app service', async () => {
    axios.delete.mockResolvedValueOnce({ data: { ok: true } });

    const res = await request(app).delete('/devices/D1');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Device berhasil dihapus');
  });
});