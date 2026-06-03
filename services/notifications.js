import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Intervalos disponíveis no app.
 */
export const INTERVALS = [
  { seconds: 60, label: '1 Min', isPremium: false },
  { seconds: 900, label: '15 Min', isPremium: true },
  { seconds: 1800, label: '30 Min', isPremium: true },
  { seconds: 3600, label: '1 Hora', isPremium: false },
  { seconds: 7200, label: '2 Horas', isPremium: true },
  { seconds: 10800, label: '3 Horas', isPremium: true },
];

/**
 * Configura o canal de notificação no Android.
 */
export async function setupNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('hourly-beep', {
      name: 'Hourly Beep',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'beep.mp3',
    });
  }
}

/**
 * Verifica se um horário está dentro do período silencioso.
 * Suporta ranges que cruzam meia-noite (ex: 22h-7h).
 */
function isInQuietHours(hour, startHour, endHour) {
  if (startHour === endHour) return false;
  if (startHour > endHour) {
    // Cruza meia-noite: 22-7 = silêncio de 22:00 até 06:59
    return hour >= startHour || hour < endHour;
  }
  // Mesmo dia: 13-17 = silêncio de 13:00 até 16:59
  return hour >= startHour && hour < endHour;
}

/**
 * Gera a mensagem de notificação baseada no intervalo.
 */
function getNotificationBody(intervalSeconds) {
  if (intervalSeconds <= 60) return 'Mais um minuto se passou!';
  if (intervalSeconds < 3600) {
    const min = intervalSeconds / 60;
    return `${min} minutos se passaram!`;
  }
  if (intervalSeconds === 3600) return 'Mais uma hora se passou!';
  const hours = intervalSeconds / 3600;
  return `${hours} horas se passaram!`;
}

/**
 * Função unificada de agendamento de notificações.
 * Suporta qualquer intervalo, compensação NTP, horário silencioso e som customizado.
 */
export async function scheduleNotifications({
  intervalSeconds,
  offset = 0,
  soundFile = 'beep.mp3',
  quietHours = null,
}) {
  const intervalMs = intervalSeconds * 1000;
  const now = Date.now();
  const adjustedNow = now + offset;

  // iOS pode usar calendar trigger para intervalos padrão (sem quiet hours)
  const canUseCalendarTrigger =
    Platform.OS === 'ios' &&
    (intervalSeconds === 60 || intervalSeconds === 3600) &&
    !quietHours?.enabled;

  if (canUseCalendarTrigger) {
    const trigger =
      intervalSeconds === 60
        ? { type: 'calendar', second: 0, repeats: true }
        : { type: 'calendar', minute: 0, second: 0, repeats: true };

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Bip Horário',
        body: getNotificationBody(intervalSeconds),
        sound: soundFile,
      },
      trigger,
    });
    return;
  }

  // Date-based batch scheduling (Android + iOS com intervalos custom)
  const adjustedDate = new Date(adjustedNow);
  const msSinceMidnight =
    adjustedDate.getHours() * 3600000 +
    adjustedDate.getMinutes() * 60000 +
    adjustedDate.getSeconds() * 1000 +
    adjustedDate.getMilliseconds();

  const msIntoInterval = msSinceMidnight % intervalMs;
  const msToNext = intervalMs - msIntoInterval;
  const firstBip = new Date(now + msToNext);

  // Batch size: cobertura de ~2 dias, respeitando limites da plataforma
  const maxBatch = Platform.OS === 'ios' ? 60 : 200;
  const batchSize = Math.min(maxBatch, Math.ceil((48 * 3600000) / intervalMs));

  const promises = [];
  for (let i = 0; i < batchSize; i++) {
    const scheduledTime = new Date(firstBip.getTime() + i * intervalMs);

    // Pular horário silencioso
    if (quietHours?.enabled) {
      const hour = scheduledTime.getHours();
      if (isInQuietHours(hour, quietHours.start, quietHours.end)) {
        continue;
      }
    }

    promises.push(
      Notifications.scheduleNotificationAsync({
        content: {
          title: 'Bip Horário',
          body: getNotificationBody(intervalSeconds),
          sound: soundFile,
        },
        trigger: {
          type: 'date',
          date: scheduledTime,
          ...(Platform.OS === 'android' ? { channelId: 'hourly-beep' } : {}),
        },
      })
    );
  }

  await Promise.allSettled(promises);
}

/**
 * Cancela todas as notificações agendadas.
 */
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Retorna o número de notificações agendadas.
 */
export async function getScheduledCount() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.length;
}
