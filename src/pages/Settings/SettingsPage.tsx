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

import { Component, createSignal, createEffect, onMount, Show, For } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import {
  Settings,
  User,
  Globe,
  Shield,
  Palette,
  Eye,
  Network,
  BookOpen,
  Download,
  Upload,
  Database,
  Lock,
  Unlock,
  Bell,
  Volume2,
  VolumeX,
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
import { Slider } from '../../components/foundation/Slider';

// Domain Components
import { CulturalIndicator } from '../../components/domain/cultural/CulturalIndicator';
import { NetworkStatus } from '../../components/domain/network/NetworkStatus';

// Layout Components
import { MainLayout } from '../../components/layout/MainLayout';
import { PageHeader } from '../../components/layout/PageHeader';

// Hooks and Services
import { useSettings } from '../../hooks/data/useSettings';
import { useCulturalContext } from '../../hooks/cultural/useCulturalContext';
import { useTheme } from '../../hooks/ui/useTheme';
import { useNetwork } from '../../hooks/network/useNetwork';

// Types
import type { UserSettings } from '../../types/Settings';
import type { CulturalPreferences } from '../../types/Cultural';
import type { NetworkConfig } from '../../types/Network';

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
  const [hasUnsavedChanges, setHasUnsavedChanges] = createSignal(false);
  const [showCulturalInfo, setShowCulturalInfo] = createSignal(props.showCulturalSettings || false);

  // Hooks
  const { settings, updateSettings, resetSettings, saveSettings, isLoading, error } = useSettings();

  const { culturalPreferences, updateCulturalPreferences, culturalEducationResources } =
    useCulturalContext();

  const { currentTheme, setTheme, availableThemes } = useTheme();

  const { networkConfig, updateNetworkConfig, networkStatus } = useNetwork();

  // Settings sections
  const settingsSections = [
    { id: 'general', label: 'General', icon: <Settings size={20} /> },
    { id: 'cultural', label: 'Cultural Information', icon: <BookOpen size={20} /> },
    { id: 'network', label: 'Network & P2P', icon: <Network size={20} /> },
    { id: 'privacy', label: 'Privacy & Security', icon: <Shield size={20} /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette size={20} /> },
    { id: 'accessibility', label: 'Accessibility', icon: <Accessibility size={20} /> },
    { id: 'storage', label: 'Storage & Data', icon: <Database size={20} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={20} /> },
  ];

  // Theme options
  const themeOptions = [
    { value: 'light', label: 'Light Theme', icon: <Sun size={16} /> },
    { value: 'dark', label: 'Dark Theme', icon: <Moon size={16} /> },
    { value: 'system', label: 'System Default', icon: <Monitor size={16} /> },
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
    { value: 0, label: 'No Cultural Information' },
    { value: 1, label: 'Basic Cultural Context' },
    { value: 2, label: 'Detailed Cultural Information' },
    { value: 3, label: 'Educational Resources Included' },
    { value: 4, label: 'Comprehensive Cultural Context' },
    { value: 5, label: 'Full Educational Integration' },
  ];

  // Handle settings changes
  const handleSettingChange = (key: string, value: any) => {
    updateSettings({ [key]: value });
    setHasUnsavedChanges(true);
  };

  const handleCulturalPreferenceChange = (key: string, value: any) => {
    updateCulturalPreferences({ [key]: value });
    setHasUnsavedChanges(true);
  };

  const handleNetworkConfigChange = (key: string, value: any) => {
    updateNetworkConfig({ [key]: value });
    setHasUnsavedChanges(true);
  };

  // Handle save and reset
  const handleSaveSettings = async () => {
    try {
      await saveSettings();
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const handleResetSettings = async () => {
    try {
      await resetSettings();
      setHasUnsavedChanges(false);
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
          icon={<Settings size={24} />}
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Settings', href: '/settings' },
          ]}
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
                    <Input
                      value={settings().displayName || ''}
                      onChange={value => handleSettingChange('displayName', value)}
                      placeholder="Enter your display name"
                    />
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
                      <Download size={16} />
                      Default Download Location
                    </label>
                    <div class={styles.pathSetting}>
                      <Input
                        value={settings().downloadPath || ''}
                        onChange={value => handleSettingChange('downloadPath', value)}
                        placeholder="Select download folder"
                        readonly
                      />
                      <Button variant="outline" size="sm">
                        Browse
                      </Button>
                    </div>
                  </div>

                  <div class={styles.settingGroup}>
                    <div class={styles.toggleSetting}>
                      <div class={styles.toggleInfo}>
                        <label class={styles.settingLabel}>Auto-Update Documents</label>
                        <p class={styles.settingDescription}>
                          Automatically check for document updates from the network
                        </p>
                      </div>
                      <Switch
                        checked={settings().autoUpdate || false}
                        onChange={checked => handleSettingChange('autoUpdate', checked)}
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
                      value={culturalPreferences().informationLevel || 3}
                      onChange={value => handleCulturalPreferenceChange('informationLevel', value)}
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
                        checked={culturalPreferences().showByDefault || true}
                        onChange={checked =>
                          handleCulturalPreferenceChange('showByDefault', checked)
                        }
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
                        checked={culturalPreferences().includeEducationalResources || true}
                        onChange={checked =>
                          handleCulturalPreferenceChange('includeEducationalResources', checked)
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
                        checked={culturalPreferences().showCommunityInfo || true}
                        onChange={checked =>
                          handleCulturalPreferenceChange('showCommunityInfo', checked)
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
                        checked={culturalPreferences().showAttribution || true}
                        onChange={checked =>
                          handleCulturalPreferenceChange('showAttribution', checked)
                        }
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
                    <NetworkStatus
                      status={networkStatus().status}
                      connectedPeers={networkStatus().connectedPeers}
                      connectionQuality={networkStatus().connectionQuality}
                    />
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
                        checked={networkConfig().enabled || true}
                        onChange={checked => handleNetworkConfigChange('enabled', checked)}
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
                        checked={networkConfig().anonymousMode || false}
                        onChange={checked => handleNetworkConfigChange('anonymousMode', checked)}
                      />
                    </div>
                  </div>

                  <div class={styles.settingGroup}>
                    <label class={styles.settingLabel}>Maximum Connections</label>
                    <Slider
                      value={networkConfig().maxConnections || 50}
                      min={10}
                      max={200}
                      step={10}
                      onChange={value => handleNetworkConfigChange('maxConnections', value)}
                    />
                    <p class={styles.settingHelp}>
                      Higher values allow more peer connections but use more resources
                    </p>
                  </div>

                  <div class={styles.settingGroup}>
                    <label class={styles.settingLabel}>Network Port</label>
                    <Input
                      type="number"
                      value={networkConfig().port || 4001}
                      onChange={value => handleNetworkConfigChange('port', parseInt(value))}
                      min={1024}
                      max={65535}
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
                        checked={settings().encryptDatabase || false}
                        onChange={checked => handleSettingChange('encryptDatabase', checked)}
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
                        checked={settings().malwareScanning || true}
                        onChange={checked => handleSettingChange('malwareScanning', checked)}
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
                        checked={settings().autoLock || false}
                        onChange={checked => handleSettingChange('autoLock', checked)}
                      />
                    </div>
                  </div>

                  <Show when={settings().autoLock}>
                    <div class={styles.settingGroup}>
                      <label class={styles.settingLabel}>Auto-Lock Timeout (minutes)</label>
                      <Slider
                        value={settings().autoLockTimeout || 15}
                        min={5}
                        max={120}
                        step={5}
                        onChange={value => handleSettingChange('autoLockTimeout', value)}
                      />
                    </div>
                  </Show>
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
                              currentTheme() === theme.value ? styles.selected : ''
                            }`}
                            onClick={() => setTheme(theme.value)}
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
                    <Slider
                      value={settings().fontSize || 16}
                      min={12}
                      max={24}
                      step={1}
                      onChange={value => handleSettingChange('fontSize', value)}
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
                        checked={settings().reduceMotion || false}
                        onChange={checked => handleSettingChange('reduceMotion', checked)}
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
                        checked={settings().highContrast || false}
                        onChange={checked => handleSettingChange('highContrast', checked)}
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
                        checked={settings().screenReaderSupport || true}
                        onChange={checked => handleSettingChange('screenReaderSupport', checked)}
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
                        checked={settings().keyboardNavigation || true}
                        onChange={checked => handleSettingChange('keyboardNavigation', checked)}
                      />
                    </div>
                  </div>

                  <div class={styles.settingGroup}>
                    <div class={styles.toggleSetting}>
                      <div class={styles.toggleInfo}>
                        <label class={styles.settingLabel}>Focus Indicators</label>
                        <p class={styles.settingDescription}>
                          Enhanced focus indicators for keyboard navigation
                        </p>
                      </div>
                      <Switch
                        checked={settings().focusIndicators || true}
                        onChange={checked => handleSettingChange('focusIndicators', checked)}
                      />
                    </div>
                  </div>

                  <div class={styles.settingGroup}>
                    <label class={styles.settingLabel}>Text Scaling</label>
                    <Slider
                      value={settings().textScaling || 100}
                      min={75}
                      max={200}
                      step={25}
                      onChange={value => handleSettingChange('textScaling', value)}
                    />
                    <p class={styles.settingHelp}>Scale text size as a percentage of the default</p>
                  </div>
                </Card>
              </div>
            </Show>

            {/* Storage & Data Settings */}
            <Show when={activeSection() === 'storage'}>
              <div class={styles.settingsSection}>
                <h2 class={styles.sectionTitle}>Storage & Data Settings</h2>

                <Card class={styles.settingsCard}>
                  <div class={styles.settingGroup}>
                    <label class={styles.settingLabel}>
                      <Database size={16} />
                      Database Location
                    </label>
                    <div class={styles.pathSetting}>
                      <Input
                        value={settings().databasePath || ''}
                        onChange={value => handleSettingChange('databasePath', value)}
                        placeholder="Database folder path"
                        readonly
                      />
                      <Button variant="outline" size="sm">
                        Change
                      </Button>
                    </div>
                  </div>

                  <div class={styles.settingGroup}>
                    <label class={styles.settingLabel}>Cache Size Limit (GB)</label>
                    <Slider
                      value={settings().cacheSize || 5}
                      min={1}
                      max={50}
                      step={1}
                      onChange={value => handleSettingChange('cacheSize', value)}
                    />
                  </div>

                  <div class={styles.settingGroup}>
                    <div class={styles.toggleSetting}>
                      <div class={styles.toggleInfo}>
                        <label class={styles.settingLabel}>Auto-Cleanup Cache</label>
                        <p class={styles.settingDescription}>
                          Automatically clean old cache files to save space
                        </p>
                      </div>
                      <Switch
                        checked={settings().autoCleanup || true}
                        onChange={checked => handleSettingChange('autoCleanup', checked)}
                      />
                    </div>
                  </div>

                  <div class={styles.storageActions}>
                    <Button variant="outline" size="sm">
                      <Database size={16} />
                      Clear Cache
                    </Button>
                    <Button variant="outline" size="sm">
                      <Upload size={16} />
                      Export Data
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download size={16} />
                      Import Data
                    </Button>
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
                        checked={settings().notifications || true}
                        onChange={checked => handleSettingChange('notifications', checked)}
                      />
                    </div>
                  </div>

                  <Show when={settings().notifications}>
                    <div class={styles.settingGroup}>
                      <div class={styles.toggleSetting}>
                        <div class={styles.toggleInfo}>
                          <label class={styles.settingLabel}>New Document Notifications</label>
                          <p class={styles.settingDescription}>
                            Notify when new documents are available
                          </p>
                        </div>
                        <Switch
                          checked={settings().notifyNewDocuments || true}
                          onChange={checked => handleSettingChange('notifyNewDocuments', checked)}
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
                          checked={settings().notifyNetworkStatus || false}
                          onChange={checked => handleSettingChange('notifyNetworkStatus', checked)}
                        />
                      </div>
                    </div>

                    <div class={styles.settingGroup}>
                      <div class={styles.toggleSetting}>
                        <div class={styles.toggleInfo}>
                          <label class={styles.settingLabel}>
                            <Volume2 size={16} />
                            Sound Notifications
                          </label>
                          <p class={styles.settingDescription}>Play sounds with notifications</p>
                        </div>
                        <Switch
                          checked={settings().notificationSounds || false}
                          onChange={checked => handleSettingChange('notificationSounds', checked)}
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
