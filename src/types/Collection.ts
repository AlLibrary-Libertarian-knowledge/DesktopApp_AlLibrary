/**
 * Minimal collection types for local document grouping.
 */

export interface Collection {
  id: string;
  name: string;
  description?: string;
  documentIds: string[];
  documentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCollectionRequest {
  name: string;
  description?: string;
  documentIds?: string[];
}

export interface UpdateCollectionRequest {
  name?: string;
  description?: string;
}

export interface CollectionDocument {
  id: string;
  title: string;
  fileType: string;
  fileSize: number;
  localPath?: string;
}

interface CollectionResponseRaw {
  id: string;
  name: string;
  description?: string | null;
  document_count: number;
  document_ids?: string[] | null;
  created_at: string;
  updated_at: string;
}

interface CollectionDocumentRaw {
  id: string;
  title: string;
  file_type: string;
  file_size: number;
  local_path?: string | null;
}

export function mapCollection(raw: CollectionResponseRaw): Collection {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description ?? undefined,
    documentIds: raw.document_ids ?? [],
    documentCount: raw.document_count,
    createdAt: new Date(raw.created_at),
    updatedAt: new Date(raw.updated_at),
  };
}

export function mapCollectionDocument(raw: CollectionDocumentRaw): CollectionDocument {
  return {
    id: raw.id,
    title: raw.title,
    fileType: raw.file_type,
    fileSize: raw.file_size,
    localPath: raw.local_path ?? undefined,
  };
}
