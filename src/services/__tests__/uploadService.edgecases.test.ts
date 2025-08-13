import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UploadService } from '../upload/uploadService';

describe('uploadService edge cases', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Avoid real file reading/arrayBuffer allocations
    vi.spyOn(UploadService.prototype as any, 'readFileContent').mockResolvedValue(new ArrayBuffer(8));
    // Avoid hashing heavy buffers
    vi.spyOn(UploadService.prototype as any, 'calculateFileHash').mockResolvedValue('hash');
  });

  const makeFakeFile = (overrides: Partial<File> & { name: string; type: string; size?: number }): File => {
    const fileLike: any = {
      name: overrides.name,
      type: overrides.type,
      size: overrides.size ?? 1024,
      arrayBuffer: async () => new ArrayBuffer(8),
    };
    return fileLike as File;
  };

  it('rejects files exceeding max size', async () => {
    const svc = new UploadService();
    // Simulate 200MB without allocating memory
    const big = makeFakeFile({ name: 'big.pdf', type: 'application/pdf', size: 200 * 1024 * 1024 });
    const res = await svc.uploadDocument(big, { title: 'big' }, { userId: 'u' });
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/exceeds maximum allowed size/i);
  });

  it('rejects unsupported formats', async () => {
    const svc = new UploadService();
    const f = makeFakeFile({ name: 'file.exe', type: 'application/octet-stream', size: 1024 });
    const res = await svc.uploadDocument(f, { title: 'exe' }, { userId: 'u' });
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/Unsupported file format/i);
  });
});
