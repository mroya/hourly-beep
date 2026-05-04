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
      Alert.alert("Erro de Áudio", "Não foi possível tocar o arquivo beep.mp3.");
    }
  };

  useEffect(() => {
    // Check if there are already scheduled notifications to sync state
    const checkStatus = async () => {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      setIsEnabled(scheduled.length > 0);
    };
    
    // Set up Android notification channel
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('hourly-beep', {
        name: 'Hourly Beep',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'beep.mp3', // Important: must match the asset filename
      });
    }

    checkStatus();
  }, []);

  const toggleSwitch = async () => {
    try {
      if (isEnabled) {
        // Cancel all notifications
        await Notifications.cancelAllScheduledNotificationsAsync();
        setIsEnabled(false);
        Alert.alert("Desativado", "O bip horário foi desativado.");
      } else {
        // Request permissions
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        if (finalStatus !== 'granted') {
          Alert.alert('Permissão Negada', 'Você precisa habilitar as notificações para usar o Bip Horário.');
          return;
        }

        // Toca o som de preview!
        await playSound();

        // Schedule notification
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Bip Horário",
            body: intervalTime === 60 ? "Mais um minuto se passou!" : "Mais uma hora se passou!",
            sound: 'beep.mp3', // Configurado para build final
          },
          trigger: {
            type: 'timeInterval', // Obrigatório nas versões mais recentes
            seconds: intervalTime, // Usando a variável (60 ou 3600)
            repeats: true,
            channelId: 'hourly-beep', // Requerido no Android se usamos canal customizado
          },
        });
        
        setIsEnabled(true);
        Alert.alert("Ativado", `O bip foi ativado e tocará a cada ${intervalTime === 60 ? 'minuto' : 'hora'}.`);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Erro ao Ativar", error.message || "Ocorreu um erro desconhecido.");
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
            <Text style={[styles.segmentText, intervalTime === 60 && styles.segmentTextActive]}>1 Minuto</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.segmentButton, intervalTime === 3600 && styles.segmentActive]}
            onPress={() => !isEnabled && setIntervalTime(3600)}
            activeOpacity={isEnabled ? 1 : 0.7}
          >
            <Text style={[styles.segmentText, intervalTime === 3600 && styles.segmentTextActive]}>1 Hora</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.controlRow}>
          <Text style={styles.statusText}>
            {isEnabled ? 'Ativo' : 'Inativo'}
          </Text>
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
    backgroundColor: '#0f172a', // Premium dark blue/slate
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
    shadowOffset: {
      width: 0,
      height: 10,
    },
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
