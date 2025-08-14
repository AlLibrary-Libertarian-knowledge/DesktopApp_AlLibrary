import { invoke } from '@tauri-apps/api/core';
import type { Document } from '@/types/Document';

export interface Comment {
  id: string;
  documentId: string;
  authorId: string;
  authorName?: string;
  text: string;
  createdAt: string;
  updatedAt?: string;
  reactions?: { [emoji: string]: number };
}

export interface CreateCommentInput {
  documentId: string;
  text: string;
}

class CommentService {
  async list(documentId: string): Promise<Comment[]> {
    try {
      const comments = await invoke<Comment[]>('list_comments', { documentId });
      return Array.isArray(comments) ? comments : [];
    } catch (error) {
      console.error('Failed to list comments:', error);
      return [];
    }
  }

  async add(input: CreateCommentInput): Promise<Comment | null> {
    try {
      const comment = await invoke<Comment>('add_comment', { input });
      return comment ?? null;
    } catch (error) {
      console.error('Failed to add comment:', error);
      return null;
    }
  }

  async edit(commentId: string, text: string): Promise<boolean> {
    try {
      return await invoke<boolean>('edit_comment', { commentId, text });
    } catch (error) {
      console.error('Failed to edit comment:', error);
      return false;
    }
  }

  async remove(commentId: string): Promise<boolean> {
    try {
      return await invoke<boolean>('delete_comment', { commentId });
    } catch (error) {
      console.error('Failed to delete comment:', error);
      return false;
    }
  }
}

export const commentService = new CommentService();




