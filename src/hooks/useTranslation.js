import { useAppSettings } from '../hooks/useAppSettings.js';
import { getTranslation } from '../i18n/translations.js';

/**
 * Hook to use translations
 */
export function useTranslation() {
  const settings = useAppSettings();
  
  return {
    t: (key) => getTranslation(key, settings.language),
    language: settings.language
  };
}
