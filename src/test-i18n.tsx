/**
 * Test Component for i18n System
 *
 * Simple test component to verify that the internationalization system
 * is working correctly with the language selector
 */

import { Component, onMount } from 'solid-js';
import { useTranslation, useLanguage } from './i18n/hooks';
import styles from './test-i18n.module.css';

export const I18nTestComponent: Component = () => {
  const { t, ready } = useTranslation();
  const { currentLanguage, supportedLanguages, changeLanguage } = useLanguage();

  onMount(() => {
    console.log('i18n Test Component mounted');
    console.log('Current language:', currentLanguage());
    console.log('Supported languages:', supportedLanguages());
    console.log('Translation ready:', ready());
  });

  const handleLanguageChange = async (locale: string) => {
    try {
      await changeLanguage(locale as any);
      console.log('Language changed to:', locale);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  return (
    <div class={styles.container}>
      <h2>i18n System Test</h2>

      <div class={styles.section}>
        <h3>Current Language</h3>
        <p>Locale: {currentLanguage()}</p>
        <p>Translation ready: {ready() ? 'Yes' : 'No'}</p>
      </div>

      <div class={styles.section}>
        <h3>Test Translations</h3>
        <p>{t('common.actions.save')}</p>
        <p>{t('common.actions.cancel')}</p>
        <p>{t('common.status.loading')}</p>
        <p>{t('navigation.main.home')}</p>
      </div>

      <div class={styles.section}>
        <h3>Language Selector</h3>
        <div class={styles.languageButtons}>
          {supportedLanguages().map(lang => (
            <button
              class={`${styles.languageButton} ${
                currentLanguage() === lang.code ? styles.active : ''
              }`}
              onClick={() => handleLanguageChange(lang.code)}
            >
              {lang.flag} {lang.nativeName}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
