import { Audio } from 'expo-av';
import { Alert } from 'react-native';

/**
 * Catálogo de sons disponíveis.
 * `notifSound` é o nome do arquivo usado pelo expo-notifications.
 * `file` é o require() usado pelo expo-av para preview.
 */
export const SOUNDS = [
  {
    id: 'beep',
    name: 'Beep Clássico',
    icon: '🔔',
    isPremium: false,
    file: require('../assets/beep.mp3'),
    notifSound: 'beep.mp3',
  },
  {
    id: 'sino',
    name: 'Sino',
    icon: '🛎️',
    isPremium: true,
    file: require('../assets/sounds/sino.wav'),
    notifSound: 'sino.wav',
  },
  {
    id: 'gongo',
    name: 'Gongo',
    icon: '🎵',
    isPremium: true,
    file: require('../assets/sounds/gongo.wav'),
    notifSound: 'gongo.wav',
  },
  {
    id: 'digital',
    name: 'Digital',
    icon: '💻',
    isPremium: true,
    file: require('../assets/sounds/digital.wav'),
    notifSound: 'digital.wav',
  },
  {
    id: 'suave',
    name: 'Suave',
    icon: '🌙',
    isPremium: true,
    file: require('../assets/sounds/suave.wav'),
    notifSound: 'suave.wav',
  },
];

/**
 * Toca um som pelo ID (preview).
 * Libera a memória nativa após o playback.
 */
export async function playPreviewSound(soundId = 'beep') {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      playThroughEarpieceAndroid: false,
    });

    const soundConfig = SOUNDS.find(s => s.id === soundId) || SOUNDS[0];
    const { sound } = await Audio.Sound.createAsync(soundConfig.file);

    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) {
        sound.unloadAsync();
      }
    });

    await sound.playAsync();
  } catch (error) {
    console.log('Erro ao tocar som', error);
    Alert.alert('Erro de Áudio', 'Não foi possível tocar o som.');
  }
}

/**
 * Retorna o som pelo ID, ou o padrão (beep).
 */
export function getSoundById(id) {
  return SOUNDS.find(s => s.id === id) || SOUNDS[0];
}
