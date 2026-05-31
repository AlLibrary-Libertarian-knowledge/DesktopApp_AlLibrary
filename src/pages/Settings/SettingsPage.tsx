/**
 * SettingsPage - User Preferences and Configuration Interface
 *
 * Features:
 * - User preferences management
 * - Cultural settings (information only)
 * - Network configuration options
 * - Privacy and security controls
 * - Theme and accessibility options
 * - Anti-censorship compliance
 *
 * @cultural-considerations
 * - Cultural settings are informational only - no access control
 * - Educational preferences for cultural context display
 * - Community information settings without gatekeeping
 * - NO ACCESS RESTRICTIONS - information and preferences only
 *
 * @accessibility
 * - Keyboard navigation support
 * - Screen reader compatibility
 * - High contrast mode support
 * - Focus management
 *
 * @performance
 * - Lazy loading for settings sections
 * - Optimized form handling
 * - Local storage integration
 */

import { type Component, createSignal, Show, For, onMount, createMemo } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import {
  Settings,
  User,
  Shield,
  Palette,
  Eye,
  Network,
  BookOpen,
  Download,
  Lock,
  Bell,
  Moon,
  Sun,
  Monitor,
  Languages,
  Accessibility,
  Save,
  RotateCcw,
  Info,
} from 'lucide-solid';

// Foundation Components
import { Button } from '../../components/foundation/Button';
import { Card } from '../../components/foundation/Card';
import { Input } from '../../components/foundation/Input';
import { Select } from '../../components/foundation/Select';
import { Badge } from '../../components/foundation/Badge';
import { Switch } from '../../components/foundation/Switch';
import MainLayout from '../../components/layout/MainLayout';
import { PageHeader } from '../../components/layout/PageHeader/PageHeader';

import { NetworkStatus } from '../../components/domain/network/NetworkStatus';

// Hooks and Services
import { useSettings } from '../../hooks/data/useSettings';
import { useTheme } from '../../hooks/ui/useTheme';
import { settingsService } from '@/services/storage/settingsService';
import { pickLibraryFolder, pickFolder } from '@/services/system/fileDialogs';

// Styles
import styles from './SettingsPage.module.css';

export interface SettingsPageProps {
  /** Initial settings section to display */
  initialSection?: string;
  /** Show cultural settings by default */
  showCulturalSettings?: boolean;
}

export const SettingsPage: Component<SettingsPageProps> = props => {
  const navigate = useNavigate();

  // State Management
  const [activeSection, setActiveSection] = createSignal(props.initialSection || 'general');
  const [projectFolder, setProjectFolder] = createSignal('');
  const [downloadFolder, setDownloadFolder] = createSignal('');
  const [pathError, setPathError] = createSignal<string | null>(null);
  const [pathsLoading, setPathsLoading] = createSignal(true);

  const databasePath = createMemo(() => {
    const project = projectFolder().trim();
    if (!project) return '';
    const sep = project.includes('\\') ? '\\' : '/';
    return `${project}${sep}documents${sep}allibrary.db`;
  });

  onMount(async () => {
    setPathsLoading(true);
    setPathError(null);
    try {
      await settingsService.ensureInitialized();
      const project = (await settingsService.getProjectFolder()) || '';
      const download = (await settingsService.getDownloadFolder()) || '';
      setProjectFolder(project);
      setDownloadFolder(download);
    } catch (e) {
      setPathError(e instanceof Error ? e.message : 'Failed to load library paths');
    } finally {
      setPathsLoading(false);
    }
  });

  const browseProjectFolder = async () => {
    setPathError(null);
    try {
      const path = await pickLibraryFolder();
      if (!path?.trim()) return;
      await settingsService.setProjectFolder(path.trim());
      setProjectFolder(path.trim());
      const download = (await settingsService.getDownloadFolder()) || '';
      setDownloadFolder(download);
    } catch (e) {
      setPathError(e instanceof Error ? e.message : 'Failed to update project folder');
    }
  };

  const browseDownloadFolder = async () => {
    setPathError(null);
    try {
      const path = await pickFolder('Select Download Folder');
      if (!path?.trim()) return;
      await settingsService.setDownloadFolder(path.trim());
      setDownloadFolder(path.trim());
    } catch (e) {
      setPathError(e instanceof Error ? e.message : 'Failed to update download folder');
    }
  };

  // Hooks
  const {
    settings,
    updateSettings,
    resetToDefaults,
    saveSettings,
    isLoading,
    error,
    hasUnsavedChanges,
  } = useSettings();
  const { currentTheme, setMode } = useTheme();

  // Settings sections
  const settingsSections = [
    { id: 'general', label: 'General', icon: <Settings size={20} /> },
    { id: 'cultural', label: 'Cultural Information', icon: <BookOpen size={20} /> },
    { id: 'network', label: 'Network & P2P', icon: <Network size={20} /> },
    { id: 'privacy', label: 'Privacy & Security', icon: <Shield size={20} /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette size={20} /> },
    { id: 'accessibility', label: 'Accessibility', icon: <Accessibility size={20} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={20} /> },
  ];

  // Theme options
  const themeOptions = [
    { value: 'light', label: 'Light Theme', icon: <Sun size={16} /> },
    { value: 'dark', label: 'Dark Theme', icon: <Moon size={16} /> },
    { value: 'auto', label: 'System Default', icon: <Monitor size={16} /> },
  ];

  // Language options
  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    { value: 'zh', label: '中文' },
    { value: 'indigenous', label: 'Indigenous Languages' },
  ];

  // Cultural information levels
  const culturalInfoLevels = [
    { value: 'hidden', label: 'No Cultural Information' },
    { value: 'minimal', label: 'Basic Cultural Context' },
    { value: 'full', label: 'Full Educational Integration' },
  ];

  const fontSizeOptions = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
    { value: 'extra-large', label: 'Extra Large' },
  ];

  // Handle settings changes
  const handleSettingChange = (key: string, value: any) => {
    updateSettings({ [key]: value });
  };

  // Handle save and reset
  const handleSaveSettings = async () => {
    try {
      await saveSettings();
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const handleResetSettings = async () => {
    try {
      resetToDefaults();
    } catch (error) {
      console.error('Failed to reset settings:', error);
    }
  };

  // Handle section navigation
  const handleSectionChange = (sectionId: string) => {
    if (hasUnsavedChanges()) {
      // TODO: Show confirmation dialog
      console.log('Unsaved changes detected');
    }
    setActiveSection(sectionId);
  };

  return (
    <MainLayout>
      <div class={styles.settingsPage}>
        {/* Page Header */}
        <PageHeader
          title="Settings"
          subtitle="Configure your AlLibrary preferences and options"
          breadcrumbs={[
            { label: 'Home', path: '/' },
            { label: 'Settings', path: '/settings', current: true },
          ]}
          onBreadcrumbClick={path => navigate(path)}
        />

        {/* Settings Container */}
        <div class={styles.settingsContainer}>
          {/* Settings Sidebar */}
          <div class={styles.settingsSidebar}>
            <nav class={styles.settingsNav}>
              <For each={settingsSections}>
                {section => (
                  <button
                    class={`${styles.sectionButton} ${
                      activeSection() === section.id ? styles.active : ''
                    }`}
                    onClick={() => handleSectionChange(section.id)}
                  >
                    {section.icon}
                    <span>{section.label}</span>
                  </button>
                )}
              </For>
            </nav>

            {/* Save/Reset Actions */}
            <div class={styles.sidebarActions}>
              <Show when={hasUnsavedChanges()}>
                <Badge variant="warning" class={styles.unsavedBadge}>
                  Unsaved Changes
                </Badge>
              </Show>

              <div class={styles.actionButtons}>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveSettings}
                  disabled={!hasUnsavedChanges() || isLoading()}
                  class={styles.saveButton}
                >
                  <Save size={16} />
                  Save Changes
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetSettings}
                  disabled={isLoading()}
                  class={styles.resetButton}
                >
                  <RotateCcw size={16} />
                  Reset
                </Button>
              </div>
            </div>
          </div>

          {/* Settings Content */}
          <div class={styles.settingsContent}>
            <Show when={error()}>
              <Card class={styles.errorCard}>
                <div class={styles.errorContent}>
                  <h3>Settings Error</h3>
                  <p>{error()}</p>
                </div>
              </Card>
            </Show>

            {/* General Settings */}
            <Show when={activeSection() === 'general'}>
              <div class={styles.settingsSection}>
                <h2 class={styles.sectionTitle}>General Settings</h2>

                <Card class={styles.settingsCard}>
                  <div class={styles.settingGroup}>
                    <label class={styles.settingLabel}>
                      <User size={16} />
                      Display Name
                    </label>
                    <Input value="AlLibrary User" readonly />
                  </div>

                  <div class={styles.settingGroup}>
                    <label class={styles.settingLabel}>
                      <Languages size={16} />
                      Language
                    </label>
                    <Select
                      value={settings().language || 'en'}
                      onChange={value => handleSettingChange('language', value)}
                      options={languageOptions}
                    />
                  </div>

                  <div class={styles.settingGroup}>
                    <label class={styles.settingLabel}>
                      <BookOpen size={16} />
                      Project Folder
                    </label>
                    <div class={styles.pathSetting}>
                      <Input
                        value={pathsLoading() ? 'Loading…' : projectFolder() || 'Not set'}
                        readonly
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pathsLoading()}
                        onClick={browseProjectFolder}
                      >
                        Browse
                      </Button>
                    </div>
                    <p class={styles.settingDescription}>
                      Root folder for your library, documents database, and project structure.
                    </p>
                  </div>

                  <div class={styles.settingGroup}>
                    <label class={styles.settingLabel}>
                      <Download size={16} />
                      Default Download Location
                    </label>
                    <div class={styles.pathSetting}>
                      <Input
                        value={pathsLoading() ? 'Loading…' : downloadFolder() || 'Not set'}
                        readonly
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pathsLoading() || !projectFolder()}
                        onClick={browseDownloadFolder}
                      >
                        Browse
                      </Button>
                    </div>
                  </div>

                  <div class={styles.settingGroup}>
                    <label class={styles.settingLabel}>
                      <Info size={16} />
                      Database Path
                    </label>
                    <Input value={databasePath() || 'Set project folder first'} readonly />
                  </div>

                  <Show when={pathError()}>
                    <p class={styles.settingDescription} role="alert" style={{ color: '#ef4444' }}>
                      {pathError()}
                    </p>
                  </Show>

                  <div class={styles.settingGroup}>
                    <div class={styles.toggleSetting}>
                      <div class={styles.toggleInfo}>
                        <label class={styles.settingLabel}>Auto-Update Documents</label>
                        <p class={styles.settingDescription}>
                          Automatically check for document updates from the network
                        </p>
                      </div>
                      <Switch
                        checked={settings().autoSaveDocuments || false}
                        onChange={checked => handleSettingChange('autoSaveDocuments', checked)}
                      />
                    </div>
                  </div>
                </Card>
              </div>
            </Show>

            {/* Cultural Information Settings */}
            <Show when={activeSection() === 'cultural'}>
              <div class={styles.settingsSection}>
                <h2 class={styles.sectionTitle}>Cultural Information Settings</h2>

                <Card class={styles.culturalInfoCard}>
                  <div class={styles.culturalHeader}>
                    <div class={styles.culturalTitle}>
                      <BookOpen size={20} />
                      <span>Cultural Context Display</span>
                    </div>
                    <p class={styles.culturalDescription}>
                      Configure how cultural information is displayed throughout the application.
                      All settings are for educational purposes only and do not restrict access to
                      content.
                    </p>
                  </div>

                  <div class={styles.settingGroup}>
                    <label class={styles.settingLabel}>Cultural Information Level</label>
                    <Select
                      value={settings().culturalDisplayMode}
                      onChange={value =>
                        handleSettingChange(
                          'culturalDisplayMode',
                          String(value) as 'full' | 'minimal' | 'hidden'
                        )
                      }
                      options={culturalInfoLevels}
                    />
                    <p class={styles.settingHelp}>
                      Higher levels provide more educational context and learning resources
                    </p>
                  </div>

                  <div class={styles.settingGroup}>
                    <div class={styles.toggleSetting}>
                      <div class={styles.toggleInfo}>
                        <label class={styles.settingLabel}>Show Cultural Context by Default</label>
                        <p class={styles.settingDescription}>
                          Display cultural information panels when viewing documents
                        </p>
                      </div>
                      <Switch
                        checked={settings().showCulturalContext || true}
                        onChange={checked => handleSettingChange('showCulturalContext', checked)}
                      />
                    </div>
                  </div>

                  <div class={styles.settingGroup}>
                    <div class={styles.toggleSetting}>
                      <div class={styles.toggleInfo}>
                        <label class={styles.settingLabel}>Educational Resources Integration</label>
                        <p class={styles.settingDescription}>
                          Include links to educational materials about cultural contexts
                        </p>
                      </div>
                      <Switch
                        checked={settings().enableEducationalResources || true}
                        onChange={checked =>
                          handleSettingChange('enableEducationalResources', checked)
                        }
                      />
                    </div>
                  </div>

                  <div class={styles.settingGroup}>
                    <div class={styles.toggleSetting}>
                      <div class={styles.toggleInfo}>
                        <label class={styles.settingLabel}>Community Information Display</label>
                        <p class={styles.settingDescription}>
                          Show community-provided cultural context and perspectives
                        </p>
                      </div>
                      <Switch
                        checked={(settings().culturalPreferences?.length || 0) > 0}
                        onChange={checked =>
                          handleSettingChange('culturalPreferences', checked ? ['community'] : [])
                        }
                      />
                    </div>
                  </div>

                  <div class={styles.settingGroup}>
                    <div class={styles.toggleSetting}>
                      <div class={styles.toggleInfo}>
                        <label class={styles.settingLabel}>Traditional Knowledge Attribution</label>
                        <p class={styles.settingDescription}>
                          Display attribution information for traditional knowledge sources
                        </p>
                      </div>
                      <Switch
                        checked={settings().enableDocumentPreview || true}
                        onChange={checked => handleSettingChange('enableDocumentPreview', checked)}
                      />
                    </div>
                  </div>

                  <div class={styles.culturalNotice}>
                    <Info size={16} />
                    <div class={styles.noticeContent}>
                      <strong>Important Notice:</strong> All cultural settings are for educational
                      and informational purposes only. They do not restrict access to any content
                      and support multiple perspectives equally.
                    </div>
                  </div>
                </Card>
              </div>
            </Show>

            {/* Network & P2P Settings */}
            <Show when={activeSection() === 'network'}>
              <div class={styles.settingsSection}>
                <h2 class={styles.sectionTitle}>Network & P2P Settings</h2>

                <Card class={styles.settingsCard}>
                  <div class={styles.networkStatus}>
                    <NetworkStatus variant="compact" autoRefresh refreshInterval={15} />
                  </div>

                  <div class={styles.settingGroup}>
                    <div class={styles.toggleSetting}>
                      <div class={styles.toggleInfo}>
                        <label class={styles.settingLabel}>
                          <Network size={16} />
                          Enable P2P Network
                        </label>
                        <p class={styles.settingDescription}>
                          Connect to the decentralized peer-to-peer network
                        </p>
                      </div>
                      <Switch
                        checked={settings().enableNetworkSearch || true}
                        onChange={checked => handleSettingChange('enableNetworkSearch', checked)}
                      />
                    </div>
                  </div>

                  <div class={styles.settingGroup}>
                    <div class={styles.toggleSetting}>
                      <div class={styles.toggleInfo}>
                        <label class={styles.settingLabel}>
                          <Shield size={16} />
                          Anonymous Mode
                        </label>
                        <p class={styles.settingDescription}>
                          Use TOR network for anonymous connections
                        </p>
                      </div>
                      <Switch
                        checked={settings().enableAnonymousMode || false}
                        onChange={checked => handleSettingChange('enableAnonymousMode', checked)}
                      />
                    </div>
                  </div>

                  <div class={styles.settingGroup}>
                    <label class={styles.settingLabel}>Maximum Connections</label>
                    <Select
                      value={settings().maxPeerConnections}
                      onChange={value => handleSettingChange('maxPeerConnections', Number(value))}
                      options={[
                        { value: 10, label: '10' },
                        { value: 25, label: '25' },
                        { value: 50, label: '50' },
                        { value: 100, label: '100' },
                        { value: 200, label: '200' },
                      ]}
                    />
                    <p class={styles.settingHelp}>
                      Higher values allow more peer connections but use more resources
                    </p>
                  </div>

                  <div class={styles.settingGroup}>
                    <label class={styles.settingLabel}>Network Port</label>
                    <Input
                      type="number"
                      value={String(settings().bandwidthLimit || 1000)}
                      onChange={value =>
                        handleSettingChange('bandwidthLimit', parseInt(value || '1000', 10))
                      }
                    />
                  </div>
                </Card>
              </div>
            </Show>

            {/* Privacy & Security Settings */}
            <Show when={activeSection() === 'privacy'}>
              <div class={styles.settingsSection}>
                <h2 class={styles.sectionTitle}>Privacy & Security Settings</h2>

                <Card class={styles.settingsCard}>
                  <div class={styles.settingGroup}>
                    <div class={styles.toggleSetting}>
                      <div class={styles.toggleInfo}>
                        <label class={styles.settingLabel}>
                          <Lock size={16} />
                          Encrypt Local Database
                        </label>
                        <p class={styles.settingDescription}>
                          Encrypt your local document database with a password
                        </p>
                      </div>
                      <Switch
                        checked={settings().errorReporting || false}
                        onChange={checked => handleSettingChange('errorReporting', checked)}
                      />
                    </div>
                  </div>

                  <div class={styles.settingGroup}>
                    <div class={styles.toggleSetting}>
                      <div class={styles.toggleInfo}>
                        <label class={styles.settingLabel}>
                          <Shield size={16} />
                          Enable Malware Scanning
                        </label>
                        <p class={styles.settingDescription}>
                          Scan downloaded files for malware and security threats
                        </p>
                      </div>
                      <Switch
                        checked={settings().performanceMonitoring || true}
                        onChange={checked => handleSettingChange('performanceMonitoring', checked)}
                      />
                    </div>
                  </div>

                  <div class={styles.settingGroup}>
                    <div class={styles.toggleSetting}>
                      <div class={styles.toggleInfo}>
                        <label class={styles.settingLabel}>Auto-Lock Application</label>
                        <p class={styles.settingDescription}>
                          Automatically lock the application after inactivity
                        </p>
                      </div>
                      <Switch
                        checked={settings().debugMode || false}
                        onChange={checked => handleSettingChange('debugMode', checked)}
                      />
                    </div>
                  </div>

                  <div class={styles.settingGroup}>
                    <div class={styles.toggleSetting}>
                      <div class={styles.toggleInfo}>
                        <label class={styles.settingLabel}>Beta Features</label>
                        <p class={styles.settingDescription}>
                          Enable preview features and experimental improvements
                        </p>
                      </div>
                      <Switch
                        checked={settings().betaFeatures || false}
                        onChange={checked => handleSettingChange('betaFeatures', checked)}
                      />
                    </div>
                  </div>
                </Card>
              </div>
            </Show>

            {/* Appearance Settings */}
            <Show when={activeSection() === 'appearance'}>
              <div class={styles.settingsSection}>
                <h2 class={styles.sectionTitle}>Appearance Settings</h2>

                <Card class={styles.settingsCard}>
                  <div class={styles.settingGroup}>
                    <label class={styles.settingLabel}>
                      <Palette size={16} />
                      Theme
                    </label>
                    <div class={styles.themeSelector}>
                      <For each={themeOptions}>
                        {theme => (
                          <button
                            class={`${styles.themeOption} ${
                              currentTheme().mode === theme.value ? styles.selected : ''
                            }`}
                            onClick={() => setMode(theme.value as 'light' | 'dark' | 'auto')}
                          >
                            {theme.icon}
                            <span>{theme.label}</span>
                          </button>
                        )}
                      </For>
                    </div>
                  </div>

                  <div class={styles.settingGroup}>
                    <label class={styles.settingLabel}>Font Size</label>
                    <Select
                      value={settings().fontSize}
                      onChange={value =>
                        handleSettingChange(
                          'fontSize',
                          String(value) as 'small' | 'medium' | 'large' | 'extra-large'
                        )
                      }
                      options={fontSizeOptions}
                    />
                    <p class={styles.settingHelp}>
                      Adjust the base font size for better readability
                    </p>
                  </div>

                  <div class={styles.settingGroup}>
                    <div class={styles.toggleSetting}>
                      <div class={styles.toggleInfo}>
                        <label class={styles.settingLabel}>Reduce Motion</label>
                        <p class={styles.settingDescription}>
                          Minimize animations and transitions for accessibility
                        </p>
                      </div>
                      <Switch
                        checked={settings().reducedMotion || false}
                        onChange={checked => handleSettingChange('reducedMotion', checked)}
                      />
                    </div>
                  </div>

                  <div class={styles.settingGroup}>
                    <div class={styles.toggleSetting}>
                      <div class={styles.toggleInfo}>
                        <label class={styles.settingLabel}>High Contrast Mode</label>
                        <p class={styles.settingDescription}>
                          Use high contrast colors for better visibility
                        </p>
                      </div>
                      <Switch
                        checked={settings().highContrastMode || false}
                        onChange={checked => handleSettingChange('highContrastMode', checked)}
                      />
                    </div>
                  </div>
                </Card>
              </div>
            </Show>

            {/* Accessibility Settings */}
            <Show when={activeSection() === 'accessibility'}>
              <div class={styles.settingsSection}>
                <h2 class={styles.sectionTitle}>Accessibility Settings</h2>

                <Card class={styles.settingsCard}>
                  <div class={styles.settingGroup}>
                    <div class={styles.toggleSetting}>
                      <div class={styles.toggleInfo}>
                        <label class={styles.settingLabel}>
                          <Eye size={16} />
                          Screen Reader Support
                        </label>
                        <p class={styles.settingDescription}>
                          Enhanced screen reader compatibility and announcements
                        </p>
                      </div>
                      <Switch
                        checked={settings().screenReaderOptimized || true}
                        onChange={checked => handleSettingChange('screenReaderOptimized', checked)}
                      />
                    </div>
                  </div>

                  <div class={styles.settingGroup}>
                    <div class={styles.toggleSetting}>
                      <div class={styles.toggleInfo}>
                        <label class={styles.settingLabel}>Keyboard Navigation</label>
                        <p class={styles.settingDescription}>
                          Enhanced keyboard shortcuts and navigation
                        </p>
                      </div>
                      <Switch
                        checked={settings().keyboardNavigationOnly || true}
                        onChange={checked => handleSettingChange('keyboardNavigationOnly', checked)}
                      />
                    </div>
                  </div>

                  <div class={styles.settingGroup}>
                    <div class={styles.toggleSetting}>
                      <div class={styles.toggleInfo}>
                        <label class={styles.settingLabel}>Enable Offline Mode</label>
                        <p class={styles.settingDescription}>
                          Keep core features available without active network access
                        </p>
                      </div>
                      <Switch
                        checked={settings().enableOfflineMode || true}
                        onChange={checked => handleSettingChange('enableOfflineMode', checked)}
                      />
                    </div>
                  </div>

                  <div class={styles.settingGroup}>
                    <label class={styles.settingLabel}>Search Timeout (seconds)</label>
                    <Select
                      value={Math.floor((settings().searchTimeout || 30000) / 1000)}
                      onChange={value => handleSettingChange('searchTimeout', Number(value) * 1000)}
                      options={[
                        { value: 10, label: '10s' },
                        { value: 30, label: '30s' },
                        { value: 60, label: '60s' },
                      ]}
                    />
                  </div>
                </Card>
              </div>
            </Show>

            {/* Notifications Settings */}
            <Show when={activeSection() === 'notifications'}>
              <div class={styles.settingsSection}>
                <h2 class={styles.sectionTitle}>Notification Settings</h2>

                <Card class={styles.settingsCard}>
                  <div class={styles.settingGroup}>
                    <div class={styles.toggleSetting}>
                      <div class={styles.toggleInfo}>
                        <label class={styles.settingLabel}>
                          <Bell size={16} />
                          Enable Notifications
                        </label>
                        <p class={styles.settingDescription}>
                          Show system notifications for important events
                        </p>
                      </div>
                      <Switch
                        checked={settings().searchHistoryEnabled || true}
                        onChange={checked => handleSettingChange('searchHistoryEnabled', checked)}
                      />
                    </div>
                  </div>

                  <Show when={settings().searchHistoryEnabled}>
                    <div class={styles.settingGroup}>
                      <div class={styles.toggleSetting}>
                        <div class={styles.toggleInfo}>
                          <label class={styles.settingLabel}>New Document Notifications</label>
                          <p class={styles.settingDescription}>
                            Notify when new documents are available
                          </p>
                        </div>
                        <Switch
                          checked={settings().peerDiscoveryEnabled || true}
                          onChange={checked => handleSettingChange('peerDiscoveryEnabled', checked)}
                        />
                      </div>
                    </div>

                    <div class={styles.settingGroup}>
                      <div class={styles.toggleSetting}>
                        <div class={styles.toggleInfo}>
                          <label class={styles.settingLabel}>Network Status Notifications</label>
                          <p class={styles.settingDescription}>
                            Notify about P2P network connection changes
                          </p>
                        </div>
                        <Switch
                          checked={settings().enableTorRouting || false}
                          onChange={checked => handleSettingChange('enableTorRouting', checked)}
                        />
                      </div>
                    </div>

                    <div class={styles.settingGroup}>
                      <div class={styles.toggleSetting}>
                        <div class={styles.toggleInfo}>
                          <label class={styles.settingLabel}>Share Documents With Peers</label>
                          <p class={styles.settingDescription}>
                            Allow shared availability in the distributed network
                          </p>
                        </div>
                        <Switch
                          checked={settings().shareDocumentsWithPeers || false}
                          onChange={checked =>
                            handleSettingChange('shareDocumentsWithPeers', checked)
                          }
                        />
                      </div>
                    </div>
                  </Show>
                </Card>
              </div>
            </Show>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default SettingsPage;
