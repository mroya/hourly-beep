import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Switch,
  Alert,
  Platform,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { Audio } from 'expo-av';
import { Feather, Ionicons } from '@expo/vector-icons';

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
  const [intervalTime, setIntervalTime] = useState(3600); // 3600 (1 Hour) or 60 (1 Minute)
  const [timeOffset, setTimeOffset] = useState(0); // in ms (atomicTime - systemTime)
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [useAtomicSync, setUseAtomicSync] = useState(false); // false = hora do celular (padrão)

  // Offset efetivo: 0 quando usa hora do celular, timeOffset quando usa hora atômica
  const effectiveOffset = useAtomicSync ? timeOffset : 0;

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
      // Libera memória nativa assim que o som terminar de tocar
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          sound.unloadAsync();
        }
      });
      await sound.playAsync();
    } catch (error) {
      console.log('Erro ao tocar som', error);
      Alert.alert('Erro de Áudio', 'Não foi possível tocar o arquivo beep.mp3.');
    }
  };

  // Sync with NTP/HTTP Time servers
  const syncTime = async (silent = false) => {
    if (isSyncing) return;
    setIsSyncing(true);
    
    const endpoints = [
      { url: 'https://timeapi.io/api/Time/current/zone?timeZone=UTC', type: 'timeapi' },
      { url: 'https://worldtimeapi.org/api/timezone/Etc/UTC', type: 'worldtime' }
    ];

    let success = false;
    let offset = 0;

    for (const endpoint of endpoints) {
      try {
        const start = Date.now();
        const response = await fetch(endpoint.url, { 
          headers: { 'Cache-Control': 'no-cache' },
          method: 'GET'
        });
        if (!response.ok) continue;
        const data = await response.json();
        const end = Date.now();
        const rtt = end - start;

        let serverMs = 0;
        if (endpoint.type === 'timeapi' && data.dateTime) {
          serverMs = new Date(data.dateTime + 'Z').getTime();
        } else if (endpoint.type === 'worldtime' && data.utc_datetime) {
          serverMs = new Date(data.utc_datetime).getTime();
        } else {
          continue;
        }

        // True time accounts for network latency (RTT / 2)
        const trueTime = serverMs + (rtt / 2);
        offset = trueTime - end;
        success = true;
        break; // Successfully synced!
      } catch (err) {
        console.log(`Erro ao sincronizar com ${endpoint.url}:`, err);
      }
    }

    // Tertiary Fallback using reliable Date headers
    if (!success) {
      try {
        const start = Date.now();
        const response = await fetch('https://www.cloudflare.com/cdn-cgi/trace', { method: 'HEAD' });
        const dateHeader = response.headers.get('date');
        const end = Date.now();
        if (dateHeader) {
          const serverMs = new Date(dateHeader).getTime();
          const rtt = end - start;
          const trueTime = serverMs + (rtt / 2);
          offset = trueTime - end;
          success = true;
        }
      } catch (err) {
        console.log('Erro no fallback do Cloudflare:', err);
      }
    }

    if (success) {
      setTimeOffset(offset);
      setLastSyncTime(new Date());
      if (!silent) {
        const absOffsetSec = Math.abs(offset / 1000).toFixed(3);
        const driftText = offset >= 0 
          ? `atrasado em +${absOffsetSec}s` 
          : `adiantado em -${absOffsetSec}s`;
        
        Alert.alert(
          'Calibração de Alta Precisão',
          `Conectado ao servidor atômico!\n\nSeu relógio local está ${driftText}.\n\nCompensação ativa de ${offset >= 0 ? '+' : ''}${offset}ms aplicada com sucesso!`
        );
      }
    } else {
      if (!silent) {
        Alert.alert(
          'Erro de Conexão',
          'Não foi possível calibrar o horário. Verifique sua conexão com a internet.'
        );
      }
    }
    setIsSyncing(false);
    return success ? offset : null;
  };

  // ─── Android: 1 minuto sincronizado com o relógio atômico ───────────────────
  const scheduleAndroidMinuteBips = async (offset) => {
    const now = Date.now();
    const trueNow = now + offset;
    const trueMsToNextMinute = 60000 - (trueNow % 60000);
    const firstBip = new Date(now + trueMsToNextMinute);

    const BATCH_SIZE = 120; // 2 hours of minute beeps
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
    await Promise.allSettled(promises);
  };

  // ─── Android: 1 hora sincronizada com o relógio atômico ─────────────────────
  const scheduleAndroidHourlyBips = async (offset) => {
    const now = Date.now();
    const trueNow = now + offset;
    const trueDate = new Date(trueNow);
    const msPastHour = trueDate.getMinutes() * 60000 + trueDate.getSeconds() * 1000 + trueDate.getMilliseconds();
    const trueMsToNextHour = 3600000 - msPastHour;
    const firstBip = new Date(now + trueMsToNextHour);

    const BATCH_SIZE = 48; // 2 days of hourly beeps
    const promises = [];
    for (let i = 0; i < BATCH_SIZE; i++) {
      const scheduledTime = new Date(firstBip.getTime() + i * 3600 * 1000);
      promises.push(
        Notifications.scheduleNotificationAsync({
          content: {
            title: 'Bip Horário',
            body: 'Mais uma hora se passou!',
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
    await Promise.allSettled(promises);
  };

  // Live clocks and countdown updater
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 100); // 10fps for smooth clock rendering
    return () => clearInterval(timer);
  }, []);

  // Inicialização — configura canal e verifica status das notificações
  useEffect(() => {
    const init = async () => {
      // Sincroniza em background para ter o offset disponível caso o usuário ative
      await syncTime(true);

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('hourly-beep', {
          name: 'Hourly Beep',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'beep.mp3',
        });
      }

      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const active = scheduled.length > 0;
      setIsEnabled(active);

      // Auto-reagendamento ao abrir o app (usa offset=0 por padrão = hora do celular)
      if (active && Platform.OS === 'android' && scheduled.length < 15) {
        await Notifications.cancelAllScheduledNotificationsAsync();
        if (intervalTime === 60) {
          await scheduleAndroidMinuteBips(0);
        } else {
          await scheduleAndroidHourlyBips(0);
        }
      }
    };

    init();
  }, []);

  // Real-time background rescheduling listener
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(
      async () => {
        if (!isEnabled || Platform.OS !== 'android') return;

        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        const threshold = intervalTime === 60 ? 30 : 10;
        if (scheduled.length < threshold) {
          await Notifications.cancelAllScheduledNotificationsAsync();
          if (intervalTime === 60) {
            await scheduleAndroidMinuteBips(effectiveOffset);
          } else {
            await scheduleAndroidHourlyBips(effectiveOffset);
          }
        }
      }
    );
    return () => subscription.remove();
  }, [isEnabled, intervalTime, effectiveOffset]);

  const toggleSwitch = async () => {
    try {
      if (isEnabled) {
        await Notifications.cancelAllScheduledNotificationsAsync();
        setIsEnabled(false);
        Alert.alert('Desativado', 'O bip horário foi desativado.');
      } else {
        // Request Permission
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

        // Removido o preview de som para não bipar na hora da ativação (ex: 22:12), apenas na hora cheia
        // await playSound();

        // Se sincronia atômica ativa, atualiza offset antes de agendar
        if (useAtomicSync) {
          await syncTime(true);
        }

        // Offset a ser usado no agendamento
        const schedulingOffset = useAtomicSync ? timeOffset : 0;

        // Schedule notifications
        if (Platform.OS === 'ios') {
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
          // Android: date-triggers (compensados ou não, conforme configuração)
          if (intervalTime === 3600) {
            await scheduleAndroidHourlyBips(schedulingOffset);
          } else {
            await scheduleAndroidMinuteBips(schedulingOffset);
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

  // Helper formatters
  const formatClock = (date, offset = 0) => {
    const adjustedDate = new Date(date.getTime() + offset);
    const hours = adjustedDate.getHours().toString().padStart(2, '0');
    const minutes = adjustedDate.getMinutes().toString().padStart(2, '0');
    const seconds = adjustedDate.getSeconds().toString().padStart(2, '0');
    const tenths = Math.floor(adjustedDate.getMilliseconds() / 100);
    return `${hours}:${minutes}:${seconds}.${tenths}`;
  };

  const getCountdownText = () => {
    const adjustedNow = currentTime.getTime() + effectiveOffset;
    if (intervalTime === 60) {
      const msLeft = 60000 - (adjustedNow % 60000);
      const seconds = Math.floor(msLeft / 1000);
      const tenths = Math.floor((msLeft % 1000) / 100);
      return `${seconds.toString().padStart(2, '0')}.${tenths}s`;
    } else {
      const adjustedDate = new Date(adjustedNow);
      const msPastHour = adjustedDate.getMinutes() * 60000 + adjustedDate.getSeconds() * 1000 + adjustedDate.getMilliseconds();
      const msLeft = 3600000 - msPastHour;
      const minutes = Math.floor(msLeft / 60000);
      const seconds = Math.floor((msLeft % 60000) / 1000);
      return `${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
    }
  };

  const getOffsetText = () => {
    if (timeOffset === 0 && !lastSyncTime) return 'Não Sincronizado';
    const seconds = (timeOffset / 1000).toFixed(3);
    if (timeOffset === 0) return 'Perfeitamente Sincronizado (0.000s)';
    return `${timeOffset > 0 ? '+' : ''}${seconds}s (${Math.abs(timeOffset)}ms)`;
  };

  const getSyncModeText = () => {
    if (useAtomicSync) {
      return lastSyncTime ? 'NTP Compensado' : 'NTP Pendente';
    }
    return 'Relógio do Celular';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="notifications-outline" size={36} color="#00f2fe" style={styles.bellIcon} />
            {isEnabled && <View style={styles.pulseDot} />}
          </View>
          <Text style={styles.title}>Bip Horário</Text>
          <Text style={styles.subtitle}>{useAtomicSync ? 'Sincronização Atômica Ativa' : 'Sincronizado com Relógio do Celular'}</Text>
        </View>

        {/* Live Synchronizer Panel — visível apenas quando sincronia atômica está ativa */}
        {useAtomicSync && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.row}>
                <Feather name="cpu" size={20} color="#00f2fe" />
                <Text style={styles.cardTitle}>Sincronizador Temporal</Text>
              </View>
              <View style={[styles.statusIndicator, lastSyncTime ? styles.statusSync : styles.statusUnsync]}>
                <View style={[styles.miniDot, lastSyncTime ? styles.bgSync : styles.bgUnsync]} />
                <Text style={[styles.indicatorText, lastSyncTime ? styles.textSync : styles.textUnsync]}>
                  {lastSyncTime ? 'COMPENSADO' : 'PENDENTE'}
                </Text>
              </View>
            </View>

            {/* Double Clocks */}
            <View style={styles.clocksContainer}>
              <View style={styles.clockSubCard}>
                <Text style={styles.clockLabel}>CELULAR (SISTEMA)</Text>
                <Text style={styles.clockValue}>{formatClock(currentTime, 0)}</Text>
              </View>

              <View style={styles.clockSubCardHighlight}>
                <Text style={styles.clockLabelHighlight}>RELÓGIO ATÔMICO (NTP)</Text>
                <Text style={styles.clockValueHighlight}>{formatClock(currentTime, timeOffset)}</Text>
              </View>
            </View>

            {/* Sync Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Drift do Sistema:</Text>
                <Text style={[
                  styles.statValue, 
                  timeOffset === 0 && !lastSyncTime ? styles.textNeutral : (Math.abs(timeOffset) < 300 ? styles.textSuccess : styles.textWarning)
                ]}>
                  {getOffsetText()}
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Última Calibração:</Text>
                <Text style={styles.statValue}>
                  {lastSyncTime ? lastSyncTime.toLocaleTimeString() : 'Nunca'}
                </Text>
              </View>
            </View>

            {/* Sync Button */}
            <TouchableOpacity 
              style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]} 
              onPress={() => syncTime(false)}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Feather name="refresh-cw" size={16} color="#ffffff" style={styles.buttonIcon} />
                  <Text style={styles.syncButtonText}>Calibrar com Hora Atômica</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Relógio do Celular — visível quando sincronia atômica está desativada */}
        {!useAtomicSync && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.row}>
                <Feather name="smartphone" size={20} color="#00f2fe" />
                <Text style={styles.cardTitle}>Relógio do Celular</Text>
              </View>
              <View style={[styles.statusIndicator, styles.statusSync]}>
                <View style={[styles.miniDot, styles.bgSync]} />
                <Text style={[styles.indicatorText, styles.textSync]}>ATIVO</Text>
              </View>
            </View>

            <View style={styles.clockSubCardHighlight}>
              <Text style={styles.clockLabelHighlight}>HORÁRIO DO SISTEMA</Text>
              <Text style={styles.clockValueHighlight}>{formatClock(currentTime, 0)}</Text>
            </View>

            <Text style={styles.clockModeDescription}>
              O bip tocará exatamente na hora cheia exibida no seu celular.
            </Text>
          </View>
        )}

        {/* Configuration Panel */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.row}>
              <Feather name="sliders" size={20} color="#00f2fe" />
              <Text style={styles.cardTitle}>Configurações</Text>
            </View>
          </View>

          <Text style={styles.sectionSubtitle}>INTERVALO DOS ALERTAS</Text>
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

          <Text style={styles.sectionSubtitle}>REFERÊNCIA DE HORÁRIO</Text>
          <View style={styles.controlRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.statusText}>{useAtomicSync ? 'Hora Atômica (NTP)' : 'Hora do Celular'}</Text>
              <Text style={styles.controlSubText}>
                {useAtomicSync 
                  ? 'Compensa drift do relógio via servidores NTP' 
                  : 'Bipa na hora cheia exibida no celular'}
              </Text>
            </View>
            <Switch
              trackColor={{ false: '#243256', true: '#3b82f6' }}
              thumbColor={useAtomicSync ? '#ffffff' : '#94a3b8'}
              ios_backgroundColor="#243256"
              onValueChange={(value) => {
                if (!isEnabled) {
                  setUseAtomicSync(value);
                  if (value && !lastSyncTime) {
                    syncTime(true);
                  }
                }
              }}
              value={useAtomicSync}
              style={{ transform: [{ scaleX: 1.3 }, { scaleY: 1.3 }] }}
            />
          </View>
          {isEnabled && (
            <Text style={styles.lockedHint}>Desative os bips para alterar as configurações</Text>
          )}

          <View style={styles.controlRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.statusText}>{isEnabled ? 'Bips Ativos' : 'Bips Inativos'}</Text>
              <Text style={styles.controlSubText}>
                {isEnabled ? 'Rodando em segundo plano' : 'Toques temporizadores desligados'}
              </Text>
            </View>
            <Switch
              trackColor={{ false: '#243256', true: '#10b981' }}
              thumbColor={isEnabled ? '#ffffff' : '#94a3b8'}
              ios_backgroundColor="#243256"
              onValueChange={toggleSwitch}
              value={isEnabled}
              style={{ transform: [{ scaleX: 1.3 }, { scaleY: 1.3 }] }}
            />
          </View>
        </View>

        {/* Live Countdown / Info Panel */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.row}>
              <Feather name="activity" size={20} color="#00f2fe" />
              <Text style={styles.cardTitle}>Status do Sistema</Text>
            </View>
          </View>

          {isEnabled ? (
            <View style={styles.countdownContainer}>
              <Text style={styles.countdownLabel}>PRÓXIMO BIP EM</Text>
              <Text style={styles.countdownValue}>{getCountdownText()}</Text>
              <View style={styles.badgeContainer}>
                <View style={[styles.badge, styles.badgeActive]}>
                  <View style={[styles.miniDot, styles.bgSync]} />
                  <Text style={styles.badgeText}>{getSyncModeText()} ({Platform.OS === 'ios' ? 'iOS' : 'Android'})</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.inactiveContainer}>
              <Feather name="alert-circle" size={32} color="#94a3b8" />
              <Text style={styles.inactiveText}>
                Ative o bip horário no painel de configurações para iniciar o cronômetro compensado.
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.footerText}>
          Desenvolvido com precisão atômica por Marcio Roya{'\n'}Versão 1.0.1 (Atualizado)
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  scrollContainer: {
    padding: 20,
    alignItems: 'center',
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  iconContainer: {
    position: 'relative',
    backgroundColor: '#131c31',
    padding: 16,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#243256',
    marginBottom: 16,
    shadowColor: '#00f2fe',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  bellIcon: {
    transform: [{ rotate: '5deg' }],
  },
  pulseDot: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#131c31',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#131c31',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#243256',
    padding: 20,
    width: '100%',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginLeft: 8,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusSync: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  statusUnsync: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  miniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  bgSync: {
    backgroundColor: '#10b981',
  },
  bgUnsync: {
    backgroundColor: '#f59e0b',
  },
  indicatorText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  textSync: {
    color: '#10b981',
  },
  textUnsync: {
    color: '#f59e0b',
  },
  clocksContainer: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 20,
  },
  clockSubCard: {
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  clockSubCardHighlight: {
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.25)',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#00f2fe',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  clockLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 1,
    marginBottom: 4,
  },
  clockLabelHighlight: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00f2fe',
    letterSpacing: 1,
    marginBottom: 4,
  },
  clockValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#94a3b8',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  clockValueHighlight: {
    fontSize: 24,
    fontWeight: '800',
    color: '#00f2fe',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textShadowColor: 'rgba(0, 242, 254, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  statsContainer: {
    backgroundColor: '#090d16',
    borderRadius: 14,
    padding: 12,
    gap: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f8fafc',
  },
  textSuccess: {
    color: '#10b981',
  },
  textWarning: {
    color: '#fbbf24',
  },
  textNeutral: {
    color: '#94a3b8',
  },
  syncButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    width: '100%',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  syncButtonDisabled: {
    backgroundColor: '#1d4ed8',
    opacity: 0.8,
  },
  syncButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  buttonIcon: {
    marginRight: 8,
  },
  sectionSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#090d16',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentActive: {
    backgroundColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  segmentText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 14,
  },
  segmentTextActive: {
    color: '#ffffff',
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#090d16',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
  },
  controlSubText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  countdownContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  countdownLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  countdownValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#10b981',
    fontFamily: Platform.OS === 'ios' ? 'Courier-Bold' : 'monospace',
    textShadowColor: 'rgba(16, 185, 129, 0.25)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    marginBottom: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.15)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#10b981',
  },
  inactiveContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  inactiveText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  footerText: {
    fontSize: 11,
    color: '#475569',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
    fontWeight: '500',
  },
  clockModeDescription: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
    fontWeight: '500',
  },
  lockedHint: {
    fontSize: 11,
    color: '#f59e0b',
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '500',
    fontStyle: 'italic',
  },
});
