import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadService, UploadService } from '../upload/uploadService';

// Mock validationService imported by uploadService via ../validationService
vi.mock('../validationService', () => {
  return {
    validationService: {
      validateDocument: vi.fn(),
    },
  };
});

const { validationService } = await import('../validationService');

const makeFile = (name = 'doc.pdf', size = 1024, type = 'application/pdf') => {
  const blob = new Blob(['x'.repeat(size)], { type });
  return new File([blob], name, { type });
};

describe('uploadService integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Bypass file content and hashing in test environment
    vi.spyOn(UploadService.prototype as any, 'readFileContent').mockResolvedValue(
      new ArrayBuffer(8)
    );
    vi.spyOn(UploadService.prototype as any, 'calculateFileHash').mockResolvedValue(
      'deadbeef'
    );
  });

  it('happy path: sanitize→malware→legal passes and persists info-only cultural metadata', async () => {
    (validationService.validateDocument as any).mockResolvedValue({
      valid: true,
      errors: [],
      securityValidation: { valid: true },
      culturalAnalysis: {
        detectedLevel: 2,
        suggestedContext: 'educational',
        recommendedInformation: ['context1'],
      },
    });

    const file = makeFile();
    const res = await uploadService.uploadDocument(
      file,
      { title: 'My doc', culturalSensitivityLevel: 2, culturalOrigin: 'origin' },
      { userId: 'user1', onProgress: () => {} }
    );

    expect(res.success).toBe(true);
    expect(res.document?.culturalMetadata.informationOnly).toBe(true);
    expect(res.document?.securityValidation.passed).toBe(true);
  });

  it('blocks on malware/security failure', async () => {
    (validationService.validateDocument as any).mockResolvedValue({
      valid: false,
      errors: ['malware detected'],
      securityValidation: { valid: false, error: 'malware detected' },
      culturalAnalysis: { detectedLevel: 1, recommendedInformation: [] },
    });

    const file = makeFile();
    const svc = new UploadService();
    // Ensure the instance uses the same spies
    vi.spyOn(UploadService.prototype as any, 'readFileContent').mockResolvedValue(
      new ArrayBuffer(8)
    );
    vi.spyOn(UploadService.prototype as any, 'calculateFileHash').mockResolvedValue('deadbeef');
    const res = await svc.uploadDocument(file, { title: 'Bad doc' }, { userId: 'user1', onProgress: () => {} });

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/Validation failed/i);
  });

  it('blocks on legal failure', async () => {
    (validationService.validateDocument as any).mockResolvedValue({
      valid: false,
      errors: ['security ok', 'format ok', 'legal non-compliant'],
      securityValidation: { valid: true },
      culturalAnalysis: { detectedLevel: 1, recommendedInformation: [] },
    });

    const file = makeFile('doc.pdf');
    const svc = new UploadService();
    vi.spyOn(UploadService.prototype as any, 'readFileContent').mockResolvedValue(
      new ArrayBuffer(8)
    );
    vi.spyOn(UploadService.prototype as any, 'calculateFileHash').mockResolvedValue('deadbeef');
    const res = await svc.uploadDocument(file, { title: 'doc' }, { userId: 'u', onProgress: () => {} });

    expect(res.success).toBe(false);
  });
});
