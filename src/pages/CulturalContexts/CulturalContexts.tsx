/**
 * CulturalContexts - Cultural Information & Educational Resources
 * Purple/Violet Cyberpunk Theme - Information-First Approach
 */

import { Component, createSignal } from 'solid-js';
import { Globe, BookOpen, Users, Heart, Lightbulb, Info } from 'lucide-solid';

// Styles
import styles from './CulturalContexts.module.css';

export const CulturalContexts: Component = () => {
  // State Management
  const [activeTab, setActiveTab] = createSignal<
    'overview' | 'contexts' | 'education' | 'community'
  >('overview');

  return (
    <div class={styles['cultural-contexts-page']}>
      {/* Enhanced Page Header */}
      <header class={styles['page-header']}>
        <div class={styles['header-content']}>
          <div class={styles['title-section']}>
            <h1 class={styles['page-title']}>Cultural Contexts</h1>
            <p class={styles['page-subtitle']}>
              Educational resources and cultural information for respectful engagement
            </p>
          </div>
          <div class={styles['header-stats']}>
            <div class={styles['stat-indicator']}>
              <Globe size={20} />
              <span>Knowledge Network</span>
            </div>
            <div class={styles['stat-indicator']}>
              <Info size={16} />
              <span>Information Only</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div class={styles['dashboard-tabs']}>
        <button
          class={`${styles.tab} ${activeTab() === 'overview' ? styles.active : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Globe size={16} />
          <span>Overview</span>
        </button>
        <button
          class={`${styles.tab} ${activeTab() === 'contexts' ? styles.active : ''}`}
          onClick={() => setActiveTab('contexts')}
        >
          <BookOpen size={16} />
          <span>Cultural Contexts</span>
        </button>
        <button
          class={`${styles.tab} ${activeTab() === 'education' ? styles.active : ''}`}
          onClick={() => setActiveTab('education')}
        >
          <Lightbulb size={16} />
          <span>Educational Resources</span>
        </button>
        <button
          class={`${styles.tab} ${activeTab() === 'community' ? styles.active : ''}`}
          onClick={() => setActiveTab('community')}
        >
          <Users size={16} />
          <span>Community</span>
        </button>
      </div>

      <div class={styles['dashboard-content']}>
        {/* Overview Tab Content */}
        {activeTab() === 'overview' && (
          <div class={styles['overview-content']}>
            <div class={styles['welcome-section']}>
              <div class={styles['welcome-icon']}>
                <Heart size={48} />
              </div>
              <h2>Cultural Contexts Dashboard</h2>
              <p>
                Understanding cultural background of shared knowledge through educational resources
                and community collaboration.
              </p>
            </div>

            <div class={styles['stats-preview']}>
              <div class={styles['stat-item']}>
                <Globe size={24} />
                <div>
                  <span class={styles['stat-number']}>847</span>
                  <span class={styles['stat-label']}>Cultural Contexts</span>
                </div>
              </div>
              <div class={styles['stat-item']}>
                <BookOpen size={24} />
                <div>
                  <span class={styles['stat-number']}>156</span>
                  <span class={styles['stat-label']}>Educational Resources</span>
                </div>
              </div>
              <div class={styles['stat-item']}>
                <Users size={24} />
                <div>
                  <span class={styles['stat-number']}>89</span>
                  <span class={styles['stat-label']}>Contributors</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other tabs placeholder */}
        {activeTab() !== 'overview' && (
          <div class={styles['tab-placeholder']}>
            <div class={styles['placeholder-content']}>
              <Lightbulb size={48} />
              <h3>Coming Soon</h3>
              <p>
                This section is under development with comprehensive cultural information and
                educational resources.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CulturalContexts;
