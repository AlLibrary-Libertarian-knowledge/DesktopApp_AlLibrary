import { Component, Show, createMemo, createSignal, onMount } from 'solid-js';
import { useSearchParams } from '@solidjs/router';
import { convertFileSrc } from '@tauri-apps/api/core';
import { DocumentViewer } from '@/components/composite/DocumentViewer';
import { documentService } from '@/services/documentService';
import styles from './DocumentReader.module.css';

type Annotation = {
  id: string;
  page: number;
  type: 'note' | 'highlight';
  content: string;
  createdAt: Date;
};

const detectType = (pathOrExt: string): 'pdf' | 'epub' | 'text' | 'markdown' => {
  const p = pathOrExt.toLowerCase();
  if (p.endsWith('.pdf') || p === 'pdf') return 'pdf';
  if (p.endsWith('.epub') || p === 'epub') return 'epub';
  if (p.endsWith('.md') || p === 'markdown') return 'markdown';
  if (p.endsWith('.txt') || p === 'text') return 'text';
  return 'pdf';
};

export const DocumentReader: Component = () => {
  const [params] = useSearchParams();

  const filePath = () => decodeURIComponent(params.path || '');
  const providedType = () => params.type || '';
  const title = () => (params.title ? decodeURIComponent(params.title) : '');
  const type = createMemo(() => detectType(providedType() || filePath()));
  const url = createMemo(() => (filePath() ? convertFileSrc(filePath()) : undefined));
  const [bytes, setBytes] = createSignal<Uint8Array | undefined>();

  const [currentPage, setCurrentPage] = createSignal(1);
  const [zoom, setZoom] = createSignal(100);
  const [annotations, setAnnotations] = createSignal<Annotation[]>([]);
  // Page-level quick annotations removed; use the viewer toolbar

  // Load metadata (optional, for sidebar)
  const [metaLanguage, setMetaLanguage] = createSignal<string | undefined>();
  const [fileSize, setFileSize] = createSignal<number | undefined>();
  onMount(async () => {
    try {
      if (filePath()) {
        const info = await documentService.getDocumentInfo(filePath());
        setMetaLanguage(info.metadata.language);
        setFileSize(info.file_size);
        // Fetch raw bytes from backend so viewer doesn't rely on fetch filesystem
        const content = await documentService.openDocument(filePath());
        setBytes(content);
      }
    } catch (e) {
      console.warn('Reader: metadata load skipped', e);
    }
  });

  return (
    <div class={styles.readerLayout}>
      <div class={styles.contentArea}>
        <div class={styles.viewerPane}>
          <Show when={type() === 'pdf' || type() === 'epub' ? bytes() : url()}>
            <DocumentViewer
              documentUrl={type() === 'pdf' || type() === 'epub' ? undefined : (url() as string)}
              documentBytes={type() === 'pdf' || type() === 'epub' ? bytes() : undefined}
              documentType={type()}
              title={title()}
              currentPage={currentPage()}
              zoomLevel={zoom()}
              onPageChange={p => setCurrentPage(p)}
              onZoomChange={z => setZoom(z)}
              showCulturalContext={true}
              showHeader={false}
              annotations={annotations()}
            />
          </Show>
        </div>
      </div>
    </div>
  );
};

export default DocumentReader;


