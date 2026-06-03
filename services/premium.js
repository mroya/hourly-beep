import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREMIUM_KEY = '@hourly_beep_premium';
const SETTINGS_KEY = '@hourly_beep_settings';

/**
 * Hook para gerenciar estado premium do usuário.
 * Futuramente integrará com RevenueCat para validação de compra real.
 */
export function usePremium() {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const value = await AsyncStorage.getItem(PREMIUM_KEY);
        setIsPremium(value === 'true');
      } catch (e) {
        console.log('Erro ao carregar status premium:', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const unlockPremium = useCallback(async () => {
    try {
      await AsyncStorage.setItem(PREMIUM_KEY, 'true');
      setIsPremium(true);
      return true;
    } catch (e) {
      console.log('Erro ao salvar status premium:', e);
      return false;
    }
  }, []);

  const restorePurchase = useCallback(async () => {
    // Placeholder para integração com RevenueCat
    // Por enquanto, verifica apenas o AsyncStorage local
    try {
      const value = await AsyncStorage.getItem(PREMIUM_KEY);
      const restored = value === 'true';
      setIsPremium(restored);
      return restored;
    } catch (e) {
      return false;
    }
  }, []);

  return { isPremium, isLoading, unlockPremium, restorePurchase };
}

/**
 * Persistência de configurações do app
 */
export async function loadSettings() {
  try {
    const value = await AsyncStorage.getItem(SETTINGS_KEY);
    return value ? JSON.parse(value) : null;
  } catch (e) {
    console.log('Erro ao carregar configurações:', e);
    return null;
  }
}

export async function saveSettings(settings) {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.log('Erro ao salvar configurações:', e);
  }
}
