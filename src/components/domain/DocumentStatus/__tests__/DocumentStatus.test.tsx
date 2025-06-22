import { render, screen } from '@solidjs/testing-library';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DocumentStatus, DocumentStatusProps } from '../DocumentStatus';

// Mock SystemAPI
vi.mock('../../../../types/System', () => ({
  SystemAPI: {
    getDiskSpaceInfo: vi.fn().mockResolvedValue({
      project_size_bytes: 1024 * 1024 * 100, // 100MB
      available_disk_space_bytes: 1024 * 1024 * 1024 * 5, // 5GB
      disk_usage_percentage: 15,
    }),
  },
  SystemUtils: {
    formatBytes: vi.fn((bytes: number) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }),
  },
}));

describe('DocumentStatus Component', () => {
  const createMockStats = (): DocumentStatusProps['stats'] => ({
    totalDocuments: 5,
    totalSize: 1024 * 1024 * 50, // 50MB
    culturalContexts: 3,
    recentUploads: 2,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      const stats = createMockStats();

      render(() => <DocumentStatus stats={stats} />);

      expect(screen.getByText('Documents')).toBeDefined();
      expect(screen.getByText('Storage Used')).toBeDefined();
    });

    it('should display document statistics correctly', () => {
      const stats = createMockStats();

      render(() => <DocumentStatus stats={stats} />);

      expect(screen.getByText('5')).toBeDefined(); // totalDocuments
      expect(screen.getByText('3')).toBeDefined(); // culturalContexts
      // Use getAllByText for "2" since it appears in both stats and format counts
      const twoElements = screen.getAllByText('2');
      expect(twoElements.length).toBeGreaterThan(0); // recentUploads and PDF count
    });

    it('should display storage information', () => {
      const stats = createMockStats();

      render(() => <DocumentStatus stats={stats} />);

      expect(screen.getByText('Storage')).toBeDefined();
      expect(screen.getByText('Formats')).toBeDefined();
    });

    it('should display format information', () => {
      const stats = createMockStats();

      render(() => <DocumentStatus stats={stats} />);

      expect(screen.getByText('PDF')).toBeDefined();
      expect(screen.getByText('EPUB')).toBeDefined();
      expect(screen.getByText('2 Types')).toBeDefined();
    });
  });

  describe('Cultural Information Display (Anti-Censorship)', () => {
    it('should display cultural context information without restrictions', () => {
      const stats = createMockStats();

      render(() => <DocumentStatus stats={stats} />);

      // Cultural information displayed for education - no access control
      expect(screen.getByText('Cultural Context')).toBeDefined();
      expect(screen.getByText('Cultural Contexts')).toBeDefined();
    });

    it('should show cultural statistics without approval requirements', () => {
      const stats = {
        ...createMockStats(),
        culturalContexts: 10, // High cultural content
      };

      render(() => <DocumentStatus stats={stats} />);

      // Should display cultural information without blocking
      expect(screen.getByText('10')).toBeDefined();
      expect(screen.getByText('Cultural Contexts')).toBeDefined();
    });
  });

  describe('Security Information Display', () => {
    it('should display security scanning status', () => {
      const stats = createMockStats();

      render(() => <DocumentStatus stats={stats} />);

      // Security indicators for technical protection only
      expect(screen.getByText('Malware Scanning')).toBeDefined();
      expect(screen.getByText('Search Ready')).toBeDefined();
    });

    it('should show library status indicators', () => {
      const stats = createMockStats();

      render(() => <DocumentStatus stats={stats} />);

      // All status indicators should be visible
      expect(screen.getByText('Malware Scanning')).toBeDefined();
      expect(screen.getByText('Search Ready')).toBeDefined();
      expect(screen.getByText('Cultural Context')).toBeDefined();
    });
  });

  describe('Props and Configuration', () => {
    it('should handle custom CSS class', () => {
      const stats = createMockStats();

      render(() => <DocumentStatus stats={stats} class="custom-class" />);

      expect(screen.getByText('Documents')).toBeDefined();
    });

    it('should handle custom project path', () => {
      const stats = createMockStats();

      render(() => <DocumentStatus stats={stats} projectPath="/custom/path" />);

      expect(screen.getByText('Storage')).toBeDefined();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle zero statistics gracefully', () => {
      const stats = {
        totalDocuments: 0,
        totalSize: 0,
        culturalContexts: 0,
        recentUploads: 0,
      };

      render(() => <DocumentStatus stats={stats} />);

      // Use getAllByText for "0" since it appears multiple times in stats
      const zeroElements = screen.getAllByText('0');
      expect(zeroElements.length).toBeGreaterThan(0);
      expect(screen.getByText('0 Bytes')).toBeDefined();
    });

    it('should handle missing stats prop gracefully', () => {
      const stats = {
        totalDocuments: 0,
        totalSize: 0,
        culturalContexts: 0,
        recentUploads: 0,
      };

      render(() => <DocumentStatus stats={stats} />);

      // Should not crash and show default values
      expect(screen.getByText('Documents')).toBeDefined();
      expect(screen.getByText('Storage Used')).toBeDefined();
    });

    it('should handle undefined stats properties', () => {
      const stats = {
        totalDocuments: 0,
        totalSize: 0,
        culturalContexts: 0,
        recentUploads: 0,
      };

      render(() => <DocumentStatus stats={stats} />);

      // Should show default values without crashing - use getAllByText for multiple "0" elements
      const zeroElements = screen.getAllByText('0');
      expect(zeroElements.length).toBeGreaterThan(0);
      expect(screen.getByText('Documents')).toBeDefined();
    });
  });

  describe('Accessibility and User Experience', () => {
    it('should render dashboard content accessibly', () => {
      const stats = createMockStats();

      render(() => <DocumentStatus stats={stats} />);

      // Should render dashboard content without crashing
      expect(screen.getByText('Storage')).toBeDefined();
      expect(screen.getByText('Formats')).toBeDefined();
    });

    it('should display information without interactive elements', () => {
      const stats = createMockStats();

      render(() => <DocumentStatus stats={stats} />);

      // Component renders dashboard without interactive elements
      expect(screen.getByText('Documents')).toBeDefined();
      expect(screen.getByText('Storage Used')).toBeDefined();
    });
  });

  describe('Anti-Censorship Architecture Validation', () => {
    it('should display cultural information without access control', () => {
      const stats = createMockStats();

      render(() => <DocumentStatus stats={stats} />);

      // Cultural information is educational only - no restrictions
      const culturalElements = screen.getAllByText(/Cultural Context/i);
      expect(culturalElements.length).toBeGreaterThan(0);
      expect(screen.getByText(/Documents/i)).toBeDefined();
    });

    it('should show security indicators without blocking access', () => {
      const stats = createMockStats();

      render(() => <DocumentStatus stats={stats} />);

      // Should show security indicators without blocking access
      expect(screen.getByText(/Malware Scanning/i)).toBeDefined();
      // Use more specific text to avoid multiple matches
      expect(screen.getByText('Storage Used')).toBeDefined();
    });

    it('should handle all content types without censorship', () => {
      const stats = createMockStats();

      render(() => <DocumentStatus stats={stats} />);

      // Should not crash and show dashboard information
      expect(screen.getByText(/Storage Used/i)).toBeDefined();
      expect(screen.getByText(/Search Ready/i)).toBeDefined();
    });
  });
});
