import { Platform } from 'react-native';

/**
 * Formata um Date como relógio HH:MM:SS.d com offset opcional.
 */
export function formatClock(date, offset = 0) {
  const adjustedDate = new Date(date.getTime() + offset);
  const hours = adjustedDate.getHours().toString().padStart(2, '0');
  const minutes = adjustedDate.getMinutes().toString().padStart(2, '0');
  const seconds = adjustedDate.getSeconds().toString().padStart(2, '0');
  const tenths = Math.floor(adjustedDate.getMilliseconds() / 100);
  return `${hours}:${minutes}:${seconds}.${tenths}`;
}

/**
 * Calcula e formata o countdown até o próximo bip.
 * Funciona para qualquer intervalo que divida 24h uniformemente.
 */
export function getCountdownText(currentTime, effectiveOffset, intervalSeconds) {
  const intervalMs = intervalSeconds * 1000;
  const adjustedNow = currentTime.getTime() + effectiveOffset;
  const adjustedDate = new Date(adjustedNow);

  // Total ms desde meia-noite
  const msSinceMidnight =
    adjustedDate.getHours() * 3600000 +
    adjustedDate.getMinutes() * 60000 +
    adjustedDate.getSeconds() * 1000 +
    adjustedDate.getMilliseconds();

  const msIntoInterval = msSinceMidnight % intervalMs;
  const msLeft = intervalMs - msIntoInterval;

  // Formatar baseado na magnitude
  const totalSeconds = Math.floor(msLeft / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const tenths = Math.floor((msLeft % 1000) / 100);

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
  }
  if (minutes > 0) {
    return `${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
  }
  return `${seconds.toString().padStart(2, '0')}.${tenths}s`;
}

/**
 * Formata o texto de offset do relógio.
 */
export function getOffsetText(timeOffset, lastSyncTime) {
  if (timeOffset === 0 && !lastSyncTime) return 'Não Sincronizado';
  const seconds = (timeOffset / 1000).toFixed(3);
  if (timeOffset === 0) return 'Perfeitamente Sincronizado (0.000s)';
  return `${timeOffset > 0 ? '+' : ''}${seconds}s (${Math.abs(timeOffset)}ms)`;
}

/**
 * Retorna texto do label de intervalo para exibição.
 */
export function getIntervalLabel(intervalSeconds) {
  if (intervalSeconds < 3600) {
    const min = intervalSeconds / 60;
    return min === 1 ? 'minuto' : `${min} minutos`;
  }
  const hours = intervalSeconds / 3600;
  return hours === 1 ? 'hora' : `${hours} horas`;
}
