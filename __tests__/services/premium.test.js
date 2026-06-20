jest.mock('@react-native-async-storage/async-storage', () => {
  let store = {};
  return {
    getItem: jest.fn((key) => Promise.resolve(store[key] || null)),
    setItem: jest.fn((key, value) => {
      store[key] = value;
      return Promise.resolve();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
      return Promise.resolve();
    }),
    clear: jest.fn(() => {
      store = {};
      return Promise.resolve();
    }),
  };
});

global.IS_REACT_ACT_ENVIRONMENT = true;
const React = require('react');
const TestRenderer = require('react-test-renderer');
const AsyncStorage = require('@react-native-async-storage/async-storage');
const { loadSettings, saveSettings, usePremium } = require('../../services/premium');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('loadSettings', () => {
  it('retorna null quando não há dados salvos', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(null);

    const result = await loadSettings();

    expect(result).toBeNull();
    expect(AsyncStorage.getItem).toHaveBeenCalledWith('@hourly_beep_settings');
  });

  it('desserializa JSON corretamente', async () => {
    const mockSettings = {
      intervalTime: 900,
      useAtomicSync: true,
      selectedSound: 'sino',
      isEnabled: true,
    };
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(mockSettings));

    const result = await loadSettings();

    expect(result).toEqual(mockSettings);
    expect(result.intervalTime).toBe(900);
    expect(result.useAtomicSync).toBe(true);
  });

  it('retorna null em caso de erro', async () => {
    AsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage error'));

    const result = await loadSettings();

    expect(result).toBeNull();
  });

  it('retorna todas as propriedades salvas', async () => {
    const fullSettings = {
      intervalTime: 3600,
      useAtomicSync: false,
      selectedSound: 'beep',
      quietHoursEnabled: true,
      quietHoursStart: 22,
      quietHoursEnd: 7,
      isEnabled: true,
      selectedVibration: 'short',
    };
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(fullSettings));

    const result = await loadSettings();

    expect(result).toEqual(fullSettings);
    expect(result.quietHoursEnabled).toBe(true);
    expect(result.selectedVibration).toBe('short');
  });
});

describe('saveSettings', () => {
  it('serializa e persiste no AsyncStorage', async () => {
    const settings = {
      intervalTime: 3600,
      selectedSound: 'beep',
      isEnabled: false,
    };

    await saveSettings(settings);

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@hourly_beep_settings',
      JSON.stringify(settings)
    );
  });

  it('não lança erro se AsyncStorage falhar', async () => {
    AsyncStorage.setItem.mockRejectedValueOnce(new Error('Write error'));

    // Não deve lançar
    await expect(saveSettings({ test: true })).resolves.not.toThrow();
  });

  it('salva configurações completas corretamente', async () => {
    const fullSettings = {
      intervalTime: 900,
      useAtomicSync: true,
      selectedSound: 'sino',
      quietHoursEnabled: true,
      quietHoursStart: 23,
      quietHoursEnd: 6,
      isEnabled: true,
      selectedVibration: 'double',
    };

    await saveSettings(fullSettings);

    const savedValue = AsyncStorage.setItem.mock.calls[0][1];
    const parsed = JSON.parse(savedValue);
    expect(parsed).toEqual(fullSettings);
  });
});

function PremiumTestComponent() {
  const { isPremium, isLoading, unlockPremium, restorePurchase } = usePremium();
  return (
    <div>
      <span testID="loading">{isLoading ? 'loading' : 'ready'}</span>
      <span testID="premium">{isPremium ? 'premium' : 'free'}</span>
      <button testID="unlock-btn" onClick={unlockPremium}>Unlock</button>
      <button testID="restore-btn" onClick={restorePurchase}>Restore</button>
    </div>
  );
}

describe('usePremium hook', () => {
  it('inicializa com isLoading=true e isPremium=false, depois carrega do AsyncStorage', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce('true');

    let testRenderer;
    await TestRenderer.act(async () => {
      testRenderer = TestRenderer.create(<PremiumTestComponent />);
    });

    // Aguarda o useEffect/AsyncStorage carregar
    await TestRenderer.act(async () => {
      await Promise.resolve();
    });

    const loadingText = testRenderer.root.findByProps({ testID: 'loading' });
    const premiumText = testRenderer.root.findByProps({ testID: 'premium' });

    expect(loadingText.props.children).toBe('ready');
    expect(premiumText.props.children).toBe('premium');
    expect(AsyncStorage.getItem).toHaveBeenCalledWith('@hourly_beep_premium');
  });

  it('unlockPremium altera o estado para true e salva no AsyncStorage', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce('false');
    AsyncStorage.setItem.mockResolvedValueOnce();

    let testRenderer;
    await TestRenderer.act(async () => {
      testRenderer = TestRenderer.create(<PremiumTestComponent />);
    });

    await TestRenderer.act(async () => {
      await Promise.resolve();
    });

    const premiumText = testRenderer.root.findByProps({ testID: 'premium' });
    expect(premiumText.props.children).toBe('free');

    const unlockBtn = testRenderer.root.findByProps({ testID: 'unlock-btn' });
    await TestRenderer.act(async () => {
      await unlockBtn.props.onClick();
    });

    expect(premiumText.props.children).toBe('premium');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@hourly_beep_premium', 'true');
  });

  it('restorePurchase recupera status premium do AsyncStorage', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce('false'); // Primeiro get no mount
    AsyncStorage.getItem.mockResolvedValueOnce('true');  // Segundo get no restore

    let testRenderer;
    await TestRenderer.act(async () => {
      testRenderer = TestRenderer.create(<PremiumTestComponent />);
    });

    await TestRenderer.act(async () => {
      await Promise.resolve();
    });

    const premiumText = testRenderer.root.findByProps({ testID: 'premium' });
    expect(premiumText.props.children).toBe('free');

    const restoreBtn = testRenderer.root.findByProps({ testID: 'restore-btn' });
    await TestRenderer.act(async () => {
      await restoreBtn.props.onClick();
    });

    expect(premiumText.props.children).toBe('premium');
  });
});
