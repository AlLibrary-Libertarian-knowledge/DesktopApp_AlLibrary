import { Component } from 'solid-js';
import './Header.css';
import logoSvg from '/src/assets/logo.svg';
import { LanguageSwitcher } from '@/components/foundation/LanguageSwitcher';
import { ThemeSwitcher } from '@/components/foundation/ThemeSwitcher';
import { useTranslation } from '@/i18n';

interface HeaderProps {
  sidebarCollapsed?: boolean;
  onSidebarToggle?: (() => void) | undefined;
}

const Header: Component<HeaderProps> = props => {
  const { t } = useTranslation();

  return (
    <header class="app-header">
      <div class="header-left">
        <button
          class="sidebar-toggle"
          onClick={props.onSidebarToggle}
          aria-label={t('header.accessibility.toggleSidebar')}
        >
          <span class="hamburger-icon">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>

        <div class="header-brand">
          <div class="brand-content">
            <img src={logoSvg} alt={t('header.accessibility.logoAlt')} class="app-logo" />
            <div class="brand-text">
              <h1 class="app-title">AlLibrary</h1>
              <span class="app-subtitle">{t('pages.home.subtitle')}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="header-center">
        <div class="search-container">
          <input
            type="search"
            placeholder={t('pages.search.placeholder')}
            class="global-search"
            data-testid="search-input"
          />
          <button class="search-button" aria-label={t('common.actions.search')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>
        </div>
      </div>

      <div class="header-right">
        <LanguageSwitcher
          variant="compact"
          showFlags={true}
          showNativeName={false}
          size="sm"
          className="header-language-switcher"
          ariaLabel={t('common.actions.changeLanguage', 'Change language')}
        />

        <ThemeSwitcher
          variant="compact"
          size="sm"
          className="header-theme-switcher"
          ariaLabel={t('components.themeSwitcher.buttonLabel', 'Open theme selection menu')}
        />

        <button
          class="header-action"
          aria-label={t('navigation.items.notifications', 'Notifications')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>

        <button class="header-action" aria-label={t('common.actions.settings')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v6m0 6v6" />
            <path d="m21 12-6-6-6 6-6-6" />
          </svg>
        </button>

        <div class="network-status">
          <span class="status-indicator online" title={t('common.status.connected')}></span>
          <span class="network-text">{t('common.status.online')}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
