import { Component, onCleanup, onMount } from 'solid-js';
import './Header.css';
import logoSvg from '/src/assets/logo.svg';
import { LanguageSwitcher } from '@/components/foundation/LanguageSwitcher';
import { ThemeSwitcher } from '@/components/foundation/ThemeSwitcher';
import { useTranslation } from '@/i18n';
import { Bell, Menu, Search as SearchIcon, Settings as SettingsIcon } from 'lucide-solid';

interface HeaderProps {
  sidebarCollapsed?: boolean;
  onSidebarToggle?: (() => void) | undefined;
}

const Header: Component<HeaderProps> = props => {
  const { t } = useTranslation();

  // Global keyboard shortcut: Ctrl/Cmd + B to toggle sidebar
  onMount(() => {
    const handler = (e: KeyboardEvent) => {
      const isToggle = (e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B');
      if (isToggle && props.onSidebarToggle) {
        e.preventDefault();
        props.onSidebarToggle();
      }
    };
    window.addEventListener('keydown', handler);
    onCleanup(() => window.removeEventListener('keydown', handler));
  });

  return (
    <header class="app-header">
      <div class="header-left">
        <button
          class="sidebar-toggle"
          onClick={props.onSidebarToggle}
          aria-label={t('components.header.accessibility.toggleSidebar')}
          title={t('components.header.accessibility.toggleSidebar')}
        >
          <Menu size={20} />
        </button>

        <div class="header-brand">
          <div class="brand-content">
            <img src={logoSvg} alt={t('components.header.accessibility.logoAlt')} class="app-logo" />
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
            placeholder={t('components.searchBar.placeholder')}
            class="global-search"
            data-testid="search-input"
          />
          <button class="search-button" aria-label={t('common.actions.search')} title={t('common.actions.search')}>
            <SearchIcon size={18} />
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
          title={t('navigation.items.notifications', 'Notifications')}
        >
          <Bell size={20} />
        </button>

        <button class="header-action" aria-label={t('common.actions.settings')} title={t('common.actions.settings')}>
          <SettingsIcon size={20} />
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
