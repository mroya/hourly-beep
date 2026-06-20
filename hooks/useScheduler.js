import { useEffect, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { useAppState, useAppDispatch, ACTIONS } from '../contexts/AppContext';
import {
  setupNotificationChannel,
  scheduleNotifications,
  cancelAllNotifications,
  getScheduledCount,
  BACKGROUND_BIP_HEAL_TASK,
} from '../services/notifications';
import { getSoundById } from '../services/audio';
import { getVibrationById } from '../services/vibration';
import { performTimeSync } from '../services/timeSync';
import { getIntervalLabel } from '../utils/formatters';
import { triggerHapticFeedback } from '../services/vibration';
import { trackEvent, EVENTS } from '../services/analytics';

/**
 * Hook que gerencia todo o agendamento de notificações:
 * - Inicialização (verificar contagem, re-agendar)
 * - Toggle on/off
 * - Re-agendamento em background via listener
 * - Registro do BackgroundFetch
 */
export function useScheduler() {
  const state = useAppState();
  const dispatch = useAppDispatch();

  const {
    isEnabled,
    intervalTime,
    useAtomicSync,
    timeOffset,
    selectedSound,
    selectedVibration,
    quietHoursEnabled,
    quietHoursStart,
    quietHoursEnd,
    isPremium,
  } = state;

  const effectiveOffset = useAtomicSync ? timeOffset : 0;

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const getScheduleParams = useCallback((overrides = {}) => ({
    intervalSeconds: overrides.intervalSeconds || intervalTime,
    offset: overrides.offset !== undefined ? overrides.offset : effectiveOffset,
    soundFile: getSoundById(overrides.selectedSound || selectedSound).notifSound,
    vibrationPattern: getVibrationById(overrides.selectedVibration || selectedVibration).pattern,
    quietHours: (overrides.quietHoursEnabled !== undefined ? overrides.quietHoursEnabled : quietHoursEnabled)
      ? {
          enabled: true,
          start: overrides.quietHoursStart !== undefined ? overrides.quietHoursStart : quietHoursStart,
          end: overrides.quietHoursEnd !== undefined ? overrides.quietHoursEnd : quietHoursEnd,
        }
      : null,
  }), [intervalTime, effectiveOffset, selectedSound, selectedVibration, quietHoursEnabled, quietHoursStart, quietHoursEnd]);

  // ─── Inicialização ─────────────────────────────────────────────────────────
  const initializeScheduler = useCallback(async (loadedSettings) => {
    const settings = loadedSettings || {};
    const loadedInterval = settings.intervalTime || intervalTime;
    const loadedSound = settings.selectedSound || selectedSound;
    const loadedVibration = settings.selectedVibration || selectedVibration;
    const loadedEnabled = settings.isEnabled !== undefined ? settings.isEnabled : isEnabled;
    const loadedAtomicSync = settings.useAtomicSync !== undefined ? settings.useAtomicSync : useAtomicSync;
    const loadedQuietEnabled = settings.quietHoursEnabled !== undefined ? settings.quietHoursEnabled : quietHoursEnabled;
    const loadedQuietStart = settings.quietHoursStart !== undefined ? settings.quietHoursStart : quietHoursStart;
    const loadedQuietEnd = settings.quietHoursEnd !== undefined ? settings.quietHoursEnd : quietHoursEnd;

    await setupNotificationChannel(
      getSoundById(loadedSound).notifSound,
      getVibrationById(loadedVibration).pattern
    );

    const count = await getScheduledCount();

    if (loadedEnabled) {
      dispatch({ type: ACTIONS.SET_ENABLED, payload: true });
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
          vibrationPattern: getVibrationById(loadedVibration).pattern,
          quietHours: loadedQuietEnabled
            ? { enabled: true, start: loadedQuietStart, end: loadedQuietEnd }
            : null,
        });
      }
    } else {
      dispatch({ type: ACTIONS.SET_ENABLED, payload: false });
      if (count > 0) {
        await cancelAllNotifications();
      }
    }
  }, [dispatch]);

  // ─── Toggle Bips ───────────────────────────────────────────────────────────
  const toggleBeeps = useCallback(async (syncTimeFn) => {
    triggerHapticFeedback();
    try {
      if (isEnabled) {
        await cancelAllNotifications();
        dispatch({ type: ACTIONS.SET_ENABLED, payload: false });
        Alert.alert('Desativado', 'O bip horário foi desativado.');

        trackEvent(EVENTS.BEEP_DEACTIVATED, { intervalTime });
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
        if (useAtomicSync && syncTimeFn) {
          const syncedOffset = await syncTimeFn(true);
          schedulingOffset = syncedOffset ?? timeOffset;
        }

        // Agendar
        await scheduleNotifications({
          ...getScheduleParams({ offset: schedulingOffset }),
        });

        dispatch({ type: ACTIONS.SET_ENABLED, payload: true });
        Alert.alert('Ativado', `O bip foi ativado e tocará a cada ${getIntervalLabel(intervalTime)} em ponto.`);

        trackEvent(EVENTS.BEEP_ACTIVATED, {
          intervalTime,
          useAtomicSync,
          selectedSound,
          quietHoursEnabled,
        });
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Erro ao Ativar', error.message || 'Ocorreu um erro desconhecido.');
    }
  }, [isEnabled, intervalTime, useAtomicSync, timeOffset, selectedSound, quietHoursEnabled, dispatch, getScheduleParams]);

  // ─── Re-agendamento via listener de notificação ───────────────────────────
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(async () => {
      if (!isEnabled || Platform.OS !== 'android') return;

      const count = await getScheduledCount();
      const threshold = intervalTime <= 60 ? 30 : 10;
      if (count < threshold) {
        await cancelAllNotifications();
        await scheduleNotifications(getScheduleParams());
      }
    });
    return () => subscription.remove();
  }, [isEnabled, intervalTime, effectiveOffset, selectedSound, quietHoursEnabled, quietHoursStart, quietHoursEnd, getScheduleParams]);

  // ─── Registro do Background Fetch ─────────────────────────────────────────
  useEffect(() => {
    const registerBackgroundFetch = async () => {
      try {
        const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_BIP_HEAL_TASK);
        if (!isRegistered) {
          await BackgroundFetch.registerTaskAsync(BACKGROUND_BIP_HEAL_TASK, {
            minimumInterval: 15 * 60,
            stopOnTerminate: false,
            startOnBoot: true,
          });
          console.log('[Scheduler] Background Fetch registrado com sucesso!');
        }
      } catch (err) {
        console.error('[Scheduler] Erro ao registrar Background Fetch:', err);
      }
    };
    registerBackgroundFetch();
  }, []);

  return {
    toggleBeeps,
    initializeScheduler,
  };
}
