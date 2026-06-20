// Mock das dependências nativas
jest.mock('expo-notifications', () => ({
  setNotificationChannelAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('notif-id'),
  cancelAllScheduledNotificationsAsync: jest.fn().mockResolvedValue(),
  getAllScheduledNotificationsAsync: jest.fn().mockResolvedValue([]),
  AndroidImportance: { HIGH: 4 },
}));

jest.mock('expo-task-manager', () => ({
  defineTask: jest.fn(),
}));

jest.mock('expo-background-fetch', () => ({
  BackgroundFetchResult: {
    NewData: 'newData',
    NoData: 'noData',
    Failed: 'failed',
  },
}));

jest.mock('../../services/premium', () => ({
  loadSettings: jest.fn(),
}));

jest.mock('../../services/audio', () => ({
  getSoundById: jest.fn().mockReturnValue({ notifSound: 'beep.mp3' }),
}));

jest.mock('../../services/timeSync', () => ({
  performTimeSync: jest.fn(),
}));

jest.mock('../../services/vibration', () => ({
  getVibrationById: jest.fn().mockReturnValue({ pattern: [0, 100] }),
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
}));

const Notifications = require('expo-notifications');
const {
  setupNotificationChannel,
  scheduleNotifications,
  cancelAllNotifications,
  getScheduledCount,
  INTERVALS,
} = require('../../services/notifications');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('INTERVALS', () => {
  it('contém 6 intervalos', () => {
    expect(INTERVALS).toHaveLength(6);
  });

  it('tem intervalos free e premium', () => {
    const free = INTERVALS.filter(i => !i.isPremium);
    const premium = INTERVALS.filter(i => i.isPremium);
    expect(free.length).toBeGreaterThanOrEqual(2);
    expect(premium.length).toBeGreaterThanOrEqual(2);
  });
});

describe('setupNotificationChannel', () => {
  it('configura canal Android com som e vibração', async () => {
    await setupNotificationChannel('beep.mp3', [0, 100]);

    expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
      'hourly-beep-beep',
      expect.objectContaining({
        name: 'Hourly Beep',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'beep',
        enableVibrate: true,
        vibrationPattern: [0, 100],
      })
    );
  });

  it('desabilita vibração quando pattern é null', async () => {
    await setupNotificationChannel('beep.mp3', null);

    expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
      'hourly-beep-beep',
      expect.objectContaining({
        enableVibrate: false,
      })
    );
  });
});

describe('scheduleNotifications', () => {
  it('agenda lote de notificações no Android', async () => {
    await scheduleNotifications({
      intervalSeconds: 3600,
      offset: 0,
      soundFile: 'beep.mp3',
    });

    // Para intervalo de 1h e cobertura de 48h, devemos ter ~48 notificações
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
    const callCount = Notifications.scheduleNotificationAsync.mock.calls.length;
    expect(callCount).toBeGreaterThanOrEqual(1);
    expect(callCount).toBeLessThanOrEqual(200);
  });

  it('pula notificações dentro do horário silencioso', async () => {
    // Configurar para que o horário silencioso filtre a maioria
    await scheduleNotifications({
      intervalSeconds: 3600,
      offset: 0,
      soundFile: 'beep.mp3',
      quietHours: { enabled: true, start: 0, end: 23 },
    });

    // Com horário silencioso de 0h-23h, apenas a hora 23 deveria passar
    const withQuiet = Notifications.scheduleNotificationAsync.mock.calls.length;

    jest.clearAllMocks();

    await scheduleNotifications({
      intervalSeconds: 3600,
      offset: 0,
      soundFile: 'beep.mp3',
      quietHours: null,
    });

    const withoutQuiet = Notifications.scheduleNotificationAsync.mock.calls.length;

    expect(withQuiet).toBeLessThan(withoutQuiet);
  });

  it('configura canal de notificação antes de agendar', async () => {
    await scheduleNotifications({
      intervalSeconds: 3600,
      offset: 0,
      soundFile: 'sino.wav',
      vibrationPattern: [0, 200],
    });

    expect(Notifications.setNotificationChannelAsync).toHaveBeenCalled();
  });

  it('usa corpo de notificação correto para minutos (ex: 900s)', async () => {
    await scheduleNotifications({
      intervalSeconds: 900,
      offset: 0,
      soundFile: 'beep.mp3',
    });

    const calls = Notifications.scheduleNotificationAsync.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const content = calls[0][0].content;
    expect(content.body).toContain('minutos se passaram');
  });

  it('usa corpo de notificação correto para múltiplas horas (ex: 7200s)', async () => {
    await scheduleNotifications({
      intervalSeconds: 7200,
      offset: 0,
      soundFile: 'beep.mp3',
    });

    const calls = Notifications.scheduleNotificationAsync.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const content = calls[0][0].content;
    expect(content.body).toContain('horas se passaram');
  });

  it('suporta horário silencioso que cruza meia-noite (ex: 22h-7h)', async () => {
    await scheduleNotifications({
      intervalSeconds: 3600,
      offset: 0,
      soundFile: 'beep.mp3',
      quietHours: { enabled: true, start: 22, end: 7 },
    });

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
  });
});

describe('cancelAllNotifications', () => {
  it('cancela todas as notificações agendadas', async () => {
    await cancelAllNotifications();
    expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
  });
});

describe('getScheduledCount', () => {
  it('retorna contagem correta de notificações', async () => {
    Notifications.getAllScheduledNotificationsAsync.mockResolvedValueOnce([
      { id: '1' }, { id: '2' }, { id: '3' },
    ]);

    const count = await getScheduledCount();
    expect(count).toBe(3);
  });

  it('retorna 0 quando não há notificações', async () => {
    Notifications.getAllScheduledNotificationsAsync.mockResolvedValueOnce([]);

    const count = await getScheduledCount();
    expect(count).toBe(0);
  });
});
