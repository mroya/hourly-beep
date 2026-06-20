// Mock do fetch global
global.fetch = jest.fn();

// Precisa importar depois de configurar o mock
const { performTimeSync } = require('../../services/timeSync');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('performTimeSync', () => {
  it('retorna success=true e offset quando primeiro endpoint responde', async () => {
    const serverTime = Date.now() + 500; // Servidor 500ms à frente
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        dateTime: new Date(serverTime).toISOString().replace('Z', ''),
      }),
    });

    const result = await performTimeSync();

    expect(result.success).toBe(true);
    expect(typeof result.offset).toBe('number');
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('timeapi.io'),
      expect.any(Object)
    );
  });

  it('faz fallback para segundo endpoint se primeiro falha', async () => {
    // Primeiro endpoint falha
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    // Segundo endpoint funciona
    const serverTime = new Date().toISOString();
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        utc_datetime: serverTime,
      }),
    });

    const result = await performTimeSync();

    expect(result.success).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('worldtimeapi.org'),
      expect.any(Object)
    );
  });

  it('faz fallback para Cloudflare se ambos APIs falham', async () => {
    // Ambos endpoints falham
    global.fetch.mockRejectedValueOnce(new Error('Error 1'));
    global.fetch.mockRejectedValueOnce(new Error('Error 2'));

    // Cloudflare funciona
    global.fetch.mockResolvedValueOnce({
      headers: {
        get: (header) => header === 'date' ? new Date().toUTCString() : null,
      },
    });

    const result = await performTimeSync();

    expect(result.success).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(global.fetch).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('cloudflare.com'),
      expect.any(Object)
    );
  });

  it('retorna success=false se todos os endpoints falham', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Error 1'));
    global.fetch.mockRejectedValueOnce(new Error('Error 2'));
    global.fetch.mockRejectedValueOnce(new Error('Error 3'));

    const result = await performTimeSync();

    expect(result.success).toBe(false);
    expect(result.offset).toBe(0);
  });

  it('retorna success=false quando response não é ok', async () => {
    // Primeiro endpoint retorna 500
    global.fetch.mockResolvedValueOnce({ ok: false });
    // Segundo endpoint retorna 500
    global.fetch.mockResolvedValueOnce({ ok: false });
    // Cloudflare sem date header
    global.fetch.mockResolvedValueOnce({
      headers: { get: () => null },
    });

    const result = await performTimeSync();

    expect(result.success).toBe(false);
    expect(result.offset).toBe(0);
  });

  it('lida com response malformada (sem dateTime/utc_datetime)', async () => {
    // Primeiro endpoint retorna dados inválidos
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ invalidField: 'test' }),
    });
    // Segundo endpoint retorna dados inválidos
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ invalidField: 'test' }),
    });
    // Cloudflare fallback sem date
    global.fetch.mockResolvedValueOnce({
      headers: { get: () => null },
    });

    const result = await performTimeSync();

    expect(result.success).toBe(false);
    expect(result.offset).toBe(0);
  });
});
