/**
 * Document Viewer Composite Component
 *
 * Advanced document viewer supporting PDF, EPUB, and text formats.
 * Includes cultural context display and accessibility features.
 * Follows SOLID principles and anti-censorship architecture.
 */

import { Component, createSignal, Show, onMount, onCleanup, createEffect } from 'solid-js';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ZoomIn,
  ZoomOut,
  Search,
  BookOpen,
  Maximize2,
  Minimize2,
  RotateCw,
  RotateCcw,
  SlidersHorizontal,
  Wand2,
  AlertTriangle,
  FileWarning,
  Leaf,
} from 'lucide-solid';
import { documentService } from '@/services/documentService';
import styles from './DocumentViewer.module.css';
import { globalNotesStore } from '@/stores/notes/globalNotesStore';

// PDF.js imports
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist';
// Use local worker asset with Vite to avoid CDN/CORS failures in Tauri
// Vite will transform this import into a URL to the built worker file
// Type declaration provided in src/types/pdfjs-worker.d.ts
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// EPUB.js imports
import { Book, Rendition } from 'epubjs';

// Set PDF.js worker to local bundled worker (no network request)
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl as unknown as string;
// Hint PDF.js to load JPEG2000 fallback (no-wasm) module from the same bundle; prevents blank JPX images
// @ts-ignore
pdfjsLib.GlobalWorkerOptions.wasmUrl = undefined;

export interface DocumentViewerProps {
  /** Document URL or content */
  documentUrl?: string;
  /** Optional absolute file path for global note grouping */
  documentPath?: string;
  /** Raw document bytes (preferred for Tauri/local files) */
  documentBytes?: Uint8Array | ArrayBuffer;
  /** Document content (for text documents) */
  documentContent?: string;
  /** Document type */
  documentType: 'pdf' | 'epub' | 'text' | 'markdown';
  /** Document title */
  title?: string;
  /** Show internal header (title inside viewer). Defaults to false to avoid duplication with page title. */
  showHeader?: boolean;
  /** Current page number */
  currentPage?: number;
  /** Total pages */
  totalPages?: number;
  /** Zoom level */
  zoomLevel?: number;
  /** Show controls */
  showControls?: boolean;
  /** Show cultural context */
  showCulturalContext?: boolean;
  /** Cultural context information */
  culturalContext?: any;
  /** Reading mode */
  readingMode?: 'normal' | 'fullscreen' | 'focus';
  /** Custom CSS class */
  class?: string;
  /** Test ID for testing */
  'data-testid'?: string;
  /** Page change handler */
  onPageChange?: (page: number) => void;
  /** Zoom change handler */
  onZoomChange?: (zoom: number) => void;
  /** Mode change handler */
  onModeChange?: (mode: string) => void;
  /** Search term */
  searchTerm?: string;
  /** Optional annotations to display in a drawer inside the viewer */
  annotations?: Array<{
    id: string;
    page: number;
    type: 'note' | 'highlight';
    content: string;
    createdAt: Date;
  }>;
}

export const DocumentViewer: Component<DocumentViewerProps> = props => {
  // State management following SOLID principles
  const [currentPage, setCurrentPage] = createSignal(props.currentPage || 1);
  const [zoomLevel, setZoomLevel] = createSignal(props.zoomLevel || 100);
  const [isLoading, setIsLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const [pdfDocument, setPdfDocument] = createSignal<PDFDocumentProxy | null>(null);
  const [epubBook, setEpubBook] = createSignal<Book | null>(null);
  const [epubRendition, setEpubRendition] = createSignal<Rendition | null>(null);
  const [totalPages, setTotalPages] = createSignal(props.totalPages || 1);
  const [searchResults, setSearchResults] = createSignal<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentSearchIndex, setCurrentSearchIndex] = createSignal<number>(0);
  const [isFullscreen, setIsFullscreen] = createSignal(false);
  const [rotation, setRotation] = createSignal(0); // degrees
  const [invertColors, setInvertColors] = createSignal(false);
  const [grayscale, setGrayscale] = createSignal(false);
  const [brightness, setBrightness] = createSignal(100); // percent
  const [contrast, setContrast] = createSignal(100); // percent
  const [showEditor, setShowEditor] = createSignal(false);
  const [showAnnotations, setShowAnnotations] = createSignal(false);
  const [showExport, setShowExport] = createSignal(false);
  const [editingNoteId, setEditingNoteId] = createSignal<string | null>(null);
  const [editorText, setEditorText] = createSignal('');
  // Step A/B/D: notes, highlights, and text annotations
  const [addNoteMode, setAddNoteMode] = createSignal(false);
  const [addHighlightMode, setAddHighlightMode] = createSignal(false);
  const [addTextMode, setAddTextMode] = createSignal(false);
  type Note = { id: string; page: number; x: number; y: number; w: number; h: number; text: string; lotId?: string };
  type Highlight = { id: string; page: number; x: number; y: number; w: number; h: number; color?: string };
  type TextAnnotation = { id: string; page: number; x: number; y: number; text: string; color?: string; size?: number };
  type Lot = { id: string; name: string };
  const [notes, setNotes] = createSignal<Array<Note>>([]);
  const [highlights, setHighlights] = createSignal<Array<Highlight>>([]);
  const [textAnnotations, setTextAnnotations] = createSignal<Array<TextAnnotation>>([]);
  const [editingTextId, setEditingTextId] = createSignal<string | null>(null);
  const [textEditorValue, setTextEditorValue] = createSignal('');
  const [lots, setLots] = createSignal<Array<Lot>>([]);
  const [newLotName, setNewLotName] = createSignal('');
  const [activeLotId, setActiveLotId] = createSignal<string>('all');
  const [draftRect, setDraftRect] = createSignal<{ x: number; y: number; w: number; h: number } | null>(null);

  // Default props
  const showControls = () => props.showControls ?? true;
  const showCulturalContext = () => props.showCulturalContext ?? true;
  const readingMode = () => props.readingMode || 'normal';
  const searchTerm = () => props.searchTerm || '';

  // Canvas for either PDF.js or native raster images
  const [pdfCanvas, setPdfCanvas] = createSignal<any | null>(null);
  const [canvasWrapper, setCanvasWrapper] = createSignal<any | null>(null);
  const [pageSurfaceRef, setPageSurfaceRef] = createSignal<any | null>(null);
  const [textLayerEl, setTextLayerEl] = createSignal<any | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [pendingSelectionRects, setPendingSelectionRects] = createSignal<Array<{ x: number; y: number; w: number; h: number }>>([]);

  // Handle page navigation
  const handlePageChange = (page: number) => {
    const newPage = Math.max(1, Math.min(page, totalPages()));
    setCurrentPage(newPage);
    props.onPageChange?.(newPage);

    // Render new page for PDF
    if (props.documentType === 'pdf') {
      if (props.documentUrl) {
        // Native render path
        renderNativePDFPage(props.documentUrl, newPage, Math.max(0.25, zoomLevel() / 100));
      } else if (pdfDocument()) {
        // pdf.js fallback
        renderPDFPage(newPage);
      }
    }

    // Navigate to new page for EPUB
    if (props.documentType === 'epub' && epubRendition()) {
      epubRendition()?.display(newPage.toString());
    }
  };

  // Compute fit-to-width
  const fitToWidth = () => {
    const container = pageSurfaceRef();
    const canvas = pdfCanvas();
    if (!container || !canvas) return;
    const containerWidth = (container as any).clientWidth;
    const baseWidth = canvas.width / Math.max(zoomLevel() / 100, 0.01);
    const targetZoom = Math.max(25, Math.min(500, Math.round((containerWidth / baseWidth) * 100)));
    handleZoomChange(targetZoom);
  };

  // Start drawing rectangle note / highlight / place text
  const handleSurfaceMouseDown = (e: any) => {
    if (!addNoteMode() && !addHighlightMode() && !addTextMode()) return;
    const canvas = pdfCanvas();
    if (!canvas) return;
    const rect = (canvas as any).getBoundingClientRect();
    const startX = (e.clientX - rect.left) / rect.width;
    const startY = (e.clientY - rect.top) / rect.height;

    if (addTextMode()) {
      const id = Math.random().toString(36).slice(2);
      setTextAnnotations([...textAnnotations(), { id, page: currentPage(), x: startX, y: startY, text: '', color: '#e5e7eb', size: 14 }]);
      setAddTextMode(false);
      setEditingTextId(id);
      setTextEditorValue('');
      return;
    }
    setDraftRect({ x: startX, y: startY, w: 0, h: 0 });

    const onMove = (ev: any) => {
      const curX = (ev.clientX - rect.left) / rect.width;
      const curY = (ev.clientY - rect.top) / rect.height;
      const x = Math.max(0, Math.min(startX, curX));
      const y = Math.max(0, Math.min(startY, curY));
      const w = Math.min(1, Math.max(startX, curX)) - x;
      const h = Math.min(1, Math.max(startY, curY)) - y;
      setDraftRect({ x, y, w, h });
    };
    const onUp = () => {
      (window as any).removeEventListener('mousemove', onMove);
      (window as any).removeEventListener('mouseup', onUp);
      const d = draftRect();
      setDraftRect(null);
      if (!d || d.w < 0.01 || d.h < 0.01) { setAddNoteMode(false); setAddHighlightMode(false); return; }
      const id = Math.random().toString(36).slice(2);
      if (addNoteMode()) {
        setNotes([...notes(), { id, page: currentPage(), x: d.x, y: d.y, w: d.w, h: d.h, text: '' }]);
        setAddNoteMode(false);
        setEditingNoteId(id);
        setEditorText('');
      } else if (addHighlightMode()) {
        setHighlights([...highlights(), { id, page: currentPage(), x: d.x, y: d.y, w: d.w, h: d.h, color: '#fde68a' }]);
        setAddHighlightMode(false);
      }
    };
    (window as any).addEventListener('mousemove', onMove);
    (window as any).addEventListener('mouseup', onUp);
  };

  const updateNoteText = (id: string, text: string) => setNotes(notes().map(n => n.id === id ? { ...n, text } : n));
  const openNoteEditor = (id: string) => {
    setEditingNoteId(id);
    const n = notes().find(nn => nn.id === id);
    setEditorText(n?.text || '');
  };
  const assignNoteLot = (id: string, lotId: string) => setNotes(notes().map(n => n.id === id ? { ...n, lotId } : n));
  const deleteNote = (id: string) => { setNotes(notes().filter(n => n.id !== id)); if (editingNoteId() === id) setEditingNoteId(null); };
  // remove unused until Step B wiring

  // Step B helpers will be added in the next step

  // Handle zoom change
  const handleZoomChange = (zoom: number) => {
    const newZoom = Math.max(25, Math.min(zoom, 500));
    setZoomLevel(newZoom);
    props.onZoomChange?.(newZoom);

    // Re-render with new zoom for PDF
    if (props.documentType === 'pdf' && pdfDocument()) {
      renderPDFPage(currentPage());
    } else if (props.documentType === 'pdf' && props.documentUrl) {
      renderNativePDFPage(props.documentUrl, currentPage(), Math.max(0.25, newZoom / 100));
    }

    // Update zoom for EPUB
    if (props.documentType === 'epub' && epubRendition()) {
      epubRendition()?.themes.fontSize(`${newZoom}%`);
    }
  };

  // Capture current selection rectangles from the text layer as normalized rects
  const captureSelectionRects = (): Array<{ x: number; y: number; w: number; h: number }> => {
    const layer = textLayerEl();
    if (!layer) return [];
    const sel = (window as any).getSelection?.();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return [];
    const range = sel.getRangeAt(0);
    const rects = Array.from(range.getClientRects()) as Array<any>;
    const layerRect = layer.getBoundingClientRect();
    const norm = rects
      .map((r: any) => {
        const x = (r.left - layerRect.left) / layerRect.width;
        const y = (r.top - layerRect.top) / layerRect.height;
        const w = r.width / layerRect.width;
        const h = r.height / layerRect.height;
        return { x, y, w, h };
      })
      .filter(r => r.w > 0.002 && r.h > 0.002)
      .map(r => ({
        x: Math.max(0, Math.min(1, r.x)),
        y: Math.max(0, Math.min(1, r.y)),
        w: Math.max(0, Math.min(1, r.w)),
        h: Math.max(0, Math.min(1, r.h)),
      }));
    return norm;
  };

  const handleTextLayerMouseUp = () => {
    if (!addHighlightMode()) return;
    const rects = captureSelectionRects();
    if (rects.length === 0) return;
    setPendingSelectionRects(rects);
    // Commit to highlights immediately
    const idBase = Math.random().toString(36).slice(2);
    const newHls = rects.map((r, idx) => ({
      id: `${idBase}-${idx}`,
      page: currentPage(),
      x: r.x,
      y: r.y,
      w: r.w,
      h: r.h,
      color: '#fde68a',
    }));
    setHighlights([...highlights(), ...newHls]);
    setPendingSelectionRects([]);
    setAddHighlightMode(false);
    try { (window as any).getSelection?.()?.removeAllRanges(); } catch { /* ignore */ }
  };

  const toggleFullscreen = () => {
    const newMode = isFullscreen() ? 'normal' : 'fullscreen';
    setIsFullscreen(!isFullscreen());
    props.onModeChange?.(newMode);
  };

  const rotateLeft = () => setRotation((rotation() - 90 + 360) % 360);
  const rotateRight = () => setRotation((rotation() + 90) % 360);

  // PDF.js rendering function
  const renderPDFPage = async (pageNumber: number) => {
    const pdf = pdfDocument();
    const canvas = pdfCanvas();

    if (!pdf || !canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    try {
      setIsLoading(true);
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: zoomLevel() / 100 });

      // Set canvas dimensions
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      const wrapper = canvasWrapper();
      if (wrapper) {
        (wrapper as any).style.width = `${canvas.width}px`;
        (wrapper as any).style.height = `${canvas.height}px`;
      }

      // Render page
      const renderTask = page.render({ canvasContext: context as any, viewport } as any);
      await (renderTask as any).promise;

      // Render selectable text layer for selection-based highlights
      try {
        const layer = textLayerEl();
        if (layer) {
          layer.style.width = `${canvas.width}px`;
          layer.style.height = `${canvas.height}px`;
          layer.innerHTML = '';
          const textContent = await page.getTextContent();
          const render = (pdfjsLib as any).renderTextLayer?.({
            textContentSource: textContent,
            container: layer,
            viewport,
            textDivs: [],
            enhanceTextSelection: true,
          });
          if (render?.promise) await render.promise;
        }
      } catch {
        // ignore
      }
    } catch {
      setError('Failed to render PDF page');
    } finally {
      setIsLoading(false);
    }
  };

  // EPUB.js initialization
  const initializeEPUB = async (source: string | ArrayBuffer) => {
    try {
      setIsLoading(true);
      const book = new Book(source as any);
      await (book as any).ready;

      const rendition = new (Rendition as any)(book as any, {});
      const container = document.getElementById('epub-container');
      if (container) {
        rendition.attachTo(container);
      }

      // Set initial zoom
      rendition.themes.fontSize(`${zoomLevel()}%`);

      // Display first page
      await rendition.display();

      setEpubBook(book as any);
      setEpubRendition(rendition as any);
      setTotalPages(((book as any).spine?.length as number) || totalPages());
      setIsLoading(false);
    } catch {
      setError('Failed to load EPUB document');
      setIsLoading(false);
    }
  };

  // PDF.js initialization (fallback if native path not used)
  const initializePDF = async (source: string | Uint8Array | ArrayBuffer) => {
    try {
      setIsLoading(true);
      const loadingTask =
        typeof source === 'string'
          ? pdfjsLib.getDocument(source)
          : pdfjsLib.getDocument({ data: source as Uint8Array | ArrayBuffer });
      const pdf = await loadingTask.promise;

      setPdfDocument(pdf);
      setTotalPages(pdf.numPages);

      // Render first page
      await renderPDFPage(currentPage());
    } catch {
      setError('Failed to load PDF document');
      setIsLoading(false);
    }
  };

  // Native PDFium rendering: draw current page as PNG onto canvas
  const renderNativePDFPage = async (filePath: string, page: number, scale: number) => {
    const canvas = pdfCanvas();
    if (!canvas) return;
    try {
      setIsLoading(true);
      const pngBytes = await documentService.pdfRenderPagePng(filePath, page - 1, scale);
      const blob = new (window as any).Blob([pngBytes], { type: 'image/png' });
      const url = (window as any).URL.createObjectURL(blob);
      const img = new (window as any).Image();
      await new Promise<void>((resolve, reject) => {
        (img as any).onload = () => resolve();
        (img as any).onerror = () => reject(new Error('image load failed'));
        (img as any).src = url;
      });
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = (img as any).width;
      canvas.height = (img as any).height;
      const wrapper = canvasWrapper();
      if (wrapper) {
        (wrapper as any).style.width = `${canvas.width}px`;
        (wrapper as any).style.height = `${canvas.height}px`;
      }
      (ctx as any).drawImage(img, 0, 0);
      (window as any).URL.revokeObjectURL(url);
    } catch {
      setError('Failed to render PDF page');
    } finally {
      setIsLoading(false);
    }
  };

  // Search functionality
  const performSearch = async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      setCurrentSearchIndex(0);
      return;
    }

    if (props.documentType === 'pdf' && pdfDocument()) {
      // PDF search implementation
      const results = [];
      const pdf = pdfDocument();

      if (pdf) {
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const text = (textContent.items as any[]).map((item: any) => item.str).join(' ');

          if (text.toLowerCase().includes(term.toLowerCase())) {
            results.push({ page: i, text });
          }
        }
      }

      setSearchResults(results);
      setCurrentSearchIndex(0);
    }

    if (props.documentType === 'epub' && epubBook()) {
      // EPUB search implementation - simplified for now
      const book: any = epubBook();
      if (book) {
        // Basic search through spine items
        const results: Array<{ page: number; text: string }> = [];
        const spineLen = (book.spine?.length as number) || 0;
        for (let i = 0; i < spineLen; i++) {
          // Note: Full EPUB search would require more complex implementation
          results.push({ page: i + 1, text: `Chapter ${i + 1}` });
        }
        setSearchResults(results);
        setCurrentSearchIndex(0);
      }
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: any) => {
    switch (e.key) {
      case 'ArrowLeft':
      case 'PageUp':
        e.preventDefault();
        handlePageChange(currentPage() - 1);
        break;
      case 'ArrowRight':
      case 'PageDown':
        e.preventDefault();
        handlePageChange(currentPage() + 1);
        break;
      case 'Home':
        e.preventDefault();
        handlePageChange(1);
        break;
      case 'End':
        e.preventDefault();
        handlePageChange(totalPages());
        break;
      case '+':
      case '=':
        if (e.ctrlKey) {
          e.preventDefault();
          handleZoomChange(zoomLevel() + 25);
        }
        break;
      case '-':
        if (e.ctrlKey) {
          e.preventDefault();
          handleZoomChange(zoomLevel() - 25);
        }
        break;
      case 'f':
        if (e.ctrlKey) {
          e.preventDefault();
          // Focus search input
          const searchInput = document.querySelector(
            '[data-testid="document-search"]'
          ) as any;
          searchInput?.focus();
        }
        break;
    }
  };

  // Initialize document based on type
  onMount(async () => {
    const { documentUrl, documentBytes } = props;
    if (props.documentType === 'pdf') {
      if (documentUrl) {
        await renderNativePDFPage(documentUrl, currentPage(), Math.max(0.25, zoomLevel() / 100));
        try {
          const total = await documentService.pdfGetPageCount(documentUrl);
          setTotalPages(total);
        } catch {
          // ignore
        }
      } else if (documentBytes) {
        await initializePDF(documentBytes);
      } else {
        setIsLoading(false);
      }
    } else if (props.documentType === 'epub') {
      if (documentBytes) await initializeEPUB(documentBytes as ArrayBuffer);
      else if (documentUrl) await initializeEPUB(documentUrl);
      else setIsLoading(false);
    } else {
      setIsLoading(false);
    }

    // Add keyboard event listener
    document.addEventListener('keydown', handleKeyDown);
    // Load persisted notes & lots
    try {
      const key = `dv:${props.documentUrl || props.title || 'doc'}`;
      const saved = JSON.parse(((window as any).localStorage.getItem(key) as any) || '{}');
      if (Array.isArray(saved.notes)) setNotes(saved.notes);
      if (Array.isArray(saved.highlights)) setHighlights(saved.highlights);
      if (Array.isArray(saved.textAnnotations)) setTextAnnotations(saved.textAnnotations);
      if (Array.isArray(saved.lots)) setLots(saved.lots);
      if (typeof saved.activeLotId === 'string') setActiveLotId(saved.activeLotId);
    } catch {/* ignore */}
  });

  // Cleanup
  onCleanup(() => {
    document.removeEventListener('keydown', handleKeyDown);
  });

  // Search effect
  createEffect(() => {
    const term = searchTerm();
    if (term) {
      performSearch(term);
    }
  });

  // Persist notes/highlights/text/lots (temporary local storage)
  createEffect(() => {
    try {
      const key = `dv:${props.documentUrl || props.title || 'doc'}`;
      (window as any).localStorage.setItem(
        key,
        JSON.stringify({ notes: notes(), highlights: highlights(), textAnnotations: textAnnotations(), lots: lots(), activeLotId: activeLotId() })
      );
    } catch {/* ignore */}
  });

  // Viewer classes
  const viewerClasses = () =>
    [
      styles.viewerContainer,
      props.class,
      readingMode() === 'fullscreen' && styles.fullscreen,
      readingMode() === 'focus' && styles.focusMode,
    ]
      .filter(Boolean)
      .join(' ');

  // Render document content based on type
  const renderDocumentContent = () => {
    if (error()) {
      return (
        <div class={styles.errorState}>
          <div class={styles.errorIcon}><AlertTriangle size={28} /></div>
          <div class={styles.errorText}>{error()}</div>
          <button class={styles.retryButton} onClick={() => setError(null)}>
            Retry
          </button>
        </div>
      );
    }

    switch (props.documentType) {
      case 'pdf':
        return (
          <div class={styles.pdfViewer}>
            <div class={styles.pageSurface} ref={setPageSurfaceRef}>
              <div ref={setCanvasWrapper} class={styles.canvasWrapper}>
            <canvas
              ref={setPdfCanvas}
              class={styles.pdfCanvas}
              title={props.title || 'PDF Document'}
                  style={`transform: rotate(${rotation()}deg); filter: ${invertColors() ? 'invert(1)' : 'invert(0)'} ${grayscale() ? 'grayscale(1)' : 'grayscale(0)'} brightness(${brightness()}%) contrast(${contrast()}%);`}
                  onMouseDown={handleSurfaceMouseDown}
                />
                <div class={styles.notesLayer}>
                  {/* Draft rectangle */}
                  {/* Rendered via styles.noteRectDraft dynamically in handler; no extra code here */}
                  {draftRect() && (
                    <div
                      class={styles.noteRectDraft}
                      style={`left:${draftRect()!.x * 100}%; top:${draftRect()!.y * 100}%; width:${draftRect()!.w * 100}%; height:${draftRect()!.h * 100}%;`}
                    />
                  )}
                  {/* Highlights */}
                  {highlights()
                    .filter(h => h.page === currentPage())
                    .map(h => (
                      <div
                        class={styles.highlightRect}
                        style={`left:${h.x * 100}%; top:${h.y * 100}%; width:${h.w * 100}%; height:${h.h * 100}%;`}
                        title="Highlight"
                      />
                    ))}
                  {/* Notes */}
                  {notes()
                    .filter(n => n.page === currentPage())
                    .map(n => (
                      <>
                        <div
                          class={styles.noteRect}
                          style={`left:${n.x * 100}%; top:${n.y * 100}%; width:${n.w * 100}%; height:${n.h * 100}%;`}
                          onClick={(e:any)=>{e.stopPropagation(); setAddNoteMode(false); openNoteEditor(n.id);}}
                          title={n.text || 'Note'}
                        />
                        {editingNoteId() === n.id && (
                          <div
                            class={styles.noteEditor}
                            style={`left: calc(${n.x * 100}% + ${n.w * 100}% + 8px); top: ${n.y * 100}%;`}
                            onClick={(e:any)=>e.stopPropagation()}
                          >
                            <div class={styles.noteEditorHeader}>
                              <span>Note</span>
                              <div class={styles.noteEditorActions}>
                                <button class={styles.smallBtn} onClick={() => deleteNote(n.id)}>Delete</button>
                                <button class={styles.smallBtn} onClick={() => { updateNoteText(n.id, editorText()); setEditingNoteId(null); }}>Close</button>
                              </div>
                            </div>
                            <textarea
                              class={styles.noteEditorInput}
                              rows={4}
                              value={editorText()}
                              onInput={(e:any)=>{ const val=(e.target as any).value; setEditorText(val); }}
                              onBlur={()=> updateNoteText(n.id, editorText())}
                              onKeyDown={(e:any)=>{ e.stopPropagation(); if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { updateNoteText(n.id, editorText()); setEditingNoteId(null); } }}
                            />
                            <div class={styles.noteEditorRow}>
                              <label>Lot</label>
                              <select value={n.lotId || ''} onInput={(e:any)=>assignNoteLot(n.id, (e.target as any).value)}>
                                <option value=''>None</option>
                                {lots().map(l => (
                                  <option value={l.id}>{l.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}
                      </>
                    ))}
                  {/* Text Annotations */}
                  {textAnnotations()
                    .filter(t => t.page === currentPage())
                    .map(t => (
                      <>
                        <div
                          class={styles.textAnno}
                          style={`left:${t.x * 100}%; top:${t.y * 100}%; color:${t.color || '#e5e7eb'}; font-size:${t.size || 14}px;`}
                          onClick={(e:any)=>{ e.stopPropagation(); setEditingTextId(t.id); setTextEditorValue(t.text); }}
                        >
                          {t.text || 'Click to write'}
                        </div>
                        {editingTextId() === t.id && (
                          <div class={styles.textEditor} style={`left:${t.x * 100}%; top:${t.y * 100}%;`} onClick={(e:any)=>e.stopPropagation()}>
                            <input
                              class={styles.textEditorInput}
                              value={textEditorValue()}
                              onInput={(e:any)=>setTextEditorValue((e.target as any).value)}
                              onKeyDown={(e:any)=>{ e.stopPropagation(); if (e.key==='Enter') { setTextAnnotations(textAnnotations().map(x=>x.id===t.id?{...x,text:textEditorValue()}:x)); setEditingTextId(null); } }}
                              onBlur={()=>{ setTextAnnotations(textAnnotations().map(x=>x.id===t.id?{...x,text:textEditorValue()}:x)); setEditingTextId(null); }}
                            />
                          </div>
                        )}
                      </>
                    ))}
                </div>
                {/* Text layer overlay for pdf.js selection */}
                <Show when={pdfDocument()}>
                  <div
                    ref={setTextLayerEl as any}
                    class={styles.pdfTextLayer}
                    onMouseUp={handleTextLayerMouseUp}
                    style="position:absolute; inset:0; pointer-events:auto; color: transparent; user-select:text;"
                  />
                </Show>
              </div>
            </div>
            <Show when={isLoading()}>
              <div class={styles.loadingOverlay}>
                <div class={styles.loadingSpinner}></div>
                <div class={styles.loadingText}>Loading document...</div>
              </div>
            </Show>
          </div>
        );

      case 'epub':
        return (
          <div class={styles.epubViewer}>
            <div id="epub-container" class={styles.epubContent}>
              {/* EPUB content will be rendered here by EPUB.js */}
            </div>
            <Show when={isLoading()}>
              <div class={styles.loadingOverlay}>
                <div class={styles.loadingSpinner}></div>
                <div class={styles.loadingText}>Loading document...</div>
              </div>
            </Show>
          </div>
        );

      case 'text':
      case 'markdown':
        return (
          <div class={styles.textViewer}>
            <div class={styles.textContent} style={`font-size: ${zoomLevel()}%`}>
              <pre class={styles.textPre}>{props.documentContent}</pre>
            </div>
          </div>
        );

      default:
        return (
          <div class={styles.unsupportedType}>
              <div class={styles.unsupportedIcon}><FileWarning size={28} /></div>
            <div class={styles.unsupportedText}>
              Unsupported document type: {props.documentType}
            </div>
          </div>
        );
    }
  };

  return (
    <div
      class={viewerClasses()}
      data-testid={props['data-testid']}
      data-cultural-theme={props.culturalContext?.theme || 'default'}
    >
      {/* Document Header (off by default to avoid duplicating page title) */}
      <Show when={!!props.showHeader && !!props.title}>
        <div class={styles.documentHeader}>
          <h2 class={styles.documentTitle}>{props.title}</h2>

          {/* Cultural Context Indicator */}
          <Show when={showCulturalContext() && props.culturalContext}>
            <div class={styles.culturalIndicator}>
              <Leaf size={16} />
              <span class={styles.culturalText}>Cultural context available</span>
            </div>
          </Show>
        </div>
      </Show>

      {/* Document Controls */}
      <Show when={showControls()}>
        <div class={styles.documentControls}>
          {/* Left: Navigation */}
          <div class={styles.navigationControls}>
            <button
              class={styles.controlButton}
              onClick={() => handlePageChange(1)}
              disabled={currentPage() === 1}
              aria-label="First page"
            >
              <ChevronsLeft size={16} />
            </button>

            <button
              class={styles.controlButton}
              onClick={() => handlePageChange(currentPage() - 1)}
              disabled={currentPage() === 1}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>

            <div class={styles.pageInfo}>
              {currentPage()} / {totalPages()}
            </div>

            <button
              class={styles.controlButton}
              onClick={() => handlePageChange(currentPage() + 1)}
              disabled={currentPage() === totalPages()}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>

            <button
              class={styles.controlButton}
              onClick={() => handlePageChange(totalPages())}
              disabled={currentPage() === totalPages()}
              aria-label="Last page"
            >
              <ChevronsRight size={16} />
            </button>
          </div>

          {/* Center: Zoom & Fit */}
          <div class={styles.zoomControls}>
            <button
              class={styles.zoomButton}
              onClick={() => handleZoomChange(zoomLevel() - 25)}
              disabled={zoomLevel() <= 25}
              aria-label="Zoom out"
            >
              <ZoomOut size={14} />
            </button>

            <div class={styles.zoomLevel}>{zoomLevel()}%</div>

            <button
              class={styles.zoomButton}
              onClick={() => handleZoomChange(zoomLevel() + 25)}
              disabled={zoomLevel() >= 500}
              aria-label="Zoom in"
            >
              <ZoomIn size={14} />
            </button>

            <button
              class={styles.zoomButton}
              onClick={fitToWidth}
              aria-label="Fit to width"
              title="Fit to width"
            >
              Fit
            </button>
            <button
              class={styles.zoomButton}
              onClick={() => handleZoomChange(100)}
              aria-label="Actual size"
              title="Actual size"
            >
              100%
            </button>

            <button
              class={styles.zoomButton}
              onClick={toggleFullscreen}
              aria-label={isFullscreen() ? 'Exit fullscreen' : 'Enter fullscreen'}
              title={isFullscreen() ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen() ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </div>

          {/* Right: Editing tools */}
          <div class={styles.editControls}>
            <button
              class={`${styles.zoomButton} ${styles.annotationsToggle}`}
              onClick={() => setShowAnnotations(!showAnnotations())}
              aria-label="Toggle annotations"
              title="Toggle annotations"
            >
              <span class={styles.annotationsLabel}>Annotations</span>
            </button>
            <button
              class={styles.zoomButton}
              data-active={addNoteMode() ? 'true' : 'false'}
              onClick={() => setAddNoteMode(!addNoteMode())}
              aria-label={addNoteMode() ? 'Cancel add note' : 'Add note'}
              title={addNoteMode() ? 'Cancel add note' : 'Add note'}
            >
              Add note
            </button>
            <button
              class={styles.zoomButton}
              data-active={addHighlightMode() ? 'true' : 'false'}
              onClick={() => setAddHighlightMode(!addHighlightMode())}
              aria-label={addHighlightMode() ? 'Cancel highlight' : 'Highlight'}
              title={addHighlightMode() ? 'Cancel highlight' : 'Highlight'}
            >
              Highlight
            </button>
            <button
              class={styles.zoomButton}
              data-active={addTextMode() ? 'true' : 'false'}
              onClick={() => setAddTextMode(!addTextMode())}
              aria-label={addTextMode() ? 'Cancel text' : 'Text'}
              title={addTextMode() ? 'Cancel text' : 'Text annotation'}
            >
              Text
            </button>
            <button class={styles.zoomButton} onClick={rotateLeft} aria-label="Rotate left">
              <RotateCcw size={14} />
            </button>
            <button class={styles.zoomButton} onClick={rotateRight} aria-label="Rotate right">
              <RotateCw size={14} />
            </button>
            <button
              class={styles.zoomButton}
              onClick={() => setInvertColors(!invertColors())}
              aria-label="Invert colors"
              title="Invert colors"
            >
              <Wand2 size={14} />
            </button>
            <button
              class={styles.zoomButton}
              onClick={() => setShowEditor(!showEditor())}
              aria-label="Open adjustments"
              title="Adjust view"
            >
              <SlidersHorizontal size={14} />
            </button>

            <div class={styles.exportMenu}>
              <button class={styles.zoomButton} aria-label="Export" title="Export" onClick={()=>setShowExport(!showExport())}>Export</button>
              {showExport() && (
                <div class={styles.exportDropdown}>
                  <button class={styles.exportItem} onClick={async()=>{
                    setShowExport(false);
                    if (!props.documentUrl) return;
                    const noteOverlays = notes().map(n=>({
                      page: n.page,
                      x: n.x, y: n.y, w: n.w, h: n.h,
                      fill_rgba: [59,130,246,64] as [number,number,number,number],
                      stroke_rgba: [99,102,241,180] as [number,number,number,number],
                      stroke_width: 2
                    }));
                    const hlOverlays = highlights().map(h=>({
                      page: h.page,
                      x: h.x, y: h.y, w: h.w, h: h.h,
                      fill_rgba: [253, 230, 138, 96] as [number,number,number,number],
                      stroke_rgba: [234, 179, 8, 140] as [number,number,number,number],
                      stroke_width: 1
                    }));
                    const overlays = [...noteOverlays, ...hlOverlays];
                    try {
                      await documentService.exportAnnotatedPngs(
                        props.documentUrl,
                        overlays,
                        Math.max(1, Math.round(zoomLevel()/100))
                      );
                    } catch {
                      // ignore
                    }
                  }}>Annotated PNGs</button>
                </div>
              )}
            </div>
          </div>

          {/* Search indicator */}
          <Show when={searchTerm()}>
            <div class={styles.searchControls}>
              <Search size={16} />
              <span>{searchResults().length} results</span>
            </div>
          </Show>
        </div>
      </Show>

      {/* Document Content */}
      <div class={styles.documentContent}>{renderDocumentContent()}</div>

      {/* Annotations Drawer (overlays viewer; togglable) */}
      <Show when={showAnnotations()}>
        <div class={styles.annotationsOverlay} onClick={() => setShowAnnotations(false)} />
      </Show>
      <aside class={`${styles.annotationsPanel} ${showAnnotations() ? styles.open : ''}`}>
        <div class={styles.annotationsHeaderRow}>
          <div class={styles.annotationsTitle}>Annotations</div>
          <button
            class={styles.drawerClose}
            aria-label="Close annotations"
            onClick={() => setShowAnnotations(false)}
          >
            ×
          </button>
        </div>

        {/* Lots Manager */}
        <div class={styles.lotsSection}>
          <div class={styles.lotsHeaderRow}>
            <div class={styles.lotsTitle}>Lots</div>
            <div class={styles.lotAddRow}>
              <input
                class={styles.lotInput}
                placeholder="New lot"
                value={newLotName()}
                onInput={(e:any)=>setNewLotName((e.target as any).value)}
              />
              <button
                class={styles.smallBtn}
                onClick={() => {
                  const name = newLotName().trim();
                  if (!name) return;
                  const lot: Lot = { id: Math.random().toString(36).slice(2), name };
                  setLots([...lots(), lot]);
                  setNewLotName('');
                }}
              >Add</button>
            </div>
          </div>
          <div class={styles.lotChips}>
            <button
              class={`${styles.lotChip} ${activeLotId()==='all' ? styles.lotChipActive : ''}`}
              onClick={()=>setActiveLotId('all')}
            >All ({notes().length})</button>
            {lots().map(l => (
              <button
                class={`${styles.lotChip} ${activeLotId()===l.id ? styles.lotChipActive : ''}`}
                onClick={()=>setActiveLotId(l.id)}
              >{l.name} ({notes().filter(n=>n.lotId===l.id).length})</button>
            ))}
          </div>
        </div>

        {/* Global Notes (side notes) */}
        <div class={styles.drawerSection}>
          <div class={styles.sectionTitle}>Global notes</div>
          <div class={styles.globalAddRow}>
            <button
              class={styles.smallBtn}
              onClick={() => {
                globalNotesStore.add({
                  docPath: props.documentPath as string | undefined,
                  page: currentPage(),
                  title: `Note p.${currentPage()}`,
                  content: '',
                });
              }}
            >Add</button>
          </div>
          <ul class={styles.annotationsList}>
            {globalNotesStore.listByDoc(props.documentPath).map(gn => (
              <li class={styles.annotationItem}>
                <div class={styles.annotationMeta}>
                  <span class={styles.annotationBadge}>global</span>
                  <span class={styles.annotationPage}>p.{gn.page ?? '-'}</span>
                </div>
                <div class={styles.annotationText}>
                  <input
                    class={styles.lotInput}
                    value={gn.title || ''}
                    onInput={(e:any)=>globalNotesStore.update(gn.id, { title: (e.target as any).value })}
                    placeholder="Title"
                  />
                  <textarea
                    class={styles.noteEditorInput}
                    rows={3}
                    value={gn.content}
                    onInput={(e:any)=>globalNotesStore.update(gn.id, { content: (e.target as any).value })}
                    placeholder="Write your side note here"
                  />
                </div>
                <div class={styles.annotationActions}>
                  <button class={styles.smallBtn} onClick={()=> gn.page && handlePageChange(gn.page!)}>Open</button>
                  <button class={styles.smallBtn} onClick={()=> globalNotesStore.remove(gn.id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Notes list */}
        <div class={styles.drawerSection}>
          <div class={styles.sectionTitle}>Notes</div>
          <Show when={notes().length>0} fallback={<div class={styles.emptyAnnotations}>No notes yet</div>}>
            <ul class={styles.annotationsList}>
              {notes()
                .filter(n => activeLotId()==='all' ? true : n.lotId===activeLotId())
                .map(n => (
                  <li class={styles.annotationItem}>
                    <div class={styles.annotationMeta}>
                      <span class={styles.annotationBadge}>{n.lotId ? 'lot' : 'note'}</span>
                      <span class={styles.annotationPage}>p.{n.page}</span>
                    </div>
                    <div class={styles.annotationText}>{n.text || '—'}</div>
                    <div class={styles.annotationActions}>
                      <button class={styles.smallBtn} onClick={()=>{ setCurrentPage(n.page); setEditingNoteId(n.id); }}>Open</button>
                    </div>
                  </li>
                ))}
            </ul>
          </Show>
        </div>
      </aside>

      {/* Editor Panel */}
      <Show when={showEditor()}>
        <div class={styles.editorPanel}>
          <div class={styles.editorRow}>
            <label>Brightness</label>
            <input type="range" min="50" max="150" value={brightness()} onInput={e => setBrightness(Number((e.target as any).value))} />
          </div>
          <div class={styles.editorRow}>
            <label>Contrast</label>
            <input type="range" min="50" max="150" value={contrast()} onInput={e => setContrast(Number((e.target as any).value))} />
          </div>
          <div class={styles.editorRowToggle}>
            <label><input type="checkbox" checked={grayscale()} onInput={e => setGrayscale((e.target as any).checked)} /> Grayscale</label>
          </div>
        </div>
      </Show>

      {/* Cultural Context Overlay */}
      <Show when={showCulturalContext() && props.culturalContext && !isLoading()}>
        <div class={styles.culturalOverlay}>
          <BookOpen size={16} />
          <span>Cultural context available</span>
        </div>
      </Show>
    </div>
  );
};
