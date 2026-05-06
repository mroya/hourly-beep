import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Switch, Alert, Platform, TouchableOpacity } from 'react-native';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { Audio } from 'expo-av';

// Set handler to always show the notification and play the sound
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [intervalTime, setIntervalTime] = useState(3600); // 3600 ou 60

  const playSound = async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        playThroughEarpieceAndroid: false,
      });
      const { sound } = await Audio.Sound.createAsync(
        require('./assets/beep.mp3')
      );
      await sound.playAsync();
    } catch (error) {
      console.log('Erro ao tocar som', error);
      Alert.alert('Erro de Áudio', 'Não foi possível tocar o arquivo beep.mp3.');
    }
  };

  // ─── Android: 1 minuto sincronizado com o relógio ──────────────────────────
  // Calcula o próximo segundo :00 do próximo minuto e agenda um lote de
  // date-triggers em horários exatos (ex: 14:01:00, 14:02:00, 14:03:00…).
  // Isso elimina o problema do timeInterval que contava a partir da ativação.
  const scheduleAndroidMinuteBips = async () => {
    const now = new Date();

    // Ms restantes até o próximo minuto cheio (ex: 14:01:00.000)
    const msToNextMinute =
      (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    const firstBip = new Date(now.getTime() + msToNextMinute);

    // Agenda 120 notificações = 2 horas de bips por minuto
    const BATCH_SIZE = 120;
    const promises = [];
    for (let i = 0; i < BATCH_SIZE; i++) {
      const scheduledTime = new Date(firstBip.getTime() + i * 60 * 1000);
      promises.push(
        Notifications.scheduleNotificationAsync({
          content: {
            title: 'Bip Horário',
            body: 'Mais um minuto se passou!',
            sound: 'beep.mp3',
          },
          trigger: {
            type: 'date',
            date: scheduledTime,
            channelId: 'hourly-beep',
          },
        })
      );
    }
    await Promise.all(promises);
  };

  // ─── Android: 1 hora sincronizada com o relógio ────────────────────────────
  // Agenda 24 notificações diárias, uma para cada hora (00:00, 01:00, …23:00).
  const scheduleAndroidHourlyBips = async () => {
    const promises = [];
    for (let i = 0; i < 24; i++) {
      promises.push(
        Notifications.scheduleNotificationAsync({
          content: {
            title: 'Bip Horário',
            body: 'Mais uma hora se passou!',
            sound: 'beep.mp3',
          },
          trigger: {
            type: 'daily',
            hour: i,
            minute: 0,
            channelId: 'hourly-beep',
          },
        })
      );
    }
    await Promise.all(promises);
  };

  useEffect(() => {
    // Configura o canal de notificação no Android
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('hourly-beep', {
        name: 'Hourly Beep',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'beep.mp3',
      });
    }

    // Verifica o estado ao abrir o app e reagenda se o lote estiver acabando
    const checkStatus = async () => {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const active = scheduled.length > 0;
      setIsEnabled(active);

      // Auto-reagendamento ao abrir o app (modo 1 min no Android)
      if (
        active &&
        intervalTime === 60 &&
        Platform.OS === 'android' &&
        scheduled.length < 30
      ) {
        await Notifications.cancelAllScheduledNotificationsAsync();
        await scheduleAndroidMinuteBips();
      }
    };

    checkStatus();
  }, []);

  // ─── Listener: reagenda em tempo real quando o lote estiver acabando ───────
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(
      async () => {
        if (!isEnabled || intervalTime !== 60 || Platform.OS !== 'android') return;

        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        if (scheduled.length < 30) {
          // Reagenda um lote novo começando no próximo minuto cheio
          await Notifications.cancelAllScheduledNotificationsAsync();
          await scheduleAndroidMinuteBips();
        }
      }
    );
    return () => subscription.remove();
  }, [isEnabled, intervalTime]);

  const toggleSwitch = async () => {
    try {
      if (isEnabled) {
        await Notifications.cancelAllScheduledNotificationsAsync();
        setIsEnabled(false);
        Alert.alert('Desativado', 'O bip horário foi desativado.');
      } else {
        // Solicita permissão
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          Alert.alert(
            'Permissão Negada',
            'Você precisa habilitar as notificações para usar o Bip Horário.'
          );
          return;
        }

        // Toca o som de preview
        await playSound();

        // Agenda as notificações
        if (Platform.OS === 'ios') {
          // iOS: suporta calendar trigger nativamente
          const trigger =
            intervalTime === 60
              ? { type: 'calendar', second: 0, repeats: true }
              : { type: 'calendar', minute: 0, second: 0, repeats: true };

          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Bip Horário',
              body:
                intervalTime === 60
                  ? 'Mais um minuto se passou!'
                  : 'Mais uma hora se passou!',
              sound: 'beep.mp3',
            },
            trigger,
          });
        } else {
          // Android: não suporta calendar trigger — usa estratégias específicas
          if (intervalTime === 3600) {
            // 1 hora: 24 triggers diários sincronizados (00:00, 01:00, …)
            await scheduleAndroidHourlyBips();
          } else {
            // 1 minuto: lote de date-triggers nos segundos :00 exatos de cada minuto
            await scheduleAndroidMinuteBips();
          }
        }

        setIsEnabled(true);
        Alert.alert(
          'Ativado',
          `O bip foi ativado e tocará a cada ${
            intervalTime === 60 ? 'minuto' : 'hora'
          } em ponto.`
        );
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Erro ao Ativar', error.message || 'Ocorreu um erro desconhecido.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.card}>
        <Text style={styles.title}>Bip Horário</Text>
        <Text style={styles.subtitle}>
          Escolha o intervalo e seja notificado.
        </Text>

        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[styles.segmentButton, intervalTime === 60 && styles.segmentActive]}
            onPress={() => !isEnabled && setIntervalTime(60)}
            activeOpacity={isEnabled ? 1 : 0.7}
          >
            <Text style={[styles.segmentText, intervalTime === 60 && styles.segmentTextActive]}>
              1 Minuto
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentButton, intervalTime === 3600 && styles.segmentActive]}
            onPress={() => !isEnabled && setIntervalTime(3600)}
            activeOpacity={isEnabled ? 1 : 0.7}
          >
            <Text style={[styles.segmentText, intervalTime === 3600 && styles.segmentTextActive]}>
              1 Hora
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.controlRow}>
          <Text style={styles.statusText}>{isEnabled ? 'Ativo' : 'Inativo'}</Text>
          <Switch
            trackColor={{ false: '#3e3e3e', true: '#4ade80' }}
            thumbColor={isEnabled ? '#ffffff' : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
            onValueChange={toggleSwitch}
            value={isEnabled}
            style={{ transform: [{ scaleX: 1.5 }, { scaleY: 1.5 }] }}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#1e293b',
    padding: 32,
    borderRadius: 24,
    width: '85%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 4,
    marginBottom: 32,
    width: '100%',
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentActive: {
    backgroundColor: '#3b82f6',
  },
  segmentText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 16,
  },
  segmentTextActive: {
    color: '#ffffff',
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#0f172a',
    borderRadius: 16,
  },
  statusText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#f8fafc',
  },
});
