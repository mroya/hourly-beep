import { useState, useEffect, useRef } from 'react';
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
  SafeAreaView,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { Feather, Ionicons } from '@expo/vector-icons';

// Services
import { performTimeSync } from './services/timeSync';
import * as BackgroundFetch from 'expo-background-fetch';
import {
  INTERVALS,
  setupNotificationChannel,
  scheduleNotifications,
  cancelAllNotifications,
  getScheduledCount,
  BACKGROUND_BIP_HEAL_TASK,
} from './services/notifications';
import { SOUNDS, playPreviewSound, getSoundById } from './services/audio';
import { usePremium, loadSettings, saveSettings } from './services/premium';

// Components
import PremiumGate from './components/PremiumGate';
import UpgradeScreen from './components/UpgradeScreen';

// Utils
import { formatClock, getCountdownText, getOffsetText, getIntervalLabel } from './utils/formatters';

// Handler global de notificações
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  // ─── Estado Core ──────────────────────────────────────────────────────────────
  const [isEnabled, setIsEnabled] = useState(false);
  const [intervalTime, setIntervalTime] = useState(3600);
  const [currentTime, setCurrentTime] = useState(new Date());

  // ─── Sincronização Temporal ───────────────────────────────────────────────────
  const [timeOffset, setTimeOffset] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [useAtomicSync, setUseAtomicSync] = useState(false);

  // ─── Premium ──────────────────────────────────────────────────────────────────
  const { isPremium, unlockPremium, restorePurchase } = usePremium();
  const [showUpgrade, setShowUpgrade] = useState(false);

  // ─── Configurações Premium ────────────────────────────────────────────────────
  const [selectedSound, setSelectedSound] = useState('beep');
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietHoursStart, setQuietHoursStart] = useState(22);
  const [quietHoursEnd, setQuietHoursEnd] = useState(7);

  // ─── Valores Derivados ────────────────────────────────────────────────────────
  const effectiveOffset = useAtomicSync ? timeOffset : 0;
  const settingsLoaded = useRef(false);

  // ─── Sync Time Wrapper ────────────────────────────────────────────────────────
  const syncTime = async (silent = false) => {
    if (isSyncing) return null;
    setIsSyncing(true);

    const { success, offset } = await performTimeSync();

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
    } else if (!silent) {
      Alert.alert(
        'Erro de Conexão',
        'Não foi possível calibrar o horário. Verifique sua conexão com a internet.'
      );
    }

    setIsSyncing(false);
    return success ? offset : null;
  };

  // ─── Persistência e Inicialização de Configurações ───────────────────────────
  useEffect(() => {
    (async () => {
      const saved = await loadSettings();
      let loadedInterval = intervalTime;
      let loadedAtomicSync = useAtomicSync;
      let loadedSound = selectedSound;
      let loadedQuietEnabled = quietHoursEnabled;
      let loadedQuietStart = quietHoursStart;
      let loadedQuietEnd = quietHoursEnd;
      let loadedEnabled = isEnabled;

      if (saved) {
        if (saved.intervalTime) { setIntervalTime(saved.intervalTime); loadedInterval = saved.intervalTime; }
        if (saved.useAtomicSync !== undefined) { setUseAtomicSync(saved.useAtomicSync); loadedAtomicSync = saved.useAtomicSync; }
        if (saved.selectedSound) { setSelectedSound(saved.selectedSound); loadedSound = saved.selectedSound; }
        if (saved.quietHoursEnabled !== undefined) { setQuietHoursEnabled(saved.quietHoursEnabled); loadedQuietEnabled = saved.quietHoursEnabled; }
        if (saved.quietHoursStart !== undefined) { setQuietHoursStart(saved.quietHoursStart); loadedQuietStart = saved.quietHoursStart; }
        if (saved.quietHoursEnd !== undefined) { setQuietHoursEnd(saved.quietHoursEnd); loadedQuietEnd = saved.quietHoursEnd; }
        if (saved.isEnabled !== undefined) { setIsEnabled(saved.isEnabled); loadedEnabled = saved.isEnabled; }
      }
      settingsLoaded.current = true;

      // Executa inicialização
      await syncTime(true);
      await setupNotificationChannel();

      const count = await getScheduledCount();

      if (loadedEnabled) {
        setIsEnabled(true);
        const threshold = loadedInterval <= 60 ? 30 : 15;
        if (count < threshold) {
          await cancelAllNotifications();
          let schedulingOffset = 0;
          if (loadedAtomicSync) {
            const syncedOffset = await performTimeSync();
            schedulingOffset = syncedOffset?.success ? syncedOffset.offset : 0;
          }
          await scheduleNotifications({
            intervalSeconds: loadedInterval,
            offset: schedulingOffset,
            soundFile: getSoundById(loadedSound).notifSound,
            quietHours: loadedQuietEnabled ? { enabled: true, start: loadedQuietStart, end: loadedQuietEnd } : null,
          });
        }
      } else {
        setIsEnabled(false);
        if (count > 0) {
          await cancelAllNotifications();
        }
      }
    })();
  }, []);

  useEffect(() => {
    if (!settingsLoaded.current) return;
    saveSettings({
      intervalTime,
      useAtomicSync,
      selectedSound,
      quietHoursEnabled,
      quietHoursStart,
      quietHoursEnd,
      isEnabled,
    });
  }, [intervalTime, useAtomicSync, selectedSound, quietHoursEnabled, quietHoursStart, quietHoursEnd, isEnabled]);

  // ─── Registro do Background Fetch ─────────────────────────────────────────────
  useEffect(() => {
    const registerBackgroundFetch = async () => {
      try {
        const isRegistered = await BackgroundFetch.isTaskRegisteredAsync(BACKGROUND_BIP_HEAL_TASK);
        if (!isRegistered) {
          await BackgroundFetch.registerTaskAsync(BACKGROUND_BIP_HEAL_TASK, {
            minimumInterval: 15 * 60, // 15 minutos (mínimo permitido por iOS/Android)
            stopOnTerminate: false,    // Continuar executando se o app for fechado
            startOnBoot: true,        // Iniciar no boot do dispositivo
          });
          console.log('[App] Background Fetch registrado com sucesso!');
        } else {
          console.log('[App] Background Fetch já estava registrado.');
        }
      } catch (err) {
        console.error('[App] Erro ao registrar Background Fetch:', err);
      }
    };
    registerBackgroundFetch();
  }, []);

  // ─── Relógio em tempo real ────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 100);
    return () => clearInterval(timer);
  }, []);

  // ─── Re-agendamento em background ────────────────────────────────────────────
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(async () => {
      if (!isEnabled || Platform.OS !== 'android') return;

      const count = await getScheduledCount();
      const threshold = intervalTime <= 60 ? 30 : 10;
      if (count < threshold) {
        await cancelAllNotifications();
        await scheduleNotifications({
          intervalSeconds: intervalTime,
          offset: effectiveOffset,
          soundFile: getSoundById(selectedSound).notifSound,
          quietHours: quietHoursEnabled ? { enabled: true, start: quietHoursStart, end: quietHoursEnd } : null,
        });
      }
    });
    return () => subscription.remove();
  }, [isEnabled, intervalTime, effectiveOffset, selectedSound, quietHoursEnabled, quietHoursStart, quietHoursEnd]);

  // ─── Toggle Bips ──────────────────────────────────────────────────────────────
  const toggleSwitch = async () => {
    try {
      if (isEnabled) {
        await cancelAllNotifications();
        setIsEnabled(false);
        Alert.alert('Desativado', 'O bip horário foi desativado.');
      } else {
        // Permissão
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

        // Sincronizar se modo atômico ativo
        let schedulingOffset = 0;
        if (useAtomicSync) {
          const syncedOffset = await syncTime(true);
          schedulingOffset = syncedOffset ?? timeOffset;
        }

        // Agendar
        await scheduleNotifications({
          intervalSeconds: intervalTime,
          offset: schedulingOffset,
          soundFile: getSoundById(selectedSound).notifSound,
          quietHours: quietHoursEnabled ? { enabled: true, start: quietHoursStart, end: quietHoursEnd } : null,
        });

        setIsEnabled(true);
        Alert.alert('Ativado', `O bip foi ativado e tocará a cada ${getIntervalLabel(intervalTime)} em ponto.`);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Erro ao Ativar', error.message || 'Ocorreu um erro desconhecido.');
    }
  };

  // ─── Helpers de modo ──────────────────────────────────────────────────────────
  const getSyncModeText = () => {
    if (useAtomicSync) return lastSyncTime ? 'NTP Compensado' : 'NTP Pendente';
    return 'Relógio do Celular';
  };

  const getQuietHoursText = () => {
    return `${quietHoursStart.toString().padStart(2, '0')}:00 — ${quietHoursEnd.toString().padStart(2, '0')}:00`;
  };

  // ─── UI ───────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

        {/* ─── Header ──────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="notifications-outline" size={36} color="#00f2fe" style={styles.bellIcon} />
            {isEnabled && <View style={styles.pulseDot} />}
          </View>
          <Text style={styles.title}>Bip Horário</Text>
          <Text style={styles.subtitle}>
            {useAtomicSync ? 'Sincronização Atômica Ativa' : 'Sincronizado com Relógio do Celular'}
          </Text>
        </View>

        {/* ─── Painel NTP (quando ativo) ───────────────────────────────── */}
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

            <View style={styles.statsContainer}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Drift do Sistema:</Text>
                <Text style={[
                  styles.statValue,
                  timeOffset === 0 && !lastSyncTime ? styles.textNeutral : (Math.abs(timeOffset) < 300 ? styles.textSuccess : styles.textWarning)
                ]}>
                  {getOffsetText(timeOffset, lastSyncTime)}
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Última Calibração:</Text>
                <Text style={styles.statValue}>
                  {lastSyncTime ? lastSyncTime.toLocaleTimeString() : 'Nunca'}
                </Text>
              </View>
            </View>

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

        {/* ─── Relógio do Celular (quando NTP desativo) ────────────────── */}
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

        {/* ─── Configurações ───────────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.row}>
              <Feather name="sliders" size={20} color="#00f2fe" />
              <Text style={styles.cardTitle}>Configurações</Text>
            </View>
            {isPremium && (
              <View style={styles.proBadge}>
                <Ionicons name="star" size={10} color="#fbbf24" />
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            )}
          </View>

          {/* Intervalo */}
          <Text style={styles.sectionSubtitle}>INTERVALO DOS ALERTAS</Text>
          <View style={styles.intervalGrid}>
            {INTERVALS.map((interval) => {
              const isActive = intervalTime === interval.seconds;
              const isLocked = interval.isPremium && !isPremium;
              return (
                <TouchableOpacity
                  key={interval.seconds}
                  style={[
                    styles.intervalButton,
                    isActive && styles.intervalActive,
                    isLocked && styles.intervalLocked,
                  ]}
                  onPress={() => {
                    if (isEnabled) return;
                    if (isLocked) { setShowUpgrade(true); return; }
                    setIntervalTime(interval.seconds);
                  }}
                  activeOpacity={isEnabled ? 1 : 0.7}
                >
                  <Text style={[
                    styles.intervalText,
                    isActive && styles.intervalTextActive,
                    isLocked && styles.intervalTextLocked,
                  ]}>
                    {interval.label}
                  </Text>
                  {isLocked && <Feather name="lock" size={10} color="#64748b" style={styles.intervalLockIcon} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Som */}
          <Text style={styles.sectionSubtitle}>SOM DO ALERTA</Text>
          <View style={styles.soundList}>
            {SOUNDS.map((sound) => {
              const isActive = selectedSound === sound.id;
              const isLocked = sound.isPremium && !isPremium;
              return (
                <TouchableOpacity
                  key={sound.id}
                  style={[styles.soundRow, isActive && styles.soundRowActive]}
                  onPress={() => {
                    if (isEnabled) return;
                    if (isLocked) { setShowUpgrade(true); return; }
                    setSelectedSound(sound.id);
                  }}
                  activeOpacity={isEnabled ? 1 : 0.7}
                >
                  <Text style={styles.soundIcon}>{sound.icon}</Text>
                  <Text style={[styles.soundName, isActive && styles.soundNameActive]}>
                    {sound.name}
                  </Text>
                  {isLocked && (
                    <View style={styles.soundLockBadge}>
                      <Feather name="lock" size={10} color="#fbbf24" />
                      <Text style={styles.soundLockText}>PRO</Text>
                    </View>
                  )}
                  {!isLocked && (
                    <TouchableOpacity
                      style={styles.soundPlayButton}
                      onPress={() => playPreviewSound(sound.id)}
                    >
                      <Feather name="play" size={14} color={isActive ? '#00f2fe' : '#64748b'} />
                    </TouchableOpacity>
                  )}
                  {isActive && !isLocked && (
                    <Feather name="check-circle" size={16} color="#10b981" style={{ marginLeft: 8 }} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Referência de Horário */}
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
                  if (value && !lastSyncTime) syncTime(true);
                }
              }}
              value={useAtomicSync}
              style={{ transform: [{ scaleX: 1.3 }, { scaleY: 1.3 }] }}
            />
          </View>

          {/* Horário Silencioso */}
          <Text style={[styles.sectionSubtitle, { marginTop: 20 }]}>HORÁRIO SILENCIOSO</Text>
          <PremiumGate isPremium={isPremium} onUpgrade={() => setShowUpgrade(true)}>
            <View style={styles.controlRow}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.statusText}>Não Perturbe</Text>
                <Text style={styles.controlSubText}>
                  {quietHoursEnabled ? getQuietHoursText() : 'Desativado'}
                </Text>
              </View>
              <Switch
                trackColor={{ false: '#243256', true: '#8b5cf6' }}
                thumbColor={quietHoursEnabled ? '#ffffff' : '#94a3b8'}
                ios_backgroundColor="#243256"
                onValueChange={(value) => {
                  if (!isEnabled && isPremium) setQuietHoursEnabled(value);
                }}
                value={quietHoursEnabled}
                style={{ transform: [{ scaleX: 1.3 }, { scaleY: 1.3 }] }}
              />
            </View>
            {quietHoursEnabled && isPremium && (
              <View style={styles.quietHoursConfig}>
                <View style={styles.hourPickerRow}>
                  <Text style={styles.hourPickerLabel}>Início:</Text>
                  <View style={styles.hourPicker}>
                    <TouchableOpacity
                      style={styles.hourButton}
                      onPress={() => !isEnabled && setQuietHoursStart(prev => (prev - 1 + 24) % 24)}
                    >
                      <Feather name="minus" size={14} color="#94a3b8" />
                    </TouchableOpacity>
                    <Text style={styles.hourValue}>{quietHoursStart.toString().padStart(2, '0')}:00</Text>
                    <TouchableOpacity
                      style={styles.hourButton}
                      onPress={() => !isEnabled && setQuietHoursStart(prev => (prev + 1) % 24)}
                    >
                      <Feather name="plus" size={14} color="#94a3b8" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.hourPickerRow}>
                  <Text style={styles.hourPickerLabel}>Fim:</Text>
                  <View style={styles.hourPicker}>
                    <TouchableOpacity
                      style={styles.hourButton}
                      onPress={() => !isEnabled && setQuietHoursEnd(prev => (prev - 1 + 24) % 24)}
                    >
                      <Feather name="minus" size={14} color="#94a3b8" />
                    </TouchableOpacity>
                    <Text style={styles.hourValue}>{quietHoursEnd.toString().padStart(2, '0')}:00</Text>
                    <TouchableOpacity
                      style={styles.hourButton}
                      onPress={() => !isEnabled && setQuietHoursEnd(prev => (prev + 1) % 24)}
                    >
                      <Feather name="plus" size={14} color="#94a3b8" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </PremiumGate>

          {/* Toggle Bips */}
          {isEnabled && (
            <Text style={styles.lockedHint}>Desative os bips para alterar as configurações</Text>
          )}

          <View style={[styles.controlRow, { marginTop: 16 }]}>
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

        {/* ─── Status do Sistema ────────────────────────────────────────── */}
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
              <Text style={styles.countdownValue}>
                {getCountdownText(currentTime, effectiveOffset, intervalTime)}
              </Text>
              <View style={styles.badgeContainer}>
                <View style={[styles.badge, styles.badgeActive]}>
                  <View style={[styles.miniDot, styles.bgSync]} />
                  <Text style={styles.badgeText}>
                    {getSyncModeText()} ({Platform.OS === 'ios' ? 'iOS' : 'Android'})
                  </Text>
                </View>
              </View>
              {quietHoursEnabled && isPremium && (
                <View style={[styles.badge, styles.badgeQuiet, { marginTop: 8 }]}>
                  <Feather name="moon" size={10} color="#8b5cf6" />
                  <Text style={styles.badgeQuietText}>Silêncio {getQuietHoursText()}</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.inactiveContainer}>
              <Feather name="alert-circle" size={32} color="#94a3b8" />
              <Text style={styles.inactiveText}>
                Ative o bip horário no painel de configurações para iniciar o cronômetro.
              </Text>
            </View>
          )}
        </View>

        {/* ─── Banner Premium (para free) ──────────────────────────────── */}
        {!isPremium && (
          <TouchableOpacity style={styles.upgradeBanner} onPress={() => setShowUpgrade(true)}>
            <View style={styles.upgradeBannerContent}>
              <Ionicons name="star" size={20} color="#fbbf24" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.upgradeBannerTitle}>Upgrade para Premium</Text>
                <Text style={styles.upgradeBannerDesc}>Sons exclusivos, intervalos custom e mais</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#fbbf24" />
            </View>
          </TouchableOpacity>
        )}

        {/* ─── Footer ──────────────────────────────────────────────────── */}
        <Text style={styles.footerText}>
          Desenvolvido com precisão atômica por Marcio Roya{'\n'}Versão 2.0.0 {isPremium ? '(Premium)' : '(Free)'}
        </Text>

      </ScrollView>

      {/* ─── Modal de Upgrade ────────────────────────────────────────── */}
      <UpgradeScreen
        visible={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        onPurchase={unlockPremium}
        onRestore={restorePurchase}
      />
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
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

  // Header
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

  // Cards
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

  // Status indicators
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
  bgSync: { backgroundColor: '#10b981' },
  bgUnsync: { backgroundColor: '#f59e0b' },
  indicatorText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  textSync: { color: '#10b981' },
  textUnsync: { color: '#f59e0b' },
  textNeutral: { color: '#94a3b8' },
  textSuccess: { color: '#10b981' },
  textWarning: { color: '#fbbf24' },

  // Clocks
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
  clockModeDescription: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
    fontWeight: '500',
  },

  // Stats
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

  // Sync button
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

  // Section
  sectionSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 1.2,
    marginBottom: 10,
  },

  // Interval grid
  intervalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  intervalButton: {
    width: '31%',
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intervalActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  intervalLocked: {
    borderColor: '#1e293b',
    opacity: 0.6,
  },
  intervalText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 13,
  },
  intervalTextActive: {
    color: '#ffffff',
  },
  intervalTextLocked: {
    color: '#475569',
  },
  intervalLockIcon: {
    marginTop: 2,
  },

  // Sound list
  soundList: {
    gap: 6,
    marginBottom: 20,
  },
  soundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  soundRowActive: {
    borderColor: 'rgba(0, 242, 254, 0.3)',
    backgroundColor: 'rgba(0, 242, 254, 0.04)',
  },
  soundIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  soundName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  soundNameActive: {
    color: '#f8fafc',
  },
  soundLockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  soundLockText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fbbf24',
    letterSpacing: 0.5,
  },
  soundPlayButton: {
    padding: 6,
  },

  // Pro badge
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fbbf24',
    letterSpacing: 0.5,
  },

  // Controls
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
  lockedHint: {
    fontSize: 11,
    color: '#f59e0b',
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '500',
    fontStyle: 'italic',
  },

  // Quiet hours
  quietHoursConfig: {
    marginTop: 12,
    backgroundColor: '#090d16',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 10,
  },
  hourPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hourPickerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
    width: 50,
  },
  hourPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hourButton: {
    backgroundColor: '#131c31',
    borderWidth: 1,
    borderColor: '#243256',
    borderRadius: 8,
    padding: 8,
  },
  hourValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8b5cf6',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    minWidth: 50,
    textAlign: 'center',
  },

  // Countdown
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
  badgeQuiet: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderColor: 'rgba(139, 92, 246, 0.15)',
    gap: 6,
  },
  badgeQuietText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8b5cf6',
  },

  // Inactive
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

  // Upgrade banner
  upgradeBanner: {
    width: '100%',
    backgroundColor: 'rgba(251, 191, 36, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.15)',
    borderRadius: 18,
    marginBottom: 20,
  },
  upgradeBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  upgradeBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fbbf24',
  },
  upgradeBannerDesc: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },

  // Footer
  footerText: {
    fontSize: 11,
    color: '#475569',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
    fontWeight: '500',
  },
});
