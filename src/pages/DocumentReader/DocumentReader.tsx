import { type Component, Show, onMount, createSignal } from 'solid-js';
import { useSearchParams, useNavigate } from '@solidjs/router';
import { documentService } from '@/services/documentService';
import { DocumentViewerLoader } from '@/components/composite/DocumentViewerLoader';
import ErrorMessage from '@/components/foundation/ErrorMessage/ErrorMessage';
import { useTranslation } from '@/i18n';
import styles from './DocumentReader.module.css';

/**
 * Legacy `/reader?path=` route — redirects to unified `/document/:id` page.
 */
export const DocumentReader: Component = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = createSignal<string | null>(null);
  const { t } = useTranslation();
  const tf = t as unknown as (key: string) => string;

  const paramValue = (value: string | string[] | undefined): string =>
    Array.isArray(value) ? (value[0] ?? '') : (value ?? '');

  onMount(async () => {
    const path = decodeURIComponent(paramValue(params.path));
    if (!path) {
      setError('No document path provided.');
      return;
    }

    try {
      const info = await documentService.getDocumentInfo(path);
      navigate(documentService.buildDocumentUrl(info.id), { replace: true });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to resolve document.');
    }
  });

  return (
    <div class={`document-reader-page ${styles.readerLayout}`}>
      <Show
        when={!error()}
        fallback={
          <ErrorMessage
            message="Could not open document"
            description={error() ?? undefined}
            onRetry={() => navigate('/documents')}
          />
        }
      >
        <DocumentViewerLoader
          fullscreen
          phase="resolve"
          message={tf('pages.documentDetail.loading')}
          eyebrow={tf('pages.documentDetail.loader.eyebrowResolve')}
          hint={tf('pages.documentDetail.loader.hintResolve')}
        />
      </Show>
    </div>
  );
};

export default DocumentReader;
