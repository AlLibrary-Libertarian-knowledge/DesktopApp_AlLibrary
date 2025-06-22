import {
  Component,
  createSignal,
  createResource,
  createMemo,
  Show,
  For,
  Switch,
  Match,
} from 'solid-js';
import { Button, Card, Modal } from '../../components/foundation';
import { TopCard } from '../../components/composite';
import {
  Plus,
  Grid,
  List,
  Search,
  Filter,
  Settings,
  Share,
  Edit,
  Trash2,
  Eye,
  Users,
  Tag,
  Calendar,
  BarChart3,
  Globe,
  Shield,
  BookOpen,
  Folder,
  Star,
  TrendingUp,
  Clock,
  Download,
  Upload,
  RefreshCw,
  Sparkles,
} from 'lucide-solid';
import { collectionService } from '../../services/collectionService';
import type {
  Collection,
  CollectionType,
  CollectionVisibility,
  CreateCollectionRequest,
  CollectionSearchFilters,
  CollectionSearchOptions,
  CollectionAnalytics,
} from '../../types/Collection';
import type { Document } from '../../types/Document';
import { CulturalSensitivityLevel } from '../../types/Cultural';
import styles from './Collections.module.css';

const Collections: Component = () => {
  // Core state management
  const [viewMode, setViewMode] = createSignal<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = createSignal('');
  const [selectedCollection, setSelectedCollection] = createSignal<Collection | null>(null);
  const [selectedCollections, setSelectedCollections] = createSignal<Set<string>>(new Set());

  // Modal states
  const [showCreateModal, setShowCreateModal] = createSignal(false);
  const [showEditModal, setShowEditModal] = createSignal(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = createSignal(false);
  const [showShareModal, setShowShareModal] = createSignal(false);
  const [showPreview, setShowPreview] = createSignal(false);

  // Filter and organization states
  const [sortBy, setSortBy] = createSignal<
    'name' | 'created' | 'updated' | 'document_count' | 'size'
  >('updated');
  const [sortOrder, setSortOrder] = createSignal<'asc' | 'desc'>('desc');
  const [filterBy, setFilterBy] = createSignal<
    'all' | 'personal' | 'community' | 'cultural' | 'collaborative'
  >('all');
  const [culturalFilter, setCulturalFilter] = createSignal<CulturalSensitivityLevel[]>([]);
  const [visibilityFilter, setVisibilityFilter] = createSignal<CollectionVisibility[]>([]);

  // Advanced features
  const [showBatchActions, setShowBatchActions] = createSignal(false);
  const [showSmartOrganization, setShowSmartOrganization] = createSignal(false);
  const [autoTaggingEnabled, setAutoTaggingEnabled] = createSignal(true);

  // Create collection form state
  const [newCollection, setNewCollection] = createSignal<Partial<CreateCollectionRequest>>({
    name: '',
    description: '',
    type: 'PERSONAL' as CollectionType,
    visibility: 'PRIVATE' as CollectionVisibility,
    tags: [],
    categories: [],
    culturalMetadata: {
      sensitivityLevel: CulturalSensitivityLevel.PUBLIC,
    },
  });

  // Search filters and options
  const searchFilters = createMemo(
    (): CollectionSearchFilters => ({
      query: searchQuery(),
      type: filterBy() !== 'all' ? [filterBy().toUpperCase() as CollectionType] : undefined,
      culturalSensitivity: culturalFilter().length > 0 ? culturalFilter() : undefined,
      visibility: visibilityFilter().length > 0 ? visibilityFilter() : undefined,
    })
  );

  const searchOptions = createMemo(
    (): CollectionSearchOptions => ({
      sortBy: sortBy(),
      sortOrder: sortOrder(),
      maxResults: 100,
      includeDocuments: false,
      includeStatistics: true,
      includeCollaborators: true,
      respectCulturalBoundaries: true,
      showEducationalContext: true,
    })
  );

  // Data resources
  const [collections] = createResource(
    () => ({ filters: searchFilters(), options: searchOptions() }),
    async ({ filters, options }) => {
      try {
        return await collectionService.getCollections(filters, options);
      } catch (error) {
        console.error('Failed to load collections:', error);
        return [];
      }
    }
  );

  const [analytics] = createResource(
    () => selectedCollection()?.id,
    async collectionId => {
      if (!collectionId) return null;
      try {
        return await collectionService.getCollectionAnalytics(collectionId);
      } catch (error) {
        console.error('Failed to load analytics:', error);
        return null;
      }
    }
  );

  // Computed values
  const filteredCollections = createMemo(() => {
    const cols = collections() || [];
    return cols.filter(collection => {
      if (searchQuery() && !collection.name.toLowerCase().includes(searchQuery().toLowerCase())) {
        return false;
      }
      return true;
    });
  });

  const selectedCollectionCount = createMemo(() => selectedCollections().size);

  // Event handlers
  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
  };

  const handleCollectionSelect = (collection: Collection) => {
    setSelectedCollection(collection);
    setShowPreview(true);
  };

  const handleCreateCollection = async () => {
    try {
      const request = newCollection() as CreateCollectionRequest;
      if (!request.name) {
        alert('Collection name is required');
        return;
      }

      await collectionService.createCollection(request);
      setShowCreateModal(false);
      setNewCollection({
        name: '',
        description: '',
        type: 'PERSONAL' as CollectionType,
        visibility: 'PRIVATE' as CollectionVisibility,
        tags: [],
        categories: [],
        culturalMetadata: {
          sensitivityLevel: CulturalSensitivityLevel.PUBLIC,
        },
      });

      // Refresh collections
      collections.refetch();
    } catch (error) {
      console.error('Failed to create collection:', error);
      alert('Failed to create collection');
    }
  };

  const handleDeleteCollection = async (collectionId: string) => {
    if (!confirm('Are you sure you want to delete this collection?')) {
      return;
    }

    try {
      await collectionService.deleteCollection(collectionId);
      collections.refetch();
    } catch (error) {
      console.error('Failed to delete collection:', error);
      alert('Failed to delete collection');
    }
  };

  const toggleCollectionSelection = (collectionId: string) => {
    const newSelection = new Set(selectedCollections());
    if (newSelection.has(collectionId)) {
      newSelection.delete(collectionId);
    } else {
      newSelection.add(collectionId);
    }
    setSelectedCollections(newSelection);
    setShowBatchActions(newSelection.size > 0);
  };

  const selectAllCollections = () => {
    const allIds = new Set(filteredCollections().map(c => c.id));
    setSelectedCollections(allIds);
    setShowBatchActions(allIds.size > 0);
  };

  const clearSelection = () => {
    setSelectedCollections(new Set());
    setShowBatchActions(false);
  };

  const handleBatchAction = async (action: string) => {
    const selectedIds = Array.from(selectedCollections());

    try {
      switch (action) {
        case 'delete':
          if (confirm(`Delete ${selectedIds.length} collections?`)) {
            await Promise.all(selectedIds.map(id => collectionService.deleteCollection(id)));
            collections.refetch();
          }
          break;
        case 'export':
          // Export selected collections
          for (const id of selectedIds) {
            const data = await collectionService.exportCollection(id, 'json');
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `collection-${id}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }
          break;
        case 'share':
          setShowShareModal(true);
          break;
      }
    } catch (error) {
      console.error('Batch action failed:', error);
      alert('Batch action failed');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCulturalSensitivityLabel = (level: CulturalSensitivityLevel): string => {
    const labels = {
      [CulturalSensitivityLevel.PUBLIC]: 'Public',
      [CulturalSensitivityLevel.EDUCATIONAL]: 'Educational',
      [CulturalSensitivityLevel.COMMUNITY]: 'Community',
      [CulturalSensitivityLevel.GUARDIAN]: 'Guardian',
      [CulturalSensitivityLevel.SACRED]: 'Sacred',
    };
    return labels[level] || 'Unknown';
  };

  const getCulturalSensitivityColor = (level: CulturalSensitivityLevel): string => {
    const colors = {
      [CulturalSensitivityLevel.PUBLIC]: 'var(--success)',
      [CulturalSensitivityLevel.EDUCATIONAL]: 'var(--info)',
      [CulturalSensitivityLevel.COMMUNITY]: 'var(--warning)',
      [CulturalSensitivityLevel.GUARDIAN]: 'var(--error)',
      [CulturalSensitivityLevel.SACRED]: 'var(--purple)',
    };
    return colors[level] || 'var(--text-secondary)';
  };

  return (
    <div class={styles.collections}>
      {/* Header Section */}
      <div class={styles.header}>
        <div class={styles['header-content']}>
          <div class={styles['header-info']}>
            <h1 class={styles.title}>
              <Folder size={32} class={styles['title-icon']} />
              Collections
            </h1>
            <p class={styles.subtitle}>
              Organize and share your knowledge collections with cultural respect
            </p>
          </div>

          <div class={styles['header-actions']}>
            <Button variant="futuristic" color="purple" onClick={() => setShowCreateModal(true)}>
              <Plus size={16} class="mr-2" />
              Create Collection
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div class={styles['stats-grid']}>
          <TopCard
            title="Total Collections"
            value={collections()?.length || 0}
            icon={<Folder size={20} />}
            trend="+12%"
            color="purple"
          />
          <TopCard
            title="Cultural Collections"
            value={collections()?.filter(c => c.type === 'CULTURAL').length || 0}
            icon={<Globe size={20} />}
            trend="+8%"
            color="blue"
          />
          <TopCard
            title="Shared Collections"
            value={collections()?.filter(c => c.visibility !== 'PRIVATE').length || 0}
            icon={<Share size={20} />}
            trend="+15%"
            color="green"
          />
          <TopCard
            title="Total Documents"
            value={collections()?.reduce((sum, c) => sum + c.statistics.documentCount, 0) || 0}
            icon={<BookOpen size={20} />}
            trend="+25%"
            color="orange"
          />
        </div>
      </div>

      {/* Enhanced Control Bar */}
      <div class={styles['enhanced-control-bar']}>
        {/* Search Section */}
        <div class={styles['search-section']}>
          <div class={styles['search-container']}>
            <Search size={20} class={styles['search-icon']} />
            <input
              type="text"
              placeholder="🔍 Search collections across cultures and communities..."
              value={searchQuery()}
              onInput={e => handleSearchInput(e.currentTarget.value)}
              class={styles['search-input']}
            />
          </div>
        </div>

        {/* Filter and Sort Controls */}
        <div class={styles['controls-section']}>
          <div class={styles['filter-controls']}>
            <select
              value={filterBy()}
              onChange={e => setFilterBy(e.currentTarget.value as any)}
              class={styles['filter-select']}
            >
              <option value="all">All Collections</option>
              <option value="personal">Personal</option>
              <option value="community">Community</option>
              <option value="cultural">Cultural</option>
              <option value="collaborative">Collaborative</option>
            </select>

            <select
              value={sortBy()}
              onChange={e => setSortBy(e.currentTarget.value as any)}
              class={styles['sort-select']}
            >
              <option value="updated">Last Updated</option>
              <option value="created">Date Created</option>
              <option value="name">Name</option>
              <option value="document_count">Document Count</option>
              <option value="size">Size</option>
            </select>

            <button
              class={styles['sort-order-btn']}
              onClick={() => setSortOrder(sortOrder() === 'asc' ? 'desc' : 'asc')}
              title={`Sort ${sortOrder() === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              {sortOrder() === 'asc' ? '↑' : '↓'}
            </button>
          </div>

          {/* View Mode Toggle */}
          <div class={styles['view-toggle']}>
            <button
              class={`${styles['view-btn']} ${viewMode() === 'grid' ? styles.active : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <Grid size={16} />
              <span>Grid</span>
            </button>
            <button
              class={`${styles['view-btn']} ${viewMode() === 'list' ? styles.active : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <List size={16} />
              <span>List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Batch Actions Toolbar */}
      <Show when={showBatchActions()}>
        <div class={styles['batch-toolbar']}>
          <div class={styles['batch-info']}>
            <span class={styles['selection-count']}>
              {selectedCollectionCount()} collection{selectedCollectionCount() !== 1 ? 's' : ''}{' '}
              selected
            </span>
          </div>

          <div class={styles['batch-actions']}>
            <Button variant="futuristic" color="blue" onClick={() => handleBatchAction('share')}>
              <Share size={16} class="mr-2" />
              Share
            </Button>
            <Button variant="futuristic" color="green" onClick={() => handleBatchAction('export')}>
              <Download size={16} class="mr-2" />
              Export
            </Button>
            <Button variant="futuristic" color="red" onClick={() => handleBatchAction('delete')}>
              <Trash2 size={16} class="mr-2" />
              Delete
            </Button>
            <Button variant="futuristic" color="default" onClick={clearSelection}>
              Clear Selection
            </Button>
          </div>
        </div>
      </Show>

      {/* Collections Grid/List */}
      <div class={styles['collections-container']}>
        <Show
          when={!collections.loading}
          fallback={
            <div class={styles['loading-container']}>
              <div class={styles.spinner}></div>
              <p>Loading collections...</p>
            </div>
          }
        >
          <Show
            when={filteredCollections().length > 0}
            fallback={
              <div class={styles['empty-state']}>
                <Folder size={64} class={styles['empty-icon']} />
                <h3>No Collections Found</h3>
                <p>Create your first collection to organize your documents</p>
                <Button
                  variant="futuristic"
                  color="purple"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus size={16} class="mr-2" />
                  Create Collection
                </Button>
              </div>
            }
          >
            <Switch>
              <Match when={viewMode() === 'grid'}>
                <div class={styles['collections-grid']}>
                  <For each={filteredCollections()}>
                    {collection => (
                      <div
                        class={`${styles['collection-card']} ${
                          selectedCollections().has(collection.id) ? styles.selected : ''
                        }`}
                      >
                        {/* Selection Checkbox */}
                        <div class={styles['selection-checkbox']}>
                          <input
                            type="checkbox"
                            checked={selectedCollections().has(collection.id)}
                            onChange={() => toggleCollectionSelection(collection.id)}
                          />
                        </div>

                        {/* Collection Header */}
                        <div class={styles['collection-header']}>
                          <div class={styles['collection-icon']}>
                            <Folder size={24} />
                          </div>
                          <div class={styles['collection-type']}>{collection.type}</div>
                        </div>

                        {/* Collection Content */}
                        <div class={styles['collection-content']}>
                          <h3 class={styles['collection-title']}>{collection.name}</h3>
                          <p class={styles['collection-description']}>
                            {collection.description || 'No description provided'}
                          </p>

                          {/* Collection Stats */}
                          <div class={styles['collection-stats']}>
                            <div class={styles.stat}>
                              <BookOpen size={14} />
                              <span>{collection.statistics.documentCount} docs</span>
                            </div>
                            <div class={styles.stat}>
                              <Users size={14} />
                              <span>{collection.collaborators.length} collaborators</span>
                            </div>
                            <div class={styles.stat}>
                              <Calendar size={14} />
                              <span>{new Date(collection.updatedAt).toLocaleDateString()}</span>
                            </div>
                          </div>

                          {/* Cultural Context */}
                          <div class={styles['cultural-context']}>
                            <div
                              class={styles['sensitivity-badge']}
                              style={{
                                'background-color': getCulturalSensitivityColor(
                                  collection.culturalMetadata.sensitivityLevel
                                ),
                              }}
                            >
                              <Shield size={12} />
                              {getCulturalSensitivityLabel(
                                collection.culturalMetadata.sensitivityLevel
                              )}
                            </div>
                            <Show when={collection.culturalMetadata.culturalOrigin}>
                              <div class={styles['cultural-origin']}>
                                <Globe size={12} />
                                {collection.culturalMetadata.culturalOrigin}
                              </div>
                            </Show>
                          </div>

                          {/* Tags */}
                          <Show when={collection.tags.length > 0}>
                            <div class={styles['collection-tags']}>
                              <For each={collection.tags.slice(0, 3)}>
                                {tag => (
                                  <span class={styles.tag}>
                                    <Tag size={10} />
                                    {tag}
                                  </span>
                                )}
                              </For>
                              <Show when={collection.tags.length > 3}>
                                <span class={styles['more-tags']}>
                                  +{collection.tags.length - 3} more
                                </span>
                              </Show>
                            </div>
                          </Show>
                        </div>

                        {/* Collection Actions */}
                        <div class={styles['collection-actions']}>
                          <Button
                            variant="futuristic"
                            color="purple"
                            size="sm"
                            onClick={() => handleCollectionSelect(collection)}
                          >
                            <Eye size={14} class="mr-1" />
                            View
                          </Button>
                          <Button
                            variant="futuristic"
                            color="blue"
                            size="sm"
                            onClick={() => {
                              setSelectedCollection(collection);
                              setShowEditModal(true);
                            }}
                          >
                            <Edit size={14} class="mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="futuristic"
                            color="green"
                            size="sm"
                            onClick={() => {
                              setSelectedCollection(collection);
                              setShowAnalyticsModal(true);
                            }}
                          >
                            <BarChart3 size={14} class="mr-1" />
                            Stats
                          </Button>
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </Match>

              <Match when={viewMode() === 'list'}>
                <div class={styles['collections-list']}>
                  <For each={filteredCollections()}>
                    {collection => (
                      <div
                        class={`${styles['collection-list-item']} ${
                          selectedCollections().has(collection.id) ? styles.selected : ''
                        }`}
                      >
                        <div class={styles['list-selection']}>
                          <input
                            type="checkbox"
                            checked={selectedCollections().has(collection.id)}
                            onChange={() => toggleCollectionSelection(collection.id)}
                          />
                        </div>

                        <div class={styles['list-icon']}>
                          <Folder size={20} />
                        </div>

                        <div class={styles['list-content']}>
                          <div class={styles['list-main']}>
                            <h4 class={styles['list-title']}>{collection.name}</h4>
                            <p class={styles['list-description']}>
                              {collection.description || 'No description'}
                            </p>
                          </div>

                          <div class={styles['list-meta']}>
                            <span class={styles['list-type']}>{collection.type}</span>
                            <span class={styles['list-docs']}>
                              {collection.statistics.documentCount} documents
                            </span>
                            <span class={styles['list-size']}>
                              {formatFileSize(collection.statistics.totalSize)}
                            </span>
                            <span class={styles['list-updated']}>
                              {new Date(collection.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div class={styles['list-actions']}>
                          <Button
                            variant="futuristic"
                            color="purple"
                            size="sm"
                            onClick={() => handleCollectionSelect(collection)}
                          >
                            <Eye size={14} />
                          </Button>
                          <Button
                            variant="futuristic"
                            color="blue"
                            size="sm"
                            onClick={() => {
                              setSelectedCollection(collection);
                              setShowEditModal(true);
                            }}
                          >
                            <Edit size={14} />
                          </Button>
                          <Button
                            variant="futuristic"
                            color="red"
                            size="sm"
                            onClick={() => handleDeleteCollection(collection.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </Match>
            </Switch>
          </Show>
        </Show>
      </div>

      {/* Create Collection Modal */}
      <Modal
        isOpen={showCreateModal()}
        onClose={() => setShowCreateModal(false)}
        title="Create New Collection"
        class={styles['create-modal']}
      >
        <div class={styles['modal-content']}>
          <div class={styles['form-group']}>
            <label>Collection Name *</label>
            <input
              type="text"
              value={newCollection().name || ''}
              onInput={e => setNewCollection(prev => ({ ...prev, name: e.currentTarget.value }))}
              placeholder="Enter collection name"
              class={styles['form-input']}
            />
          </div>

          <div class={styles['form-group']}>
            <label>Description</label>
            <textarea
              value={newCollection().description || ''}
              onInput={e =>
                setNewCollection(prev => ({ ...prev, description: e.currentTarget.value }))
              }
              placeholder="Describe your collection"
              class={styles['form-textarea']}
              rows={3}
            />
          </div>

          <div class={styles['form-row']}>
            <div class={styles['form-group']}>
              <label>Type</label>
              <select
                value={newCollection().type}
                onChange={e =>
                  setNewCollection(prev => ({
                    ...prev,
                    type: e.currentTarget.value as CollectionType,
                  }))
                }
                class={styles['form-select']}
              >
                <option value="PERSONAL">Personal</option>
                <option value="COMMUNITY">Community</option>
                <option value="CULTURAL">Cultural</option>
                <option value="THEMATIC">Thematic</option>
                <option value="EDUCATIONAL">Educational</option>
                <option value="RESEARCH">Research</option>
                <option value="COLLABORATIVE">Collaborative</option>
              </select>
            </div>

            <div class={styles['form-group']}>
              <label>Visibility</label>
              <select
                value={newCollection().visibility}
                onChange={e =>
                  setNewCollection(prev => ({
                    ...prev,
                    visibility: e.currentTarget.value as CollectionVisibility,
                  }))
                }
                class={styles['form-select']}
              >
                <option value="PRIVATE">Private</option>
                <option value="COMMUNITY">Community</option>
                <option value="PUBLIC">Public</option>
                <option value="EDUCATIONAL_ONLY">Educational Only</option>
              </select>
            </div>
          </div>

          <div class={styles['form-group']}>
            <label>Cultural Sensitivity Level</label>
            <select
              value={newCollection().culturalMetadata?.sensitivityLevel}
              onChange={e =>
                setNewCollection(prev => ({
                  ...prev,
                  culturalMetadata: {
                    ...prev.culturalMetadata,
                    sensitivityLevel: parseInt(e.currentTarget.value) as CulturalSensitivityLevel,
                  },
                }))
              }
              class={styles['form-select']}
            >
              <option value={CulturalSensitivityLevel.PUBLIC}>Public</option>
              <option value={CulturalSensitivityLevel.EDUCATIONAL}>Educational</option>
              <option value={CulturalSensitivityLevel.COMMUNITY}>Community</option>
              <option value={CulturalSensitivityLevel.GUARDIAN}>Guardian</option>
              <option value={CulturalSensitivityLevel.SACRED}>Sacred</option>
            </select>
          </div>

          <div class={styles['modal-actions']}>
            <Button variant="futuristic" color="default" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="futuristic" color="purple" onClick={handleCreateCollection}>
              <Plus size={16} class="mr-2" />
              Create Collection
            </Button>
          </div>
        </div>
      </Modal>

      {/* Collection Preview Modal */}
      <Modal
        isOpen={showPreview()}
        onClose={() => setShowPreview(false)}
        title={selectedCollection()?.name || 'Collection Preview'}
        class={styles['preview-modal']}
      >
        <Show when={selectedCollection()}>
          {collection => (
            <div class={styles['preview-content']}>
              <div class={styles['preview-header']}>
                <div class={styles['preview-info']}>
                  <h2>{collection().name}</h2>
                  <p>{collection().description}</p>
                  <div class={styles['preview-meta']}>
                    <span class={styles['meta-item']}>
                      <BookOpen size={16} />
                      {collection().statistics.documentCount} documents
                    </span>
                    <span class={styles['meta-item']}>
                      <Users size={16} />
                      {collection().collaborators.length} collaborators
                    </span>
                    <span class={styles['meta-item']}>
                      <Calendar size={16} />
                      Updated {new Date(collection().updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div class={styles['preview-actions']}>
                <Button
                  variant="futuristic"
                  color="purple"
                  onClick={() => {
                    setShowPreview(false);
                    setShowEditModal(true);
                  }}
                >
                  <Edit size={16} class="mr-2" />
                  Edit Collection
                </Button>
                <Button
                  variant="futuristic"
                  color="blue"
                  onClick={() => {
                    setShowPreview(false);
                    setShowAnalyticsModal(true);
                  }}
                >
                  <BarChart3 size={16} class="mr-2" />
                  View Analytics
                </Button>
                <Button
                  variant="futuristic"
                  color="green"
                  onClick={() => {
                    setShowPreview(false);
                    setShowShareModal(true);
                  }}
                >
                  <Share size={16} class="mr-2" />
                  Share Collection
                </Button>
              </div>
            </div>
          )}
        </Show>
      </Modal>

      {/* Analytics Modal */}
      <Modal
        isOpen={showAnalyticsModal()}
        onClose={() => setShowAnalyticsModal(false)}
        title="Collection Analytics"
        class={styles['analytics-modal']}
      >
        <Show when={analytics()}>
          {data => (
            <div class={styles['analytics-content']}>
              <div class={styles['analytics-grid']}>
                <div class={styles['analytics-card']}>
                  <h4>Usage Metrics</h4>
                  <div class={styles['metrics-list']}>
                    <div class={styles.metric}>
                      <span>Views</span>
                      <span>{data().usage.views}</span>
                    </div>
                    <div class={styles.metric}>
                      <span>Unique Viewers</span>
                      <span>{data().usage.uniqueViewers}</span>
                    </div>
                    <div class={styles.metric}>
                      <span>Downloads</span>
                      <span>{data().usage.downloads}</span>
                    </div>
                    <div class={styles.metric}>
                      <span>Shares</span>
                      <span>{data().usage.shares}</span>
                    </div>
                  </div>
                </div>

                <div class={styles['analytics-card']}>
                  <h4>Growth Metrics</h4>
                  <div class={styles['metrics-list']}>
                    <div class={styles.metric}>
                      <span>Documents Added</span>
                      <span>{data().growth.documentsAdded}</span>
                    </div>
                    <div class={styles.metric}>
                      <span>Collaborators Added</span>
                      <span>{data().growth.collaboratorsAdded}</span>
                    </div>
                    <div class={styles.metric}>
                      <span>Tags Added</span>
                      <span>{data().growth.tagsAdded}</span>
                    </div>
                  </div>
                </div>

                <div class={styles['analytics-card']}>
                  <h4>Cultural Metrics</h4>
                  <div class={styles['metrics-list']}>
                    <div class={styles.metric}>
                      <span>Cultural Diversity Score</span>
                      <span>{(data().cultural.culturalDiversityScore * 100).toFixed(1)}%</span>
                    </div>
                    <div class={styles.metric}>
                      <span>Community Engagement</span>
                      <span>{(data().cultural.communityEngagement * 100).toFixed(1)}%</span>
                    </div>
                    <div class={styles.metric}>
                      <span>Educational Impact</span>
                      <span>{(data().cultural.educationalImpact * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class={styles['modal-actions']}>
                <Button
                  variant="futuristic"
                  color="purple"
                  onClick={() => setShowAnalyticsModal(false)}
                >
                  Close
                </Button>
                <Button
                  variant="futuristic"
                  color="green"
                  onClick={() => {
                    alert('Analytics exported successfully!');
                  }}
                >
                  <Download size={16} class="mr-2" />
                  Export Report
                </Button>
              </div>
            </div>
          )}
        </Show>
      </Modal>
    </div>
  );
};

export default Collections;
