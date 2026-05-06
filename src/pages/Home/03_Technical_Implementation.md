# HomePage - Technical Implementation Guide

## 🏗️ Architecture & Components

### Component Hierarchy

```
HomePage
├── DashboardHeader
│   ├── AppLogo
│   ├── GlobalSearchBar
│   ├── NetworkStatusIndicator
│   └── UserMenu
├── DashboardGrid
│   ├── QuickActionsCard
│   ├── RecentDocumentsCard
│   ├── NetworkStatusCard
│   ├── CulturalHeritageCard
│   └── DiscoveryFeedCard
└── DashboardFooter
    ├── SyncStatusIndicator
    ├── StorageUsageDisplay
    └── NetworkIdentityInfo
```

### State Management Architecture

```typescript
// Centralized Store Pattern with SolidJS
interface DashboardStore {
  // Network state - reactive to backend updates
  networkStatus: Resource<NetworkStatus>;
  activeTransfers: Resource<Transfer[]>;

  // Content state - cached with smart invalidation
  recentDocuments: Resource<Document[]>;
  discoveryFeed: Resource<ContentItem[]>;

  // User state - persisted locally
  userPreferences: Store<UserPreferences>;
  culturalSettings: Store<CulturalSettings>;

  // UI state - ephemeral
  selectedCard: Signal<string | null>;
  isLoading: Signal<boolean>;
  alerts: Signal<Alert[]>;
}

// Store composition for optimal reactivity
const createDashboardStore = () => {
  const [networkStatus] = createResource(fetchNetworkStatus);
  const [recentDocuments] = createResource(fetchRecentDocuments);
  const [userPreferences, setUserPreferences] = createStore<UserPreferences>({
    theme: 'auto',
    culturalSensitivity: 3,
    networkParticipation: true,
    privacyLevel: 'balanced',
  });

  return {
    networkStatus,
    recentDocuments,
    userPreferences,
    setUserPreferences,
  };
};
```

### API Integration Points

```typescript
// Tauri Command Interfaces
declare module '@tauri-apps/api/tauri' {
  interface Commands {
    // Network operations
    get_network_status(): Promise<NetworkStatus>;
    get_active_transfers(): Promise<Transfer[]>;

    // Document operations
    get_recent_documents(limit: number): Promise<Document[]>;
    get_document_thumbnail(id: string): Promise<string>;

    // Cultural operations
    check_cultural_sensitivity(content: ContentMetadata): Promise<SensitivityReport>;
    get_cultural_metrics(): Promise<CulturalMetrics>;

    // System operations
    get_storage_usage(): Promise<StorageInfo>;
    get_sync_status(): Promise<SyncStatus>;
  }
}

// API Service Layer
class DashboardAPI {
  static async getNetworkStatus(): Promise<NetworkStatus> {
    try {
      return await invoke('get_network_status');
    } catch (error) {
      console.error('Failed to fetch network status:', error);
      throw new APIError('Network status unavailable', error);
    }
  }

  static async getRecentDocuments(limit = 10): Promise<Document[]> {
    try {
      const documents = await invoke('get_recent_documents', { limit });
      return documents.map(doc => ({
        ...doc,
        lastAccessed: new Date(doc.lastAccessed),
        culturalContext: doc.culturalContext || 'general',
      }));
    } catch (error) {
      console.error('Failed to fetch recent documents:', error);
      return []; // Graceful degradation
    }
  }
}
```

### Performance Considerations

- **Component Virtualization**: Use virtual scrolling for large content lists
- **Lazy Loading**: Progressive image loading with intersection observer
- **Resource Caching**: Intelligent cache invalidation for frequently updated data
- **Bundle Splitting**: Code splitting for non-critical dashboard features
- **Memory Management**: Cleanup subscriptions and resources on component unmount

## ⚡ Code Quality Guidelines

### TypeScript Patterns

```typescript
// Strict type definitions for all props and state
interface DashboardCardProps {
  readonly title: string;
  readonly priority: 'high' | 'medium' | 'low';
  readonly culturalContext?: string[];
  readonly onInteraction?: (action: string, data: unknown) => void;
  readonly testId?: string; // For testing
}

// Discriminated unions for complex state
type LoadingState =
  | { status: 'idle' }
  | { status: 'loading'; progress?: number }
  | { status: 'success'; data: unknown }
  | { status: 'error'; error: Error };

// Generic utilities for common patterns
type AsyncResource<T> = Resource<T> & {
  readonly isLoading: boolean;
  readonly error: Error | null;
  readonly refetch: () => void;
};

// Custom hooks for reusable logic
const useNetworkStatus = (): AsyncResource<NetworkStatus> => {
  const [data, { refetch }] = createResource(DashboardAPI.getNetworkStatus);

  // Auto-refresh every 5 seconds
  const intervalId = setInterval(refetch, 5000);
  onCleanup(() => clearInterval(intervalId));

  return createMemo(() => ({
    ...data,
    isLoading: data.loading,
    error: data.error,
    refetch,
  }));
};
```

### SolidJS Best Practices

```typescript
// Reactive patterns for optimal performance
const DashboardCard: Component<DashboardCardProps> = (props) => {
  // Memoize expensive computations
  const cardContent = createMemo(() => {
    return processCardData(props.data, props.culturalContext);
  });

  // Derived signals for UI state
  const isHighPriority = () => props.priority === "high";
  const cardClasses = () =>
    `dashboard-card ${isHighPriority() ? "priority-high" : ""}`;

  // Event handlers with proper typing
  const handleInteraction = (event: MouseEvent) => {
    event.preventDefault();
    props.onInteraction?.("click", { timestamp: Date.now() });
  };

  return (
    <div
      class={cardClasses()}
      onClick={handleInteraction}
      data-testid={props.testId}
    >
      {cardContent()}
    </div>
  );
};
```
