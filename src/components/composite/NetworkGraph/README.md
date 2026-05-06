# NetworkGraph Component Architecture

This document outlines the refactored structure of the NetworkGraph component, which was broken down from a monolithic 4166-line file into a well-organized, modular architecture.

## 📁 Folder Structure

```
/network/
├── components/           # UI Components (Extracted from JSX)
│   ├── TransferLegend.tsx    # Transfer status legend component
│   ├── TransferLegend.css    # Styles for transfer legend
│   └── [Future components]   # ExpandedNodeOverlay, NetworkStats, etc.
├── rendering/           # Canvas rendering classes
│   ├── NodeRenderer.tsx      # Node drawing logic
│   └── [Future renderers]   # LinkRenderer, TooltipRenderer, GridRenderer
├── physics/            # Physics simulation engine
│   ├── PhysicsEngine.tsx     # Main physics simulation class
│   └── [Future physics]     # OrbitSimulation, ForceCalculations
├── data/               # Mock data and data structures
│   └── mockNetworkData.tsx   # P2P network mock data
├── hooks/              # Custom SolidJS hooks
│   ├── useNetworkState.tsx   # Network state management hook
│   └── [Future hooks]       # useMouseHandling, useAnimation, usePerformance
├── config/             # Configuration files
│   └── physicsConfig.ts      # Physics and performance configuration
├── utils/              # Utility functions
│   └── formatters.tsx        # Formatting utility functions
├── types/              # TypeScript type definitions
│   └── index.ts             # All NetworkGraph types and interfaces
├── NetworkGraph.tsx    # Main component (to be further refactored)
└── index.ts           # Main export file
```

## 🔧 Components Extracted

### ✅ Completed Extractions

1. **Types & Interfaces** (`/types/index.ts`)

   - `Node`, `Link`, `NetworkGraphProps`
   - `FileTransfer`, `FileActivity`, `NodeCapabilities`
   - `PhysicsConfig`, `NetworkStatsState`
   - `MousePosition`, `DragState`, `ExpansionState`
   - `PerformanceStats`

2. **Mock Data** (`/data/mockNetworkData.tsx`)

   - AlLibrary P2P network nodes with realistic transfer data
   - Network topology with connections and links
   - Cultural preservation use cases

3. **Physics Engine** (`/physics/PhysicsEngine.tsx`)

   - Orbital motion simulation
   - Repulsion force calculations
   - Atmosphere effects and collision detection
   - Drag handling and node positioning

4. **Node Renderer** (`/rendering/NodeRenderer.tsx`)

   - Complete node drawing logic
   - Transfer progress indicators
   - Status effects and animations
   - Network type indicators and badges

5. **Transfer Legend** (`/components/TransferLegend.tsx`)

   - Interactive legend component
   - Hover-to-expand functionality
   - Pin/unpin capability
   - Complete styling in separate CSS file

6. **Network State Hook** (`/hooks/useNetworkState.tsx`)

   - Centralized state management
   - Drag and drop handling
   - Node expansion/collapse
   - Network statistics calculation

7. **Utility Functions** (`/utils/formatters.tsx`)

   - Time formatting (seconds to human readable)
   - File size formatting (KB/MB/GB)
   - Bandwidth, latency, reliability formatting
   - Status and network type helpers

8. **Configuration** (`/config/physicsConfig.ts`)
   - Physics simulation parameters
   - Performance thresholds
   - Animation timing configuration

### 🚧 Remaining Extractions (Next Steps)

1. **Link Renderer** (`/rendering/LinkRenderer.tsx`)

   - Animated dotted lines
   - Transfer direction indicators
   - Connection status visualization

2. **Tooltip Renderer** (`/rendering/TooltipRenderer.tsx`)

   - Rich hover tooltips
   - Node information display
   - Transfer details

3. **Grid Renderer** (`/rendering/GridRenderer.tsx`)

   - Background grid drawing
   - Canvas optimization utilities

4. **Expanded Node Overlay** (`/components/ExpandedNodeOverlay.tsx`)

   - Detailed node information modal
   - Transfer progress displays
   - Node capabilities and statistics

5. **Network Stats Component** (`/components/NetworkStats.tsx`)

   - Real-time network statistics
   - Performance metrics display

6. **Floating Action Button** (`/components/FloatingActionButton.tsx`)

   - Recenter camera button
   - Additional network actions

7. **Mouse Handling Hook** (`/hooks/useMouseHandling.tsx`)

   - Optimized mouse event handling
   - Hover detection and click handling

8. **Animation Hook** (`/hooks/useAnimation.tsx`)

   - Smart animation management
   - Performance-optimized rendering loop

9. **Performance Hook** (`/hooks/usePerformanceMonitoring.tsx`)
   - Frame rate monitoring
   - Memory usage tracking
   - Performance warnings

## 🎯 Benefits of This Architecture

### 1. **Maintainability**

- Each component has a single responsibility
- Easy to locate and modify specific functionality
- Clear separation of concerns

### 2. **Reusability**

- Components can be used independently
- Physics engine can be reused for other visualizations
- Utility functions available throughout the app

### 3. **Testability**

- Individual components can be unit tested
- Physics calculations can be tested in isolation
- Mock data is centralized and consistent

### 4. **Performance**

- Rendering logic is optimized and separated
- State management is centralized and efficient
- Physics calculations are isolated for optimization

### 5. **Developer Experience**

- Clear import structure via index.ts
- TypeScript support throughout
- Consistent naming and organization

## 📝 Usage Examples

### Basic Import Structure

```typescript
// Import everything from main index
import { NetworkGraph, useNetworkState, PhysicsEngine } from './components/network';

// Import specific components
import TransferLegend from './components/network/components/TransferLegend';
import { NodeRenderer } from './components/network/rendering/NodeRenderer';

// Import types
import type { Node, Link, NetworkGraphProps } from './components/network/types';

// Import utilities
import { formatFileSize, formatTimeRemaining } from './components/network/utils/formatters';
```

### Using the Network State Hook

```typescript
const MyNetworkComponent = () => {
  const { nodes, hoveredNode, dragState, startDrag, endDrag, expandNode, recenterCamera } =
    useNetworkState();

  // Component logic here
};
```

### Using the Physics Engine

```typescript
const physicsEngine = new PhysicsEngine();
const updatedNodes = physicsEngine.simulatePhysics(
  nodes,
  links,
  draggedNode,
  isDragging,
  mousePosition,
  dragOffset
);
```

## 🚀 Next Steps

1. **Complete Remaining Extractions**

   - Extract remaining rendering components
   - Create additional UI components
   - Build comprehensive hook system

2. **Optimize Main Component**

   - Refactor NetworkGraph.tsx to use extracted components
   - Remove duplicated code
   - Improve performance

3. **Add Testing**

   - Unit tests for all components
   - Physics simulation tests
   - Performance benchmarks

4. **Documentation**
   - Component API documentation
   - Physics engine documentation
   - Performance optimization guide

This refactored architecture transforms the NetworkGraph from a monolithic component into a maintainable, modular system that follows modern React/SolidJS best practices and SOLID principles.
