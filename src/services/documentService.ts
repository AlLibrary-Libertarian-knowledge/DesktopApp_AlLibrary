import { invoke } from '@tauri-apps/api/core';
import { settingsService } from '@/services/storage/settingsService';
import { networkFacade } from '@/services/network/networkFacade';
import { transferFacade } from '@/services/network/transferFacade';

export interface DocumentDetailModel {
  id: string;
  title: string;
  filePath: string;
  format: string;
  fileSize: number;
  source: 'local' | 'network';
  networkLink?: string;
  contentHash?: string;
  peerCount?: number;
}

interface CachedFileWire {
  name: string;
  size: number;
  link: string;
  content_hash: string;
  peer_count: number;
}

function looksLikeFilesystemPath(value: string): boolean {
  const v = value.trim();
  return v.includes('/') || v.includes('\\') || /^[a-zA-Z]:/.test(v);
}

function docInfoToDetailModel(info: DocumentInfo): DocumentDetailModel {
  return {
    id: info.id,
    title: info.metadata.title || info.filename,
    filePath: info.file_path,
    format: info.document_type.toLowerCase(),
    fileSize: info.file_size,
    source: 'local',
    contentHash: info.id,
  };
}

function networkFileToDetailModel(file: {
  contentHash: string;
  name: string;
  size: number;
  link: string;
  peerCount: number;
}): DocumentDetailModel {
  return {
    id: file.contentHash,
    title: file.name,
    filePath: file.link,
    format: file.name.split('.').pop()?.toLowerCase() || 'unknown',
    fileSize: file.size,
    source: 'network',
    networkLink: file.link,
    contentHash: file.contentHash,
    peerCount: file.peerCount,
  };
}

export interface DocumentInfo {
  id: string;
  filename: string;
  file_path: string;
  file_size: number;
  document_type: string;
  created_at: string;
  modified_at: string;
  cultural_context?: CulturalContext;
  metadata: DocumentMetadata;
  is_treated?: boolean;
  processing_status?: string;
  content_hash?: string;
  canonical_name?: string;
  original_filename?: string;
}

export interface CulturalContext {
  sensitivity_level: number;
  cultural_origin?: string;
  traditional_knowledge: boolean;
  educational_resources: string[];
  community_acknowledgment?: string;
}

export interface DocumentMetadata {
  title?: string;
  author?: string;
  description?: string;
  tags: string[];
  categories: string[];
  language?: string;
  page_count?: number;
  word_count?: number;
}

export interface ScanResult {
  documents_found: number;
  total_size: number;
  scan_duration_ms: number;
  documents: DocumentInfo[];
  errors: string[];
}

export interface FolderInfo {
  path: string;
  exists: boolean;
  document_count: number;
  total_size: number;
  last_scan?: string;
}

class DocumentService {
  /**
   * Scan a folder for documents and return information about found files
   */
  async scanDocumentsFolder(folderPath?: string): Promise<ScanResult> {
    try {
      const base = folderPath || (await settingsService.getProjectFolder()) || '';
      console.log('🔍 Starting document scan for folder:', base);
      const result = await invoke<ScanResult>('scan_documents_folder', {
        folderPath: base,
      });

      console.log('✅ Scan completed successfully:', {
        documentsFound: result.documents_found,
        totalSize: result.total_size,
        scanDuration: result.scan_duration_ms,
        documents: result.documents.length,
        errors: result.errors.length,
      });

      if (result.errors.length > 0) {
        console.warn('⚠️ Scan completed with errors:', result.errors);
      }

      return result;
    } catch (error) {
      console.error('❌ Failed to scan documents folder:', error);
      throw new Error(`Failed to scan documents folder: ${error}`);
    }
  }

  /**
   * Get information about a specific folder
   */
  async getFolderInfo(folderPath?: string): Promise<FolderInfo> {
    try {
      const base = folderPath || (await settingsService.getProjectFolder()) || '';
      const result = await invoke<FolderInfo>('get_folder_info', {
        folderPath: base,
      });

      console.log('Folder info:', result);
      return result;
    } catch (error) {
      console.error('Failed to get folder info:', error);
      throw new Error(`Failed to get folder info: ${error}`);
    }
  }

  /**
   * Get a list of documents in a folder (non-recursive)
   */
  async listDocumentsInFolder(folderPath?: string): Promise<DocumentInfo[]> {
    try {
      const base = folderPath || (await settingsService.getProjectFolder()) || '';
      const result = await invoke<DocumentInfo[]>('list_documents_in_folder', {
        folderPath: base,
      });

      console.log('Documents in folder:', result);
      return result;
    } catch (error) {
      console.error('Failed to list documents in folder:', error);
      throw new Error(`Failed to list documents in folder: ${error}`);
    }
  }

  /**
   * Get detailed information about a specific document
   */
  async getDocumentInfo(filePath: string): Promise<DocumentInfo> {
    try {
      const result = await invoke<DocumentInfo>('get_document_info', {
        filePath,
      });

      console.log('Document info:', result);
      return result;
    } catch (error) {
      console.error('Failed to get document info:', error);
      throw new Error(`Failed to get document info: ${error}`);
    }
  }

  /**
   * Open a document and return its content for preview
   */
  async openDocument(filePath: string): Promise<Uint8Array> {
    try {
      const result = await invoke<number[]>('open_document', {
        filePath,
      });

      console.log('Document opened, size:', result.length);
      return new Uint8Array(result);
    } catch (error) {
      console.error('Failed to open document:', error);
      throw new Error(`Failed to open document: ${error}`);
    }
  }

  /**
   * Native PDF rendering via Tauri (PDFium)
   */
  async pdfGetPageCount(filePath: string): Promise<number> {
    return await invoke<number>('pdf_get_page_count', { filePath });
  }

  async pdfRenderPagePng(filePath: string, pageIndex: number, scale = 2): Promise<Uint8Array> {
    const bytes = await invoke<number[]>('pdf_render_page_png', {
      filePath,
      pageIndex,
      scale,
    });
    return new Uint8Array(bytes);
  }

  async exportAnnotatedPngs(
    filePath: string,
    overlays: Array<{
      page: number;
      x: number;
      y: number;
      w: number;
      h: number;
      fill_rgba: [number, number, number, number];
      stroke_rgba: [number, number, number, number];
      stroke_width: number;
    }>,
    scale = 1
  ): Promise<string[]> {
    return await invoke<string[]>('export_annotated_pngs', { filePath, overlays, scale });
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
  }

  /**
   * Get document type icon
   */
  getDocumentTypeIcon(documentType: string): string {
    switch (documentType.toLowerCase()) {
      case 'pdf':
        return '📄';
      case 'epub':
        return '📚';
      case 'txt':
        return '📝';
      case 'md':
      case 'markdown':
        return '📖';
      case 'html':
      case 'htm':
        return '🌐';
      case 'rtf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📄';
      default:
        return '📄';
    }
  }

  /**
   * Get cultural sensitivity level description
   */
  getCulturalSensitivityDescription(level: number): string {
    switch (level) {
      case 1:
        return 'General access - Educational content available';
      case 2:
        return 'Traditional knowledge - Cultural context provided';
      case 3:
        return 'Sacred content - Educational resources available';
      case 4:
        return 'Restricted access - Community approval required';
      case 5:
        return 'Highly restricted - Elder approval required';
      default:
        return 'Unknown sensitivity level';
    }
  }

  /**
   * Check if document type is supported
   */
  isSupportedDocumentType(documentType: string): boolean {
    const supportedTypes = [
      'pdf',
      'epub',
      'txt',
      'md',
      'markdown',
      'html',
      'htm',
      'rtf',
      'doc',
      'docx',
    ];
    return supportedTypes.includes(documentType.toLowerCase());
  }

  /**
   * Get default AlLibrary folder path based on platform
   */
  getDefaultAlLibraryPath(): string {
    if (navigator.platform.includes('Win')) {
      return 'D:\\AlLibrary'; // Based on your screenshot showing D: drive
    } else if (navigator.platform.includes('Mac')) {
      return '~/AlLibrary'; // Browser-safe alternative
    } else {
      return '~/AlLibrary'; // Browser-safe alternative
    }
  }

  /**
   * Auto-detect AlLibrary folder
   */
  async detectAlLibraryFolder(): Promise<string | null> {
    const possiblePaths = [
      this.getDefaultAlLibraryPath(),
      'D:\\AlLibrary',
      'C:\\AlLibrary',
      'C:\\Users\\tales\\AlLibrary',
      'C:\\Users\\tales\\Documents\\AlLibrary',
      'C:\\Users\\tales\\Desktop\\AlLibrary',
      // Browser-safe alternatives for HOME directory
      'C:\\Users\\tales\\AlLibrary',
      'C:\\Users\\tales\\Documents\\AlLibrary',
      'C:\\Users\\tales\\Desktop\\AlLibrary',
    ];

    for (const path of possiblePaths) {
      try {
        const folderInfo = await this.getFolderInfo(path);
        if (folderInfo.exists) {
          console.log('Found AlLibrary folder at:', path);
          return path;
        }
      } catch (error) {
        console.log('Path not found:', path);
      }
    }

    console.log('No AlLibrary folder found in common locations');
    return null;
  }

  buildDocumentUrl(id: string, opts?: { hud?: boolean }): string {
    const base = `/document/${encodeURIComponent(id)}`;
    return opts?.hud ? `${base}?hud=1` : base;
  }

  /** @deprecated Use buildDocumentUrl */
  buildReaderUrl(doc: { id: string; filePath: string; format: string; title: string }): string {
    return this.buildDocumentUrl(doc.id);
  }

  openInReader(
    navigate: (path: string) => void,
    doc: { filePath: string; format: string; title: string; id: string }
  ): void {
    navigate(this.buildDocumentUrl(doc.id));
  }

  async deleteLocalDocument(filePath: string): Promise<void> {
    await invoke('delete_local_document', { filePath });
  }

  async shareLocalDocument(filePath: string): Promise<{
    link: string;
    contentHash: string;
    name: string;
  }> {
    return transferFacade.addShare(filePath);
  }

  async resolveDocumentById(id: string): Promise<DocumentDetailModel | null> {
    const rawId = id.trim();
    if (!rawId) return null;

    let decoded = rawId;
    try {
      decoded = decodeURIComponent(rawId);
    } catch {
      decoded = rawId;
    }

    if (looksLikeFilesystemPath(decoded)) {
      try {
        const info = await this.getDocumentInfo(decoded);
        return docInfoToDetailModel(info);
      } catch {
        /* fall through */
      }
    }

    try {
      const scan = await this.scanDocumentsFolder();
      const localHit = scan.documents.find(d => d.id === rawId || d.id === decoded);
      if (localHit) {
        return docInfoToDetailModel(localHit);
      }
    } catch {
      /* fall through */
    }

    try {
      const lobbyFiles = await networkFacade.searchFiles('');
      const lobbyHit = lobbyFiles.find(
        f => f.contentHash === rawId || f.link === rawId || f.link === decoded
      );
      if (lobbyHit) {
        return networkFileToDetailModel(lobbyHit);
      }
    } catch {
      /* fall through */
    }

    try {
      const cached = await invoke<CachedFileWire[]>('search_network_cached', {
        query: rawId,
        limit: 20,
      });
      const cacheHit = cached.find(
        f => f.content_hash === rawId || f.link === rawId || f.name.includes(rawId)
      );
      if (cacheHit) {
        return networkFileToDetailModel({
          contentHash: cacheHit.content_hash,
          name: cacheHit.name,
          size: cacheHit.size,
          link: cacheHit.link,
          peerCount: cacheHit.peer_count,
        });
      }
    } catch {
      /* fall through */
    }

    return null;
  }
}

export const documentService = new DocumentService();
