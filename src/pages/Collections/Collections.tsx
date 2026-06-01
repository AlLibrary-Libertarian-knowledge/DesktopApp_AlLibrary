import {
  type Component,
  createSignal,
  createResource,
  createMemo,
  createEffect,
  Show,
  For,
} from 'solid-js';
import { A } from '@solidjs/router';
import { Button, Modal, Input, Textarea } from '@/components/foundation';
import {
  Plus,
  Search,
  FolderOpen,
  Edit,
  Trash2,
  FileText,
  X,
  Layers,
  FileStack,
} from 'lucide-solid';
import { collectionService } from '@/services/collectionService';
import { documentService, type DocumentInfo } from '@/services/documentService';
import type { Collection, CreateCollectionRequest } from '@/types/Collection';
import type { CollectionDocument } from '@/types/Collection';
import { useTranslation } from '@/i18n/hooks';
import styles from './Collections.module.css';

const NAME_MAX = 255;
const DESC_MAX = 2000;

const isLibrarySidecar = (filename: string) => filename.toLowerCase().endsWith('.allibrary.json');

const normalizePath = (path: string) => path.replace(/\\/g, '/').toLowerCase();

const isLibraryDocInCollection = (doc: DocumentInfo, members: CollectionDocument[]) => {
  if (members.length === 0) return false;

  const memberIds = new Set(members.map(m => m.id));
  if (memberIds.has(doc.id)) return true;
  if (doc.content_hash && memberIds.has(doc.content_hash)) return true;

  const docPath = normalizePath(doc.file_path);
  const docTitle = (doc.metadata?.title || doc.filename).toLowerCase();

  return members.some(member => {
    if (member.localPath && normalizePath(member.localPath) === docPath) return true;
    return member.title.toLowerCase() === docTitle;
  });
};

const Collections: Component = () => {
  const { t, locale } = useTranslation('pages');
  const { t: tc } = useTranslation('common');

  const [searchQuery, setSearchQuery] = createSignal('');
  const [showCreateModal, setShowCreateModal] = createSignal(false);
  const [showEditModal, setShowEditModal] = createSignal(false);
  const [showDetailModal, setShowDetailModal] = createSignal(false);
  const [activeCollection, setActiveCollection] = createSignal<Collection | null>(null);
  const [formName, setFormName] = createSignal('');
  const [formDescription, setFormDescription] = createSignal('');
  const [saving, setSaving] = createSignal(false);
  const [showAddDocsModal, setShowAddDocsModal] = createSignal(false);
  const [selectedDocIds, setSelectedDocIds] = createSignal<Set<string>>(new Set());

  const isFormValid = createMemo(() => {
    const name = formName().trim();
    return name.length > 0 && formName().length <= NAME_MAX && formDescription().length <= DESC_MAX;
  });

  const nameNearLimit = createMemo(() => formName().length > NAME_MAX * 0.85);
  const descNearLimit = createMemo(() => formDescription().length > DESC_MAX * 0.85);

  createEffect(() => {
    if (showCreateModal()) {
      requestAnimationFrame(() => {
        document.getElementById('collection-name-input')?.focus();
      });
    }
  });

  const [collections, { refetch }] = createResource(async () => collectionService.getCollections());

  const filteredCollections = createMemo(() => {
    const q = searchQuery().trim().toLowerCase();
    const list = collections() ?? [];
    if (!q) return list;
    return list.filter(
      c => c.name.toLowerCase().includes(q) || (c.description?.toLowerCase().includes(q) ?? false)
    );
  });

  const pageStats = createMemo(() => {
    const list = collections() ?? [];
    return {
      total: list.length,
      documents: list.reduce((sum, c) => sum + c.documentCount, 0),
      showing: filteredCollections().length,
    };
  });

  const [detailDocuments, { refetch: refetchDetailDocs }] = createResource(
    () => (showDetailModal() ? activeCollection()?.id : undefined),
    async collectionId => {
      if (!collectionId) return [] as CollectionDocument[];
      return collectionService.getCollectionDocuments(collectionId);
    }
  );

  const [libraryDocs, { refetch: refetchLibraryDocs }] = createResource(
    () => (showAddDocsModal() ? 'load' : undefined),
    async () => {
      await documentService.scanDocumentsFolder().catch(() => undefined);
      const docs = await documentService.listDocumentsInFolder();
      return docs.filter(doc => !isLibrarySidecar(doc.filename));
    }
  );

  const [addModalMembers] = createResource(
    () => (showAddDocsModal() ? activeCollection()?.id : undefined),
    async collectionId => {
      if (!collectionId) return [] as CollectionDocument[];
      return collectionService.getCollectionDocuments(collectionId);
    }
  );

  const collectionMembers = createMemo(() => addModalMembers() ?? detailDocuments() ?? []);

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
  };

  const openCreate = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEdit = (collection: Collection) => {
    setActiveCollection(collection);
    setFormName(collection.name);
    setFormDescription(collection.description ?? '');
    setShowEditModal(true);
  };

  const openDetail = (collection: Collection) => {
    setActiveCollection(collection);
    setShowDetailModal(true);
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const request: CreateCollectionRequest = {
        name: formName(),
        description: formDescription() || undefined,
      };
      await collectionService.createCollection(request);
      setShowCreateModal(false);
      resetForm();
      await refetch();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : t('collections.errors.createFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    const collection = activeCollection();
    if (!collection) return;
    setSaving(true);
    try {
      await collectionService.updateCollection(collection.id, {
        name: formName(),
        description: formDescription() || undefined,
      });
      setShowEditModal(false);
      setActiveCollection(null);
      resetForm();
      await refetch();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : t('collections.errors.updateFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (collection: Collection) => {
    if (!confirm(t('collections.confirmDelete', { name: collection.name }))) return;
    try {
      await collectionService.deleteCollection(collection.id);
      if (activeCollection()?.id === collection.id) {
        setShowDetailModal(false);
        setActiveCollection(null);
      }
      await refetch();
    } catch (error) {
      console.error(error);
      alert(t('collections.errors.deleteFailed'));
    }
  };

  const handleRemoveDocument = async (documentId: string) => {
    const collection = activeCollection();
    if (!collection) return;
    try {
      await collectionService.removeDocumentsFromCollection(collection.id, [documentId]);
      await refetch();
      await refetchDetailDocs();
      const updated = await collectionService.getCollection(collection.id, true);
      if (updated) setActiveCollection(updated);
    } catch (error) {
      console.error(error);
      alert(t('collections.errors.removeDocFailed'));
    }
  };

  const toggleDocSelection = (doc: DocumentInfo) => {
    if (isLibraryDocInCollection(doc, collectionMembers())) return;
    setSelectedDocIds(prev => {
      const next = new Set(prev);
      if (next.has(doc.id)) next.delete(doc.id);
      else next.add(doc.id);
      return next;
    });
  };

  const renderCollectionForm = (nameInputId?: string) => (
    <div class={styles.formShell}>
      <div class={styles.formShellGrid} aria-hidden="true" />
      <div class={styles.formShellScan} aria-hidden="true" />
      <span class={styles.cornerAccent} data-corner="tl" aria-hidden="true" />
      <span class={styles.cornerAccent} data-corner="tr" aria-hidden="true" />
      <span class={styles.cornerAccent} data-corner="bl" aria-hidden="true" />
      <span class={styles.cornerAccent} data-corner="br" aria-hidden="true" />
      <form
        class={styles.collectionForm}
        onSubmit={e => {
          e.preventDefault();
        }}
      >
        <Input
          id={nameInputId}
          class={styles.futuristicInput}
          label={t('collections.form.name')}
          required
          variant="outline"
          placeholder={t('collections.form.namePlaceholder')}
          value={formName()}
          maxlength={NAME_MAX}
          hint={t('collections.form.nameHint')}
          onInput={setFormName}
          onKeyDown={e => {
            if (e.key === 'Enter' && isFormValid() && !saving()) {
              e.preventDefault();
              if (showCreateModal()) void handleCreate();
              else if (showEditModal()) void handleUpdate();
            }
          }}
        />
        <div class={styles.formField}>
          <div class={styles.fieldLabelRow}>
            <label class={styles.fieldLabel} for="collection-description">
              {t('collections.form.description')}
            </label>
            <span class={styles.fieldOptional}>{t('collections.form.optional')}</span>
          </div>
          <Textarea
            id="collection-description"
            class={`${styles.descriptionInput} ${styles.futuristicTextarea}`}
            rows={3}
            placeholder={t('collections.form.descriptionPlaceholder')}
            value={formDescription()}
            onInput={setFormDescription}
          />
          <div class={`${styles.fieldFooter} ${descNearLimit() ? styles.fieldFooterWarning : ''}`}>
            <span class={styles.fieldFooterLabel}>{t('collections.form.bufLabel')}</span>
            {t('collections.form.charCount', {
              current: formDescription().length,
              max: DESC_MAX,
            })}
          </div>
        </div>
        <Show when={nameNearLimit()}>
          <div class={`${styles.fieldFooter} ${styles.fieldFooterWarning}`}>
            <span class={styles.fieldFooterLabel}>{t('collections.form.nameLabel')}</span>
            {t('collections.form.charCount', { current: formName().length, max: NAME_MAX })}
          </div>
        </Show>
      </form>
    </div>
  );

  const renderFormFooter = (submitKey: string, onSubmit: () => void, onCancel: () => void) => (
    <div class={styles.modalActions}>
      <Button
        variant="futuristic"
        class={styles.modalCancel}
        disabled={saving()}
        onClick={onCancel}
      >
        {tc('actions.cancel')}
      </Button>
      <Button
        variant="futuristic"
        color="blue"
        class={styles.modalSubmit}
        disabled={saving() || !isFormValid()}
        onClick={() => void onSubmit()}
      >
        {t(submitKey)}
      </Button>
    </div>
  );

  const handleAddSelectedDocs = async () => {
    const collection = activeCollection();
    const members = collectionMembers();
    const ids = Array.from(selectedDocIds()).filter(id => !members.some(m => m.id === id));
    if (!collection || ids.length === 0) return;
    setSaving(true);
    try {
      await collectionService.addDocumentsToCollection(collection.id, ids);
      setShowAddDocsModal(false);
      setSelectedDocIds(new Set<string>());
      await refetch();
      await refetchDetailDocs();
      const updated = await collectionService.getCollection(collection.id, true);
      if (updated) setActiveCollection(updated);
    } catch (error) {
      console.error(error);
      alert(t('collections.errors.addDocsFailed'));
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date: Date) => date.toLocaleDateString(locale());

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div class={styles.collectionsPage}>
      <header class={styles.header}>
        <div class={styles.titleSection}>
          <h1>
            <FolderOpen class={styles.headerIcon} />
            {t('collections.title')}
          </h1>
          <p>{t('collections.subtitle')}</p>
        </div>

        <div class={styles.controls}>
          <div class={styles.searchContainer}>
            <Search class={styles.searchIcon} />
            <Input
              type="search"
              placeholder={t('collections.searchPlaceholder')}
              value={searchQuery()}
              onInput={setSearchQuery}
              class={styles.searchInput}
            />
          </div>
          <Button variant="futuristic" color="blue" class={styles.createBtn} onClick={openCreate}>
            <Plus size={16} />
            {t('collections.newCollection')}
          </Button>
        </div>
      </header>

      <Show when={!collections.loading}>
        <div class={styles.stats}>
          <div class={styles.statCard}>
            <Layers class={styles.statIcon} />
            <div>
              <h3>{pageStats().total}</h3>
              <p>{t('collections.stats.collections')}</p>
            </div>
          </div>
          <div class={styles.statCard}>
            <FileStack class={styles.statIcon} />
            <div>
              <h3>{pageStats().documents}</h3>
              <p>{t('collections.stats.documents')}</p>
            </div>
          </div>
          <div class={styles.statCard}>
            <Search class={styles.statIcon} />
            <div>
              <h3>{pageStats().showing}</h3>
              <p>{t('collections.stats.showing')}</p>
            </div>
          </div>
        </div>
      </Show>

      <Show
        when={!collections.loading}
        fallback={
          <div class={styles.loading}>
            <div class={styles.spinner} />
            <p>{t('collections.loading')}</p>
          </div>
        }
      >
        <Show
          when={(filteredCollections()?.length ?? 0) > 0}
          fallback={
            <div class={styles.emptyState}>
              <FolderOpen class={styles.emptyIcon} />
              <h3>{t('collections.empty.title')}</h3>
              <p>{t('collections.subtitle')}</p>
              <Button
                variant="futuristic"
                color="blue"
                class={styles.createBtn}
                onClick={openCreate}
              >
                <Plus size={16} />
                {t('collections.empty.cta')}
              </Button>
            </div>
          }
        >
          <div class={styles.grid}>
            <For each={filteredCollections()}>
              {collection => (
                <article class={styles.collectionCard}>
                  <div class={styles.cardGlow} aria-hidden="true" />
                  <div class={styles.cardHeader}>
                    <div class={styles.cardTitleRow}>
                      <span class={styles.cardIconWrap}>
                        <FolderOpen size={18} />
                      </span>
                      <h2>{collection.name}</h2>
                    </div>
                    <span class={styles.countBadge}>
                      {t('collections.card.docs', { count: collection.documentCount })}
                    </span>
                  </div>
                  <Show
                    when={collection.description}
                    fallback={<p class={styles.descriptionMuted}>—</p>}
                  >
                    <p class={styles.description}>{collection.description}</p>
                  </Show>
                  <p class={styles.meta}>
                    {t('collections.card.updated', { date: formatDate(collection.updatedAt) })}
                  </p>
                  <div class={styles.actions}>
                    <Button
                      variant="futuristic"
                      size="sm"
                      class={styles.actionPrimary}
                      onClick={() => openDetail(collection)}
                    >
                      {t('collections.actions.open')}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(collection)}>
                      <Edit size={14} />
                      {t('collections.actions.edit')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      class={styles.actionDanger}
                      onClick={() => handleDelete(collection)}
                    >
                      <Trash2 size={14} />
                      {t('collections.actions.delete')}
                    </Button>
                  </div>
                </article>
              )}
            </For>
          </div>
        </Show>
      </Show>

      <Modal
        isOpen={showCreateModal()}
        onClose={() => setShowCreateModal(false)}
        title={t('collections.create.title')}
        subtitle={t('collections.create.subtitle')}
        size="sm"
        class={styles.futuristicModal}
        footer={renderFormFooter('collections.create.submit', handleCreate, () =>
          setShowCreateModal(false)
        )}
      >
        {renderCollectionForm('collection-name-input')}
      </Modal>

      <Modal
        isOpen={showEditModal()}
        onClose={() => setShowEditModal(false)}
        title={t('collections.edit.title')}
        subtitle={t('collections.edit.subtitle')}
        size="sm"
        class={styles.futuristicModal}
        footer={renderFormFooter('collections.edit.submit', handleUpdate, () =>
          setShowEditModal(false)
        )}
      >
        {renderCollectionForm()}
      </Modal>

      <Modal
        isOpen={showDetailModal()}
        onClose={() => setShowDetailModal(false)}
        title={activeCollection()?.name ?? t('collections.detail.fallbackTitle')}
        subtitle={
          activeCollection()
            ? t('collections.detail.subtitle', {
                count: activeCollection()!.documentCount,
                date: formatDate(activeCollection()!.updatedAt),
              })
            : t('collections.detail.detailsFallback')
        }
        size="lg"
        class={styles.futuristicModal}
        footer={
          <div class={styles.modalActions}>
            <Button
              variant="futuristic"
              class={styles.modalCancel}
              onClick={() => setShowDetailModal(false)}
            >
              {tc('actions.close')}
            </Button>
          </div>
        }
      >
        <Show when={activeCollection()}>
          {collection => (
            <div class={styles.formShell}>
              <div class={styles.formShellGrid} aria-hidden="true" />
              <div class={styles.formShellScan} aria-hidden="true" />
              <span class={styles.cornerAccent} data-corner="tl" aria-hidden="true" />
              <span class={styles.cornerAccent} data-corner="tr" aria-hidden="true" />
              <span class={styles.cornerAccent} data-corner="bl" aria-hidden="true" />
              <span class={styles.cornerAccent} data-corner="br" aria-hidden="true" />
              <div class={styles.detail}>
                <Show when={collection().description}>
                  <p class={styles.detailDescription}>{collection().description}</p>
                </Show>
                <div class={styles.detailToolbar}>
                  <div class={styles.detailStat}>
                    <span class={styles.detailStatBadge}>{t('collections.detail.docsBadge')}</span>
                    <span class={styles.detailStatValue}>{collection().documentCount}</span>
                  </div>
                  <Button
                    variant="futuristic"
                    color="blue"
                    size="sm"
                    class={styles.modalSubmit}
                    onClick={() => {
                      setSelectedDocIds(new Set<string>());
                      setShowAddDocsModal(true);
                      void refetchLibraryDocs();
                    }}
                  >
                    <Plus size={14} />
                    {t('collections.detail.addFromLibrary')}
                  </Button>
                </div>
                <Show
                  when={!detailDocuments.loading}
                  fallback={<p class={styles.detailLoading}>{t('collections.detail.syncing')}</p>}
                >
                  <Show
                    when={(detailDocuments()?.length ?? 0) > 0}
                    fallback={
                      <div class={styles.detailEmpty}>
                        <FolderOpen size={28} />
                        <p>{t('collections.detail.emptyTitle')}</p>
                        <span>{t('collections.detail.emptyHint')}</span>
                      </div>
                    }
                  >
                    <ul class={styles.docList}>
                      <For each={detailDocuments()}>
                        {doc => (
                          <li class={styles.docItem}>
                            <div class={styles.docInfo}>
                              <FileText size={16} class={styles.docIcon} />
                              <div>
                                <A href={`/document/${doc.id}`} class={styles.docLink}>
                                  {doc.title}
                                </A>
                                <span class={styles.docMeta}>
                                  {doc.fileType.toUpperCase()} · {formatSize(doc.fileSize)}
                                </span>
                              </div>
                            </div>
                            <Button
                              variant="futuristic"
                              size="sm"
                              class={styles.docRemoveBtn}
                              onClick={() => void handleRemoveDocument(doc.id)}
                            >
                              <X size={14} />
                              {t('collections.detail.remove')}
                            </Button>
                          </li>
                        )}
                      </For>
                    </ul>
                  </Show>
                </Show>
              </div>
            </div>
          )}
        </Show>
      </Modal>

      <Modal
        isOpen={showAddDocsModal()}
        onClose={() => setShowAddDocsModal(false)}
        title={t('collections.addDocs.title')}
        subtitle={t('collections.addDocs.subtitle')}
        size="lg"
        class={styles.futuristicModal}
        footer={
          <div class={styles.modalActions}>
            <Button
              variant="futuristic"
              class={styles.modalCancel}
              disabled={saving()}
              onClick={() => setShowAddDocsModal(false)}
            >
              {tc('actions.cancel')}
            </Button>
            <Button
              variant="futuristic"
              color="blue"
              class={styles.modalSubmit}
              disabled={saving() || selectedDocIds().size === 0}
              onClick={() => void handleAddSelectedDocs()}
            >
              {t('collections.addDocs.addSelected', { count: selectedDocIds().size })}
            </Button>
          </div>
        }
      >
        <Show
          when={!libraryDocs.loading}
          fallback={<p class={styles.empty}>{t('collections.addDocs.loading')}</p>}
        >
          <Show
            when={(libraryDocs()?.length ?? 0) > 0}
            fallback={<p class={styles.empty}>{t('collections.addDocs.empty')}</p>}
          >
            <p class={styles.addDocsHint}>
              {t('collections.addDocs.hint', {
                toAdd: selectedDocIds().size,
                inCollection: collectionMembers().length,
              })}
            </p>
            <ul class={styles.pickList}>
              <For each={libraryDocs()}>
                {doc => {
                  const inCollection = () => isLibraryDocInCollection(doc, collectionMembers());
                  return (
                    <li>
                      <label
                        class={`${styles.pickRow} ${inCollection() ? styles.pickRowInCollection : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={inCollection() || selectedDocIds().has(doc.id)}
                          disabled={inCollection()}
                          onChange={() => toggleDocSelection(doc)}
                        />
                        <span class={styles.pickTitle}>{doc.metadata?.title || doc.filename}</span>
                        <Show
                          when={inCollection()}
                          fallback={
                            <span class={styles.docMeta}>{doc.document_type.toUpperCase()}</span>
                          }
                        >
                          <span class={styles.inCollectionBadge}>
                            {t('collections.addDocs.inCollection')}
                          </span>
                        </Show>
                      </label>
                    </li>
                  );
                }}
              </For>
            </ul>
          </Show>
        </Show>
      </Modal>
    </div>
  );
};

export default Collections;
