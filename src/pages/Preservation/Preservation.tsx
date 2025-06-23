/**
 * Preservation - Digital Heritage Preservation Tools & Methods
 * Red/Pink Cyberpunk Theme - Conservation Focus
 */

import { Component, createSignal, For } from 'solid-js';
import {
  Archive,
  Shield,
  Database,
  Cloud,
  HardDrive,
  Users,
  Clock,
  CheckCircle,
  Star,
  TrendingUp,
  Download,
  Upload,
  Zap,
  Globe,
  Lock,
  Info,
  ChevronRight,
  AlertCircle,
} from 'lucide-solid';

// Foundation Components
import { Button } from '../../components/foundation/Button';
import { Card } from '../../components/foundation/Card';
import { Badge } from '../../components/foundation/Badge';

// Styles
import styles from './Preservation.module.css';

export const Preservation: Component = () => {
  // State Management
  const [activeTab, setActiveTab] = createSignal<'overview' | 'methods' | 'tools' | 'community'>(
    'overview'
  );

  // Preservation Statistics
  const preservationStats = [
    {
      icon: () => <Archive size={24} />,
      number: '47,892',
      label: 'Items Preserved',
      sublabel: 'Cultural artifacts',
      trend: '+1,234 this month',
    },
    {
      icon: () => <Database size={24} />,
      number: '2.4TB',
      label: 'Total Storage',
      sublabel: 'Distributed network',
      trend: '+89GB this week',
    },
    {
      icon: () => <Shield size={24} />,
      number: '99.9%',
      label: 'Integrity Rate',
      sublabel: 'Data protection',
      trend: 'Excellent reliability',
    },
    {
      icon: () => <Clock size={24} />,
      number: '50+',
      label: 'Years Projected',
      sublabel: 'Long-term storage',
      trend: 'Sustainable future',
    },
  ];

  const preservationMethods = [
    {
      id: '1',
      title: 'Digital Archiving',
      description:
        'Comprehensive digital preservation using multiple format standards and redundant storage systems.',
      effectiveness: 95,
      techniques: [
        'Format migration and normalization',
        'Metadata preservation standards',
        'Checksum verification systems',
        'Multi-format backup strategies',
      ],
      icon: () => <Archive size={20} />,
      complexity: 'Advanced',
    },
    {
      id: '2',
      title: 'Distributed Storage',
      description:
        'P2P network storage ensuring resilience through geographic and technological distribution.',
      effectiveness: 92,
      techniques: [
        'IPFS content addressing',
        'BitTorrent-style distribution',
        'Geographic node distribution',
        'Consensus-based validation',
      ],
      icon: () => <Globe size={20} />,
      complexity: 'Expert',
    },
    {
      id: '3',
      title: 'Community Preservation',
      description:
        'Collaborative preservation efforts involving multiple stakeholders and institutions.',
      effectiveness: 88,
      techniques: [
        'Crowdsourced digitization',
        'Community validation processes',
        'Shared preservation costs',
        'Cultural expertise integration',
      ],
      icon: () => <Users size={20} />,
      complexity: 'Intermediate',
    },
    {
      id: '4',
      title: 'Technical Conservation',
      description: 'Advanced technical methods for format preservation and digital restoration.',
      effectiveness: 90,
      techniques: [
        'Emulation technologies',
        'Format conversion pipelines',
        'Quality enhancement algorithms',
        'Automated repair systems',
      ],
      icon: () => <Zap size={20} />,
      complexity: 'Advanced',
    },
  ];

  return (
    <div class={styles['preservation-page']}>
      {/* Enhanced Page Header */}
      <header class={styles['page-header']}>
        <div class={styles['header-content']}>
          <div class={styles['title-section']}>
            <h1 class={styles['page-title']}>Preservation</h1>
            <p class={styles['page-subtitle']}>
              Advanced tools and methods for long-term cultural heritage preservation
            </p>
          </div>
          <div class={styles['header-stats']}>
            <div class={styles['stat-indicator']}>
              <Shield size={20} />
              <span>Data Protection</span>
            </div>
            <div class={styles['stat-indicator']}>
              <Info size={16} />
              <span>Future-Proof</span>
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
          <Archive size={16} />
          <span>Overview</span>
        </button>
        <button
          class={`${styles.tab} ${activeTab() === 'methods' ? styles.active : ''}`}
          onClick={() => setActiveTab('methods')}
        >
          <Shield size={16} />
          <span>Methods</span>
        </button>
        <button
          class={`${styles.tab} ${activeTab() === 'tools' ? styles.active : ''}`}
          onClick={() => setActiveTab('tools')}
        >
          <Zap size={16} />
          <span>Tools</span>
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
        {/* Overview Tab */}
        {activeTab() === 'overview' && (
          <>
            {/* Statistics Grid */}
            <div class={styles['stats-grid']}>
              <For each={preservationStats}>
                {stat => (
                  <Card class={styles['stat-card']}>
                    <div class={styles['stat-header']}>
                      <div class={styles['stat-icon']}>{stat.icon()}</div>
                      <div class={styles['stat-trend']}>
                        <TrendingUp size={14} />
                        <span>{stat.trend}</span>
                      </div>
                    </div>
                    <div class={styles['stat-content']}>
                      <div class={styles['stat-number']}>{stat.number}</div>
                      <div class={styles['stat-label']}>{stat.label}</div>
                      <div class={styles['stat-sublabel']}>{stat.sublabel}</div>
                    </div>
                  </Card>
                )}
              </For>
            </div>

            {/* Preservation Methods Section */}
            <section class={styles['methods-section']}>
              <div class={styles['section-header']}>
                <h2 class={styles['section-title']}>Preservation Methods</h2>
                <p class={styles['section-subtitle']}>
                  Comprehensive approaches to long-term digital heritage conservation
                </p>
              </div>

              <div class={styles['methods-grid']}>
                <For each={preservationMethods}>
                  {method => (
                    <Card class={styles['method-card']}>
                      <div class={styles['method-header']}>
                        <div class={styles['method-icon']}>{method.icon()}</div>
                        <div class={styles['method-meta']}>
                          <Badge variant="outline" size="sm">
                            {method.complexity}
                          </Badge>
                          <div class={styles['effectiveness-badge']}>
                            <Star size={12} />
                            <span>{method.effectiveness}%</span>
                          </div>
                        </div>
                      </div>

                      <div class={styles['method-content']}>
                        <h3 class={styles['method-title']}>{method.title}</h3>
                        <p class={styles['method-description']}>{method.description}</p>

                        <div class={styles['method-techniques']}>
                          <h4 class={styles['techniques-title']}>Key Techniques:</h4>
                          <ul class={styles['techniques-list']}>
                            <For each={method.techniques}>
                              {technique => (
                                <li class={styles['technique-item']}>
                                  <CheckCircle size={14} />
                                  <span>{technique}</span>
                                </li>
                              )}
                            </For>
                          </ul>
                        </div>

                        <div class={styles['effectiveness-bar']}>
                          <div class={styles['effectiveness-label']}>
                            <span>Effectiveness</span>
                            <span>{method.effectiveness}%</span>
                          </div>
                          <div class={styles['progress-bar']}>
                            <div
                              class={styles['progress-fill']}
                              style={{ width: `${method.effectiveness}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      <div class={styles['method-footer']}>
                        <Button variant="primary" size="sm">
                          Learn More
                          <ChevronRight size={14} />
                        </Button>
                      </div>
                    </Card>
                  )}
                </For>
              </div>
            </section>

            {/* Preservation Principles */}
            <section class={styles['principles-section']}>
              <div class={styles['section-header']}>
                <h2 class={styles['section-title']}>Preservation Principles</h2>
              </div>

              <div class={styles['principles-grid']}>
                <div class={styles['principle-card']}>
                  <div class={styles['principle-icon']}>
                    <Clock size={24} />
                  </div>
                  <h3>Long-term Accessibility</h3>
                  <p>
                    Ensuring content remains accessible across technological changes and format
                    evolution.
                  </p>
                </div>

                <div class={styles['principle-card']}>
                  <div class={styles['principle-icon']}>
                    <Shield size={24} />
                  </div>
                  <h3>Integrity Maintenance</h3>
                  <p>
                    Preserving the authenticity and completeness of cultural heritage materials.
                  </p>
                </div>

                <div class={styles['principle-card']}>
                  <div class={styles['principle-icon']}>
                    <Globe size={24} />
                  </div>
                  <h3>Distributed Resilience</h3>
                  <p>Creating redundant, geographically distributed preservation networks.</p>
                </div>

                <div class={styles['principle-card']}>
                  <div class={styles['principle-icon']}>
                    <Users size={24} />
                  </div>
                  <h3>Community Ownership</h3>
                  <p>Empowering communities to participate in their own heritage preservation.</p>
                </div>
              </div>
            </section>
          </>
        )}

        {/* Other tabs placeholder */}
        {activeTab() !== 'overview' && (
          <div class={styles['tab-placeholder']}>
            <div class={styles['placeholder-content']}>
              <Archive size={48} />
              <h3>Coming Soon</h3>
              <p>
                This section is under development with detailed preservation tools and community
                features.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Preservation;
