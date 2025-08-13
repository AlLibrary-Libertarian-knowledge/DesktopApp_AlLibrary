import { describe, it, expect, vi } from 'vitest';
import type { Document } from '@/types/Document';
import { SearchService } from '../searchService';

// Mock the services/index module used by searchService to supply validationService
vi.mock('../index', () => {
  return {
    validationService: {
      getCulturalInformation: vi.fn().mockResolvedValue({
        informationOnly: true,
        educationalPurpose: true,
      }),
    },
  };
});

describe('Cultural info-only policy', () => {
  const makeDoc = (overrides: Partial<Document> = {}): Document => ({
    id: 'doc1',
    title: 'Sample',
    description: '',
    format: 'pdf' as any,
    contentType: 'EDUCATIONAL' as any,
    status: 'ACTIVE' as any,
    filePath: '/doc.pdf',
    originalFilename: 'doc.pdf',
    fileSize: 10,
    fileHash: 'hash',
    mimeType: 'application/pdf',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user1',
    version: 1,
    culturalMetadata: {
      sensitivityLevel: 3 as any,
      culturalOrigin: 'origin',
      traditionalProtocols: [],
      educationalResources: [],
      informationOnly: true,
      educationalPurpose: true,
    },
    tags: [],
    categories: [],
    language: 'en',
    authors: [],
    accessHistory: [],
    relationships: [],
    securityValidation: {
      validatedAt: new Date(),
      passed: true,
      malwareScanResult: {
        clean: true,
        threats: [],
        scanEngine: 'test',
        scanDate: new Date(),
      },
      integrityCheck: {
        valid: true,
        expectedHash: 'hash',
        actualHash: 'hash',
        algorithm: 'SHA-256',
      },
      legalCompliance: { compliant: true, issues: [], jurisdiction: 'local' },
      issues: [],
    },
    contentVerification: {
      signature: '',
      algorithm: 'SHA-256',
      verifiedAt: new Date(),
      chainOfCustody: [],
      authentic: true,
      verificationProvider: 'test',
    },
    sourceAttribution: {
      originalSource: 'user',
      sourceType: 'individual',
      credibilityIndicators: [],
      sourceVerified: false,
      attributionRequirements: [],
    },
    ...overrides,
  });

  it('always returns true for access and never throws (happy path)', async () => {
    const svc = new SearchService();
    const result = await svc.validateCulturalAccess(makeDoc(), 'user1');
    expect(result).toBe(true);
  });

  it('still returns true when cultural info retrieval fails', async () => {
    const mod = await import('../index');
    (mod.validationService.getCulturalInformation as any).mockRejectedValueOnce(
      new Error('network error')
    );
    const svc = new SearchService();
    const result = await svc.validateCulturalAccess(makeDoc(), 'user1');
    expect(result).toBe(true);
  });
});

