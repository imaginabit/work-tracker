import { useState, useEffect } from 'react';

const SETTINGS_KEY = 'work-tracker-settings';

const DEFAULT_SETTINGS = {
  showSaturday: false,
  showSunday: false,
  workStartHour: 9,
  workEndHour: 18
};

export function useSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return { settings, updateSetting };
}

export { DEFAULT_SETTINGS };
