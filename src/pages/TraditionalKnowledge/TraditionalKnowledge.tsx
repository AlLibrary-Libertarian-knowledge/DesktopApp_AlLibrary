/**
 * TraditionalKnowledge - Traditional Knowledge Systems & Educational Resources
 * Orange/Amber Cyberpunk Theme - Educational Focus
 */

import { Component, createSignal, For } from 'solid-js';
import {
  BookOpen,
  Leaf,
  Users,
  Heart,
  Star,
  Eye,
  Share2,
  Bookmark,
  TrendingUp,
  Calendar,
  MapPin,
  Sparkles,
  Info,
  ChevronRight,
  TreePine,
  Sunrise,
  Compass,
} from 'lucide-solid';

// Foundation Components
import { Button } from '../../components/foundation/Button';
import { Card } from '../../components/foundation/Card';
import { Badge } from '../../components/foundation/Badge';

// Styles
import styles from './TraditionalKnowledge.module.css';

export const TraditionalKnowledge: Component = () => {
  // State Management
  const [activeTab, setActiveTab] = createSignal<
    'overview' | 'systems' | 'practices' | 'preservation'
  >('overview');

  // Traditional Knowledge Data
  const knowledgeStats = [
    {
      icon: () => <TreePine size={24} />,
      number: '1,247',
      label: 'Knowledge Systems',
      sublabel: 'Traditional practices',
      trend: '+34 documented',
    },
    {
      icon: () => <Leaf size={24} />,
      number: '892',
      label: 'Ecological Practices',
      sublabel: 'Sustainable methods',
      trend: '+18 this month',
    },
    {
      icon: () => <Users size={24} />,
      number: '156',
      label: 'Knowledge Keepers',
      sublabel: 'Active contributors',
      trend: '+7 new voices',
    },
    {
      icon: () => <Heart size={24} />,
      number: '3.8k',
      label: 'Educational Resources',
      sublabel: 'Learning materials',
      trend: '+245 resources',
    },
  ];

  const knowledgeSystems = [
    {
      id: '1',
      title: 'Traditional Ecological Knowledge',
      description:
        'Comprehensive understanding of local ecosystems, biodiversity conservation, and sustainable resource management practices.',
      domain: 'ecological',
      contributors: 45,
      views: 2341,
      rating: 4.9,
      lastUpdated: '1 day ago',
      tags: ['ecology', 'conservation', 'sustainability'],
      culturalOrigin: 'Indigenous Communities Worldwide',
      knowledgeKeepers: 12,
    },
    {
      id: '2',
      title: 'Traditional Medicine Systems',
      description:
        'Ancient healing practices, herbal medicine knowledge, and holistic health approaches passed through generations.',
      domain: 'medicinal',
      contributors: 38,
      views: 1876,
      rating: 4.8,
      lastUpdated: '3 days ago',
      tags: ['medicine', 'healing', 'herbs'],
      culturalOrigin: 'Traditional Healers Network',
      knowledgeKeepers: 23,
    },
    {
      id: '3',
      title: 'Sustainable Agriculture Practices',
      description:
        'Traditional farming methods, crop rotation systems, and soil conservation techniques for sustainable food production.',
      domain: 'agricultural',
      contributors: 52,
      views: 2987,
      rating: 4.7,
      lastUpdated: '2 hours ago',
      tags: ['agriculture', 'farming', 'sustainability'],
      culturalOrigin: 'Traditional Farmers Collective',
      knowledgeKeepers: 18,
    },
  ];

  // Handlers
  const handleBookmark = (systemId: string) => {
    console.log('Bookmarked knowledge system:', systemId);
  };

  const handleShare = (systemId: string) => {
    console.log('Shared knowledge system:', systemId);
  };

  return (
    <div class={styles['traditional-knowledge-page']}>
      {/* Enhanced Page Header */}
      <header class={styles['page-header']}>
        <div class={styles['header-content']}>
          <div class={styles['title-section']}>
            <h1 class={styles['page-title']}>Traditional Knowledge</h1>
            <p class={styles['page-subtitle']}>
              Educational resources for understanding traditional knowledge systems and practices
            </p>
          </div>
          <div class={styles['header-stats']}>
            <div class={styles['stat-indicator']}>
              <Sunrise size={20} />
              <span>Ancient Wisdom</span>
            </div>
            <div class={styles['stat-indicator']}>
              <Info size={16} />
              <span>Educational Only</span>
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
          <Compass size={16} />
          <span>Overview</span>
        </button>
        <button
          class={`${styles.tab} ${activeTab() === 'systems' ? styles.active : ''}`}
          onClick={() => setActiveTab('systems')}
        >
          <TreePine size={16} />
          <span>Knowledge Systems</span>
        </button>
        <button
          class={`${styles.tab} ${activeTab() === 'practices' ? styles.active : ''}`}
          onClick={() => setActiveTab('practices')}
        >
          <Leaf size={16} />
          <span>Traditional Practices</span>
        </button>
        <button
          class={`${styles.tab} ${activeTab() === 'preservation' ? styles.active : ''}`}
          onClick={() => setActiveTab('preservation')}
        >
          <BookOpen size={16} />
          <span>Preservation Methods</span>
        </button>
      </div>

      <div class={styles['dashboard-content']}>
        {/* Overview Tab */}
        {activeTab() === 'overview' && (
          <>
            {/* Statistics Grid */}
            <div class={styles['stats-grid']}>
              <For each={knowledgeStats}>
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

            {/* Featured Knowledge Systems */}
            <section class={styles['featured-section']}>
              <div class={styles['section-header']}>
                <h2 class={styles['section-title']}>Featured Knowledge Systems</h2>
                <p class={styles['section-subtitle']}>
                  Educational overview of traditional knowledge and sustainable practices
                </p>
              </div>

              <div class={styles['systems-grid']}>
                <For each={knowledgeSystems}>
                  {system => (
                    <Card class={styles['system-card']}>
                      <div class={styles['system-header']}>
                        <div class={styles['system-domain']}>
                          <Badge variant="outline">{system.domain}</Badge>
                        </div>
                        <div class={styles['system-actions']}>
                          <button
                            class={styles['action-btn']}
                            onClick={() => handleBookmark(system.id)}
                          >
                            <Bookmark size={16} />
                          </button>
                          <button
                            class={styles['action-btn']}
                            onClick={() => handleShare(system.id)}
                          >
                            <Share2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div class={styles['system-content']}>
                        <h3 class={styles['system-title']}>{system.title}</h3>
                        <p class={styles['system-description']}>{system.description}</p>

                        <div class={styles['system-origin']}>
                          <MapPin size={14} />
                          <span>{system.culturalOrigin}</span>
                        </div>

                        <div class={styles['system-keepers']}>
                          <Users size={14} />
                          <span>{system.knowledgeKeepers} Knowledge Keepers</span>
                        </div>

                        <div class={styles['system-tags']}>
                          <For each={system.tags}>
                            {tag => (
                              <Badge variant="secondary" size="sm">
                                {tag}
                              </Badge>
                            )}
                          </For>
                        </div>
                      </div>

                      <div class={styles['system-footer']}>
                        <div class={styles['system-meta']}>
                          <div class={styles['meta-item']}>
                            <Users size={14} />
                            <span>{system.contributors} contributors</span>
                          </div>
                          <div class={styles['meta-item']}>
                            <Eye size={14} />
                            <span>{system.views} views</span>
                          </div>
                          <div class={styles['meta-item']}>
                            <Star size={14} />
                            <span>{system.rating}</span>
                          </div>
                        </div>
                        <div class={styles['system-updated']}>
                          <Calendar size={14} />
                          <span>{system.lastUpdated}</span>
                        </div>
                      </div>

                      <div class={styles['system-cta']}>
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
          </>
        )}

        {/* Other tabs content would go here... (simplified for brevity) */}
        {activeTab() !== 'overview' && (
          <div class={styles['tab-placeholder']}>
            <div class={styles['placeholder-content']}>
              <Sparkles size={48} />
              <h3>Coming Soon</h3>
              <p>
                This section is under development with educational content about traditional
                knowledge systems.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TraditionalKnowledge;
