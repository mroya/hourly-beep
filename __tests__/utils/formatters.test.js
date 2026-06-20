import { formatClock, getCountdownText, getOffsetText, getIntervalLabel } from '../../utils/formatters';

describe('formatClock', () => {
  it('formata corretamente com offset zero', () => {
    const date = new Date(2026, 0, 1, 14, 30, 45, 200);
    const result = formatClock(date, 0);
    expect(result).toBe('14:30:45.2');
  });

  it('aplica offset positivo corretamente', () => {
    // 14:30:45 + 1000ms = 14:30:46
    const date = new Date(2026, 0, 1, 14, 30, 45, 0);
    const result = formatClock(date, 1000);
    expect(result).toBe('14:30:46.0');
  });

  it('aplica offset negativo corretamente', () => {
    // 14:30:45 - 2000ms = 14:30:43
    const date = new Date(2026, 0, 1, 14, 30, 45, 0);
    const result = formatClock(date, -2000);
    expect(result).toBe('14:30:43.0');
  });

  it('formata com décimos de segundo corretos', () => {
    const date = new Date(2026, 0, 1, 9, 5, 3, 700);
    const result = formatClock(date, 0);
    expect(result).toBe('09:05:03.7');
  });

  it('preenche horas/minutos/segundos com zero à esquerda', () => {
    const date = new Date(2026, 0, 1, 1, 2, 3, 0);
    const result = formatClock(date, 0);
    expect(result).toBe('01:02:03.0');
  });
});

describe('getCountdownText', () => {
  it('formata countdown com horas quando > 1 hora', () => {
    // Intervalo 2h, faltando 1h30m15s
    const date = new Date(2026, 0, 1, 0, 29, 45, 0); // 29:45 em intervalo de 7200s
    const result = getCountdownText(date, 0, 7200);
    expect(result).toMatch(/1h 30m 15s/);
  });

  it('formata countdown com minutos quando < 1 hora', () => {
    // Intervalo 1h, tempo = 00:45:30 => faltam 14m30s
    const date = new Date(2026, 0, 1, 0, 45, 30, 0);
    const result = getCountdownText(date, 0, 3600);
    expect(result).toMatch(/14m 30s/);
  });

  it('formata countdown com décimos quando < 60 segundos', () => {
    // Intervalo 1min, tempo = 00:00:50.500 => faltam ~9.5s
    const date = new Date(2026, 0, 1, 0, 0, 50, 500);
    const result = getCountdownText(date, 0, 60);
    expect(result).toMatch(/09\.\ds/);
  });

  it('aplica offset no cálculo', () => {
    // Tempo local: 00:59:55, offset 0 → 5s restantes para intervalo 1h
    const date = new Date(2026, 0, 1, 0, 59, 55, 0);
    const resultNoOffset = getCountdownText(date, 0, 3600);
    expect(resultNoOffset).toMatch(/05\.\ds/);
  });
});

describe('getOffsetText', () => {
  it('exibe "Não Sincronizado" quando offset é 0 e sem sync anterior', () => {
    const result = getOffsetText(0, null);
    expect(result).toBe('Não Sincronizado');
  });

  it('exibe "Perfeitamente Sincronizado" quando offset é 0 com sync', () => {
    const result = getOffsetText(0, new Date());
    expect(result).toBe('Perfeitamente Sincronizado (0.000s)');
  });

  it('formata offset positivo corretamente', () => {
    const result = getOffsetText(1234, new Date());
    expect(result).toBe('+1.234s (1234ms)');
  });

  it('formata offset negativo corretamente', () => {
    const result = getOffsetText(-567, new Date());
    expect(result).toBe('-0.567s (567ms)');
  });
});

describe('getIntervalLabel', () => {
  it('retorna "minuto" para 60 segundos', () => {
    expect(getIntervalLabel(60)).toBe('minuto');
  });

  it('retorna "15 minutos" para 900 segundos', () => {
    expect(getIntervalLabel(900)).toBe('15 minutos');
  });

  it('retorna "hora" para 3600 segundos', () => {
    expect(getIntervalLabel(3600)).toBe('hora');
  });

  it('retorna "2 horas" para 7200 segundos', () => {
    expect(getIntervalLabel(7200)).toBe('2 horas');
  });

  it('retorna "3 horas" para 10800 segundos', () => {
    expect(getIntervalLabel(10800)).toBe('3 horas');
  });
});
