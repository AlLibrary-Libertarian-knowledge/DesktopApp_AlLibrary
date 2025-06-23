/**
 * CommunityGuidelines - Community Rules & Best Practices
 * Blue/Cyan Cyberpunk Theme - Community Collaboration Focus
 */

import { Component, createSignal, For } from 'solid-js';
import {
  Users,
  Heart,
  Shield,
  BookOpen,
  Star,
  Eye,
  TrendingUp,
  MessageCircle,
  Award,
  Globe,
  CheckCircle,
  AlertTriangle,
  Info,
  ChevronRight,
} from 'lucide-solid';

// Foundation Components
import { Button } from '../../components/foundation/Button';
import { Card } from '../../components/foundation/Card';
import { Badge } from '../../components/foundation/Badge';

// Styles
import styles from './CommunityGuidelines.module.css';

export const CommunityGuidelines: Component = () => {
  // State Management
  const [activeTab, setActiveTab] = createSignal<'overview' | 'guidelines' | 'ethics' | 'support'>(
    'overview'
  );

  // Community Statistics
  const communityStats = [
    {
      icon: () => <Users size={24} />,
      number: '2,847',
      label: 'Community Members',
      sublabel: 'Active participants',
      trend: '+127 this month',
    },
    {
      icon: () => <Heart size={24} />,
      number: '98.7%',
      label: 'Positive Interactions',
      sublabel: 'Community rating',
      trend: '+2.3% improvement',
    },
    {
      icon: () => <MessageCircle size={24} />,
      number: '24/7',
      label: 'Community Support',
      sublabel: 'Always available',
      trend: 'Real-time help',
    },
    {
      icon: () => <Star size={24} />,
      number: '4.9',
      label: 'Community Rating',
      sublabel: 'Member satisfaction',
      trend: 'Excellent feedback',
    },
  ];

  // Core Guidelines
  const coreGuidelines = [
    {
      id: '1',
      title: 'Respect & Inclusion',
      description:
        'Treat all community members with dignity and respect, regardless of background, culture, or beliefs.',
      priority: 'essential',
      examples: [
        'Use inclusive language in all communications',
        'Respect cultural differences and perspectives',
        'Listen actively to different viewpoints',
        'Avoid discriminatory or offensive content',
      ],
      icon: () => <Heart size={20} />,
    },
    {
      id: '2',
      title: 'Cultural Sensitivity',
      description: 'Approach cultural content with awareness, respect, and educational intent.',
      priority: 'essential',
      examples: [
        'Acknowledge cultural origins and context',
        'Seek to understand before sharing opinions',
        'Respect traditional knowledge protocols',
        'Provide educational context when sharing',
      ],
      icon: () => <Globe size={20} />,
    },
    {
      id: '3',
      title: 'Collaborative Spirit',
      description: 'Work together to build knowledge and support community learning.',
      priority: 'important',
      examples: [
        'Share knowledge freely and openly',
        'Help newcomers learn community practices',
        'Collaborate on preservation projects',
        'Contribute to collective understanding',
      ],
      icon: () => <Users size={20} />,
    },
    {
      id: '4',
      title: 'Information Integrity',
      description: 'Maintain accuracy, provide sources, and combat misinformation.',
      priority: 'essential',
      examples: [
        'Cite sources for shared information',
        'Verify facts before sharing',
        'Correct misinformation respectfully',
        'Maintain transparency in communications',
      ],
      icon: () => <Shield size={20} />,
    },
  ];

  return (
    <div class={styles['community-guidelines-page']}>
      {/* Enhanced Page Header */}
      <header class={styles['page-header']}>
        <div class={styles['header-content']}>
          <div class={styles['title-section']}>
            <h1 class={styles['page-title']}>Community Guidelines</h1>
            <p class={styles['page-subtitle']}>
              Building a respectful and collaborative knowledge sharing community
            </p>
          </div>
          <div class={styles['header-stats']}>
            <div class={styles['stat-indicator']}>
              <Users size={20} />
              <span>Community Driven</span>
            </div>
            <div class={styles['stat-indicator']}>
              <Info size={16} />
              <span>Inclusive Space</span>
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
          class={`${styles.tab} ${activeTab() === 'guidelines' ? styles.active : ''}`}
          onClick={() => setActiveTab('guidelines')}
        >
          <BookOpen size={16} />
          <span>Core Guidelines</span>
        </button>
        <button
          class={`${styles.tab} ${activeTab() === 'ethics' ? styles.active : ''}`}
          onClick={() => setActiveTab('ethics')}
        >
          <Shield size={16} />
          <span>Ethics & Values</span>
        </button>
        <button
          class={`${styles.tab} ${activeTab() === 'support' ? styles.active : ''}`}
          onClick={() => setActiveTab('support')}
        >
          <MessageCircle size={16} />
          <span>Community Support</span>
        </button>
      </div>

      <div class={styles['dashboard-content']}>
        {/* Overview Tab */}
        {activeTab() === 'overview' && (
          <>
            {/* Statistics Grid */}
            <div class={styles['stats-grid']}>
              <For each={communityStats}>
                {stat => (
                  <Card className={styles['stat-card']}>
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

            {/* Core Guidelines Section */}
            <section class={styles['guidelines-section']}>
              <div class={styles['section-header']}>
                <h2 class={styles['section-title']}>Core Community Guidelines</h2>
                <p class={styles['section-subtitle']}>
                  Essential principles for respectful and productive community participation
                </p>
              </div>

              <div class={styles['guidelines-grid']}>
                <For each={coreGuidelines}>
                  {guideline => (
                    <Card class={styles['guideline-card']}>
                      <div class={styles['guideline-header']}>
                        <div class={styles['guideline-icon']}>{guideline.icon()}</div>
                        <div class={styles['guideline-priority']}>
                          <Badge
                            variant={guideline.priority === 'essential' ? 'primary' : 'secondary'}
                            size="sm"
                          >
                            {guideline.priority}
                          </Badge>
                        </div>
                      </div>

                      <div class={styles['guideline-content']}>
                        <h3 class={styles['guideline-title']}>{guideline.title}</h3>
                        <p class={styles['guideline-description']}>{guideline.description}</p>

                        <div class={styles['guideline-examples']}>
                          <h4 class={styles['examples-title']}>Key Practices:</h4>
                          <ul class={styles['examples-list']}>
                            <For each={guideline.examples}>
                              {example => (
                                <li class={styles['example-item']}>
                                  <CheckCircle size={14} />
                                  <span>{example}</span>
                                </li>
                              )}
                            </For>
                          </ul>
                        </div>
                      </div>

                      <div class={styles['guideline-footer']}>
                        <Button variant="outline" size="sm">
                          Learn More
                          <ChevronRight size={14} />
                        </Button>
                      </div>
                    </Card>
                  )}
                </For>
              </div>
            </section>
          </>
        )}

        {/* Other tabs placeholder */}
        {activeTab() !== 'overview' && (
          <div class={styles['tab-placeholder']}>
            <div class={styles['placeholder-content']}>
              <MessageCircle size={48} />
              <h3>Coming Soon</h3>
              <p>
                This section is under development with detailed community guidelines and support
                resources.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityGuidelines;
