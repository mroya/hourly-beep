jest.mock('react-native', () => ({
  Vibration: {
    vibrate: jest.fn(),
    cancel: jest.fn(),
  },
  Platform: {
    OS: 'android',
  },
}));

const { Vibration } = require('react-native');
const {
  VIBRATION_PATTERNS,
  getVibrationById,
  playVibrationPreview,
  triggerHapticFeedback,
} = require('../../services/vibration');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('VIBRATION_PATTERNS', () => {
  it('contém padrões esperados', () => {
    expect(VIBRATION_PATTERNS.length).toBeGreaterThanOrEqual(4);
    const ids = VIBRATION_PATTERNS.map(p => p.id);
    expect(ids).toContain('off');
    expect(ids).toContain('short');
    expect(ids).toContain('double');
    expect(ids).toContain('heartbeat');
    expect(ids).toContain('long');
  });

  it('padrão "off" tem pattern null', () => {
    const off = VIBRATION_PATTERNS.find(p => p.id === 'off');
    expect(off.pattern).toBeNull();
  });

  it('padrões não-off têm arrays válidos', () => {
    const nonOff = VIBRATION_PATTERNS.filter(p => p.id !== 'off');
    nonOff.forEach(pattern => {
      expect(Array.isArray(pattern.pattern)).toBe(true);
      expect(pattern.pattern.length).toBeGreaterThanOrEqual(2);
    });
  });
});

describe('getVibrationById', () => {
  it('retorna padrão correto por ID', () => {
    const result = getVibrationById('short');
    expect(result.id).toBe('short');
    expect(result.pattern).toEqual([0, 100]);
  });

  it('retorna padrão "heartbeat" corretamente', () => {
    const result = getVibrationById('heartbeat');
    expect(result.id).toBe('heartbeat');
    expect(result.pattern).toEqual([0, 100, 150, 100, 300, 100]);
  });

  it('retorna fallback (short) para ID inválido', () => {
    const result = getVibrationById('inexistente');
    expect(result.id).toBe('short');
  });

  it('retorna fallback para undefined', () => {
    const result = getVibrationById(undefined);
    expect(result.id).toBe('short');
  });
});

describe('playVibrationPreview', () => {
  it('cancela vibração anterior e inicia nova', () => {
    playVibrationPreview('short');

    expect(Vibration.cancel).toHaveBeenCalled();
    expect(Vibration.vibrate).toHaveBeenCalledWith([0, 100]);
  });

  it('não vibra para padrão "off"', () => {
    playVibrationPreview('off');

    // Para 'off', pattern é null, então não deve chamar vibrate
    expect(Vibration.vibrate).not.toHaveBeenCalled();
  });

  it('usa fallback para ID inválido', () => {
    playVibrationPreview('naoexiste');

    // Deve usar o fallback (short) mas como pattern é válido, chama vibrate
    // Porém getVibrationById retorna 'short' como fallback
    // O playVibrationPreview verifica se pattern existe
    expect(Vibration.cancel).toHaveBeenCalled();
    expect(Vibration.vibrate).toHaveBeenCalled();
  });
});

describe('triggerHapticFeedback', () => {
  it('vibra com 15ms no Android', () => {
    triggerHapticFeedback();
    expect(Vibration.vibrate).toHaveBeenCalledWith(15);
  });
});
