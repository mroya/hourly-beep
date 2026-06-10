import { Vibration, Platform } from 'react-native';

/**
 * Catálogo de padrões de vibração disponíveis no app.
 * O formato é [espera, vibração, espera, vibração...] em milissegundos.
 */
export const VIBRATION_PATTERNS = [
  {
    id: 'off',
    name: 'Desativado',
    icon: '🔇',
    isPremium: false,
    pattern: null,
  },
  {
    id: 'short',
    name: 'Bip Curto',
    icon: '⚡',
    isPremium: false,
    pattern: [0, 100],
  },
  {
    id: 'double',
    name: 'Duplo Pulso',
    icon: '⏸️',
    isPremium: true,
    pattern: [0, 100, 100, 100],
  },
  {
    id: 'heartbeat',
    name: 'Batimento',
    icon: '💓',
    isPremium: true,
    pattern: [0, 100, 150, 100, 300, 100],
  },
  {
    id: 'long',
    name: 'Contínuo',
    icon: '〰️',
    isPremium: true,
    pattern: [0, 500],
  },
];

/**
 * Toca uma demonstração da vibração selecionada.
 */
export function playVibrationPreview(patternId) {
  const item = getVibrationById(patternId);
  if (!item || !item.pattern) return;

  // Cancela qualquer vibração em andamento antes de iniciar a nova
  Vibration.cancel();
  Vibration.vibrate(item.pattern);
}

/**
 * Dispara um feedback tátil sutil para cliques e interações de botão.
 */
export function triggerHapticFeedback() {
  // Vibração sutil e curta de 15 milissegundos
  if (Platform.OS === 'android') {
    Vibration.vibrate(15);
  } else {
    // No iOS o Vibration.vibrate não aceita durações arbitrárias menores que o padrão de 400ms,
    // mas ainda sim dá um feedback leve básico.
    Vibration.vibrate();
  }
}

/**
 * Retorna o padrão de vibração pelo ID ou o padrão (beep curto).
 */
export function getVibrationById(id) {
  return VIBRATION_PATTERNS.find(v => v.id === id) || VIBRATION_PATTERNS[1];
}
