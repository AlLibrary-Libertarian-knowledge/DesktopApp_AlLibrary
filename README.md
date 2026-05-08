# 🌐 AlLibrary - Decentralized Knowledge Sharing Platform

<div align="center">

![AlLibrary Logo](https://via.placeholder.com/300x120/4f46e5/ffffff?text=AlLibrary)

_Empowering communities to preserve, share, and discover knowledge while respecting cultural sensitivities_

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Rust](https://img.shields.io/badge/rust-%23000000.svg?style=for-the-badge&logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![Tauri](https://img.shields.io/badge/tauri-%2324C8DB.svg?style=for-the-badge&logo=tauri&logoColor=%23FFFFFF)](https://tauri.app/)
[![SolidJS](https://img.shields.io/badge/SolidJS-2c4f7c?style=for-the-badge&logo=solid&logoColor=c8c9cb)](https://www.solidjs.com/)

[✨ Features](#-key-features) •
[🚀 Quick Start](#-quick-start) •
[📖 Documentation](#-documentation) •
[🤝 Contributing](#-contributing)

</div>

---

## Status Notice

Networking (Tor/P2P/onion-share runtime) is currently disabled and the app runs with a frontend shell for these features. Network screens remain visible as placeholders for future implementation.

## 🎯 Project Vision

**AlLibrary** is a revolutionary decentralized document sharing platform that embodies the "multiple faces of truth" philosophy. Built as a **desktop-first application** using **Tauri v2**, **Rust**, and **SolidJS**, it enables communities to preserve, share, and discover knowledge without censorship while maintaining deep respect for cultural sensitivities.

### Core Philosophy

- **📚 Knowledge Freedom**: No central authority controls content
- **🛡️ Cultural Respect**: Protect sacred and sensitive materials
- **🔒 Privacy First**: Your data stays yours
- **🌐 P2P Network**: Direct peer-to-peer sharing
- **💻 Desktop Native**: Optimized desktop experience

---

## ✨ Key Features

### 📖 Document Management

- **Multi-format Support**: PDF, EPUB with robust preview
- **Smart Organization**: Collections, tags, and metadata
- **Offline Access**: Full functionality without internet
- **Version Control**: Track document changes and updates

### 🔍 Advanced Search & Discovery

- **Full-text Search**: Find content across all documents
- **Cultural Context**: Discover content with cultural awareness
- **Relationship Mapping**: Explore connections between documents
- **AI-Enhanced**: Smart content categorization and suggestions

### 🌐 P2P Network

- **Decentralized Sharing**: Direct peer-to-peer content exchange
- **Network Resilience**: Multiple transport protocols (TCP, WebSocket)
- **Cultural Communities**: Connect with like-minded preservationists
- **Bandwidth Optimization**: Smart caching and priority queuing

### 🛡️ Cultural Protection

- **Sensitivity Detection**: AI-powered cultural context analysis
- **Community Guidelines**: Respect indigenous and sacred content
- **Attribution Systems**: Proper crediting and context preservation
- **Access Controls**: Flexible sharing permissions

---

## 🛠️ Technology Stack

<div align="center">

| Category         | Technology               | Purpose                        |
| ---------------- | ------------------------ | ------------------------------ |
| **Frontend**     | SolidJS v1.8+            | Reactive UI framework          |
| **Runtime**      | Tauri v2.0+              | Desktop application framework  |
| **Backend**      | Rust v1.70+              | System operations & networking |
| **Database**     | SQLite v3.42+            | Local data storage             |
| **P2P Network**  | libp2p v0.52+            | Peer-to-peer networking        |
| **File Storage** | IPFS                     | Distributed content storage    |
| **Search**       | Tantivy                  | Full-text search engine        |
| **UI Styling**   | CSS3 + Custom Properties | Modern styling system          |

</div>

---

## 📁 Project Structure

```
DesktopApp_AlLibrary/
├── 📁 src-tauri/                    # Rust backend
│   ├── 📁 src/                      # Core Rust application
│   │   ├── 📁 commands/             # Tauri commands
│   │   │   ├── document.rs          # Document management
│   │   │   ├── search.rs            # Search operations
│   │   │   ├── network.rs           # P2P networking
│   │   │   ├── cultural.rs          # Cultural protection
│   │   │   └── mod.rs               # Commands module
│   │   ├── 📁 core/                 # Core business logic
│   │   │   ├── 📁 database/         # Database operations
│   │   │   │   ├── models.rs        # Data models
│   │   │   │   ├── migrations.rs    # DB migrations
│   │   │   │   ├── queries.rs       # SQL queries
│   │   │   │   └── mod.rs           # Database module
│   │   │   ├── 📁 document/         # Document processing
│   │   │   │   ├── processor.rs     # Document parsing
│   │   │   │   ├── metadata.rs     # Metadata extraction
│   │   │   │   ├── preview.rs       # Preview generation
│   │   │   │   └── mod.rs           # Document module
│   │   │   ├── 📁 p2p/              # P2P networking
│   │   │   │   ├── network.rs       # Network manager
│   │   │   │   ├── discovery.rs     # Peer discovery
│   │   │   │   ├── protocols.rs     # Custom protocols
│   │   │   │   └── mod.rs           # P2P module
│   │   │   ├── 📁 search/           # Search engine
│   │   │   │   ├── indexer.rs       # Content indexing
│   │   │   │   ├── query.rs         # Query processing
│   │   │   │   ├── ranking.rs       # Relevance ranking
│   │   │   │   └── mod.rs           # Search module
│   │   │   ├── 📁 security/         # Security & encryption
│   │   │   │   ├── crypto.rs        # Cryptographic operations
│   │   │   │   ├── validator.rs     # Content validation
│   │   │   │   ├── scanner.rs       # Security scanning
│   │   │   │   └── mod.rs           # Security module
│   │   │   ├── 📁 cultural/         # Cultural protection
│   │   │   │   ├── analyzer.rs      # Cultural context analysis
│   │   │   │   ├── protection.rs    # Protection mechanisms
│   │   │   │   ├── guidelines.rs    # Community guidelines
│   │   │   │   └── mod.rs           # Cultural module
│   │   │   └── mod.rs               # Core module
│   │   ├── 📁 utils/                # Utility functions
│   │   │   ├── config.rs            # Configuration management
│   │   │   ├── error.rs             # Error handling
│   │   │   ├── logger.rs            # Logging utilities
│   │   │   └── mod.rs               # Utils module
│   │   └── main.rs                  # Application entry point
│   ├── 📁 migrations/               # Database migrations
│   ├── 📄 Cargo.toml               # Rust dependencies
│   ├── 📄 tauri.conf.json          # Tauri configuration
│   └── 📄 build.rs                 # Build script
├── 📁 src/                          # Frontend SolidJS application
│   ├── 📁 components/               # Reusable UI components
│   │   ├── 📁 common/               # Common components
│   │   │   ├── Button.tsx           # Button component
│   │   │   ├── Modal.tsx            # Modal component
│   │   │   ├── Loading.tsx          # Loading states
│   │   │   └── index.ts             # Common exports
│   │   ├── 📁 document/             # Document-related components
│   │   │   ├── DocumentCard.tsx     # Document card display
│   │   │   ├── DocumentViewer.tsx   # Document preview
│   │   │   ├── DocumentList.tsx     # Document listing
│   │   │   ├── DocumentUpload.tsx   # Upload interface
│   │   │   └── index.ts             # Document exports
│   │   ├── 📁 search/               # Search components
│   │   │   ├── SearchBar.tsx        # Search input
│   │   │   ├── SearchResults.tsx    # Results display
│   │   │   ├── SearchFilters.tsx    # Filter controls
│   │   │   └── index.ts             # Search exports
│   │   ├── 📁 cultural/             # Cultural protection UI
│   │   │   ├── CulturalBadge.tsx    # Cultural sensitivity indicator
│   │   │   ├── CulturalForm.tsx     # Cultural context form
│   │   │   ├── ProtectionPanel.tsx  # Protection settings
│   │   │   └── index.ts             # Cultural exports
│   │   ├── 📁 network/              # P2P network components
│   │   │   ├── NetworkStatus.tsx    # Network connection status
│   │   │   ├── PeerList.tsx         # Connected peers display
│   │   │   ├── TransferProgress.tsx # Download/upload progress
│   │   │   └── index.ts             # Network exports
│   │   └── index.ts                 # All component exports
│   ├── 📁 pages/                    # Application pages/views
│   │   ├── Library.tsx              # Main library view
│   │   ├── Search.tsx               # Search interface
│   │   ├── Network.tsx              # P2P network management
│   │   ├── Settings.tsx             # Application settings
│   │   ├── Cultural.tsx             # Cultural protection settings
│   │   └── index.ts                 # Page exports
│   ├── 📁 stores/                   # State management
│   │   ├── documentStore.ts         # Document state
│   │   ├── searchStore.ts           # Search state
│   │   ├── networkStore.ts          # Network state
│   │   ├── culturalStore.ts         # Cultural context state
│   │   ├── settingsStore.ts         # Application settings
│   │   └── index.ts                 # Store exports
│   ├── 📁 services/                 # Frontend services
│   │   ├── api.ts                   # Tauri API integration
│   │   ├── document.ts              # Document operations
│   │   ├── search.ts                # Search operations
│   │   ├── network.ts               # P2P operations
│   │   ├── cultural.ts              # Cultural operations
│   │   └── index.ts                 # Service exports
│   ├── 📁 utils/                    # Frontend utilities
│   │   ├── formatting.ts            # Data formatting
│   │   ├── validation.ts            # Input validation
│   │   ├── constants.ts             # Application constants
│   │   ├── types.ts                 # TypeScript types
│   │   └── index.ts                 # Utility exports
│   ├── 📁 styles/                   # Styling and themes
│   │   ├── 📁 themes/               # Cultural themes
│   │   │   ├── default.css          # Default theme
│   │   │   ├── cultural.css         # Cultural-sensitive themes
│   │   │   └── accessibility.css    # Accessibility theme
│   │   ├── global.css               # Global styles
│   │   ├── components.css           # Component styles
│   │   └── variables.css            # CSS custom properties
│   ├── 📁 assets/                   # Static assets
│   │   ├── 📁 icons/                # Application icons
│   │   ├── 📁 images/               # Images and graphics
│   │   └── 📁 fonts/                # Custom fonts
│   ├── App.tsx                      # Main application component
│   ├── index.tsx                    # Application entry point
│   └── vite-env.d.ts               # Vite type definitions
├── 📁 docs/                         # Project documentation
│   ├── 📁 api/                      # API documentation
│   ├── 📁 architecture/             # Architecture diagrams
│   ├── 📁 cultural/                 # Cultural guidelines
│   ├── 📁 development/              # Development guides
│   └── README.md                    # Documentation index
├── 📁 tests/                        # Test files
│   ├── 📁 integration/              # Integration tests
│   ├── 📁 unit/                     # Unit tests
│   └── 📁 e2e/                      # End-to-end tests
├── 📁 scripts/                      # Build and utility scripts
│   ├── setup.sh                    # Development setup
│   ├── build.sh                    # Production build
│   └── migrate.sh                  # Database migration
├── 📄 package.json                 # Node.js dependencies
├── 📄 tsconfig.json               # TypeScript configuration
├── 📄 vite.config.ts              # Vite build configuration
├── 📄 .gitignore                  # Git ignore rules
├── 📄 biome.json                  # Biome (format + lint) configuration
└── 📄 README.md                   # This file
```

---

## 🚀 Quick Start

### Prerequisites

Ensure you have the following installed:

```bash
# System Requirements
- Rust 1.70+ (https://rustup.rs/)
- Node.js 18+ (https://nodejs.org/)
- pnpm 8+ (recommended package manager)
- Git (https://git-scm.com/)

# Platform-specific dependencies
- Windows: Microsoft C++ Build Tools
- macOS: Xcode Command Line Tools
- Linux: build-essential, libssl-dev, libsqlite3-dev
```

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/allibrary.git
cd allibrary/DesktopApp_AlLibrary

# Install dependencies
pnpm install

# Install Rust dependencies
cd src-tauri && cargo build

# Run database migrations
cargo run --bin migrate

# Start development server
pnpm tauri dev
```

### Development Commands

```bash
# Development
pnpm dev              # Start development server
pnpm tauri dev        # Start Tauri development mode

# Building
pnpm build            # Build frontend
pnpm tauri build      # Build complete application

# Testing

## E2E Testing Strategy (Tauri v2 Optimized)

AlLibrary uses **cross-platform e2e testing** aligned with Tauri v2 webview architecture:

| Test Suite | Command | Coverage | Duration |
|------------|---------|----------|----------|
| **Development** | `yarn test:e2e:windows` | Windows WebView2 | ~1 min |
| **Cross-Platform** | `yarn test:e2e` | Windows + macOS + Linux | ~2-3 min |
| **Interactive** | `yarn test:e2e:ui` | Debug mode | Interactive |

### Platform Coverage
- **🖥️ Windows**: Chromium (WebView2 simulation)
- **🍎 macOS**: WebKit (WKWebView simulation)
- **🐧 Linux**: WebKit (WebKitGTK simulation)
- **🚫 Firefox**: Removed (not used by any Tauri platform)

### All Testing Commands
pnpm test             # Run frontend unit tests
cargo test            # Run Rust tests
pnpm test:e2e         # Cross-platform e2e tests
pnpm test:e2e:windows # Fast Windows-only e2e tests
pnpm test:e2e:ui      # Interactive test runner
pnpm test:e2e:debug   # Debug mode testing

📖 **See [E2E Testing Strategy](./docs/E2E_TESTING_STRATEGY.md) for detailed documentation.**

# Code Quality
pnpm lint             # Lint TypeScript/JavaScript
cargo clippy          # Lint Rust code
pnpm format           # Format all code
```

---

## 📖 Documentation

### Core Documentation

- [📋 Project Overview](../DocsAndResearch_AlLibrary/Software%20Engineering/project_overview_nontechnical.md)
- [🏗️ Technical Specifications](../DocsAndResearch_AlLibrary/Software%20Engineering/technical_specifications_overview.md)
- [📊 System Architecture](../DocsAndResearch_AlLibrary/Software%20Engineering/diagrams/system_architecture_diagram.md)

### Development Guides

- [🛠️ Development Setup](docs/development/setup.md)
- [🏛️ Architecture Guide](docs/architecture/README.md)
- [🔧 API Reference](docs/api/README.md)
- [🧪 Testing Guide](docs/development/testing.md)

### Cultural Guidelines

- [🛡️ Cultural Protection](../DocsAndResearch_AlLibrary/Software%20Engineering/diagrams/cultural_protection_workflow.md)
- [🌍 Community Guidelines](docs/cultural/guidelines.md)
- [📝 Contribution Ethics](docs/cultural/ethics.md)

---

## 🔧 Development Guidelines

### Code Quality Standards

#### Rust Backend

```rust
// Follow Rust best practices
- Use `cargo clippy` for linting
- Implement comprehensive error handling
- Write unit tests for all public APIs
- Document public functions with rustdoc
- Use `serde` for serialization
- Implement proper logging with `tracing`
```

#### TypeScript Frontend

```typescript
// Follow TypeScript best practices
- Use strict TypeScript configuration
- Implement proper type definitions
- Write component tests with Vitest
- Use [Biome](https://biomejs.dev/) for formatting and linting (`pnpm run lint`, `pnpm run format`)
- Follow SolidJS reactive patterns
- Implement proper error boundaries
```

### Security Best Practices

- **Input Validation**: Sanitize all user inputs
- **Content Scanning**: Implement malware detection
- **Encryption**: Use modern cryptographic standards
- **Network Security**: Secure P2P communications
- **Cultural Protection**: Respect indigenous content

### Performance Optimization

- **Lazy Loading**: Load components and data on demand
- **Caching**: Implement multi-level caching strategies
- **Database**: Optimize SQLite queries and indexes
- **P2P**: Implement bandwidth-aware sharing
- **UI**: Use virtualization for large lists

---

## 🎨 Design System

### Cultural Themes

AlLibrary supports multiple cultural themes to respect diverse communities:

- **Default Theme**: Modern, accessible design
- **Cultural Themes**: Community-specific visual identity
- **High Contrast**: Enhanced accessibility
- **Dark Mode**: Reduced eye strain

### UI Components

All components follow accessibility standards (WCAG 2.1 AA) and support:

- Keyboard navigation
- Screen reader compatibility
- Responsive design
- Cultural color schemes

---

## 🤝 Contributing

We welcome contributions from developers, cultural experts, and community members!

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes** following our coding standards
4. **Add tests** for new functionality
5. **Commit your changes** (`git commit -m 'Add amazing feature'`)
6. **Push to the branch** (`git push origin feature/amazing-feature`)
7. **Open a Pull Request**

### Types of Contributions

- 🐛 **Bug Fixes**: Help us squash bugs
- ✨ **New Features**: Implement new functionality
- 📚 **Documentation**: Improve our docs
- 🌍 **Localization**: Add language support
- 🎨 **Design**: Improve UI/UX
- 🛡️ **Cultural Guidelines**: Enhance cultural protection

### Community Guidelines

- Respect cultural sensitivities
- Follow our code of conduct
- Be inclusive and welcoming
- Provide constructive feedback
- Help newcomers get started

---

## 📊 Project Status & Roadmap

### Development Timeline: 8 Weeks + 4 Week Buffer (3 Months Total)

#### **Phase 1: Foundation** (Week 1) ✅

- ✅ Tauri v2 + SolidJS project setup
- ✅ SQLite database foundation
- ✅ Basic document import (PDF/EPUB)
- ✅ Development environment configuration

#### **Phase 2: Local Functionality** (Week 2) 🔄

- 🔄 Document preview system (PDF.js, EPUB)
- 🔄 Local search implementation (SQLite FTS)
- 🔄 Collections and organization features
- 🔄 Basic UI framework and navigation

#### **Phase 3: P2P Foundation** (Week 3) ⏳

- ⏳ libp2p network setup and peer discovery
- ⏳ Content distribution system
- ⏳ Network search capabilities
- ⏳ Content addressing and verification

#### **Phase 4: Enhanced Features** (Week 4) ⏳

- ⏳ Advanced document features (versions, annotations)
- ⏳ Cultural protection framework
- ⏳ Advanced search with filters and history
- ⏳ Document relationship mapping

#### **Phase 5: Performance & Security** (Week 5) ⏳

- ⏳ Performance optimization and caching
- ⏳ Security implementation and monitoring
- ⏳ Offline support and synchronization
- ⏳ Content security and access control

#### **Phase 6: Optimization** (Week 6) ⏳

- ⏳ UI enhancement and accessibility
- ⏳ User preferences and history
- ⏳ Feedback systems and analytics
- ⏳ Cross-platform optimization

#### **Phase 7: Testing & Documentation** (Week 7) ⏳

- ⏳ Comprehensive testing framework
- ⏳ User and technical documentation
- ⏳ Final polish and issue resolution
- ⏳ Performance tuning and optimization

#### **Phase 8: Release & Maintenance** (Week 8) ⏳

- ⏳ Final testing and validation
- ⏳ Release preparation and builds
- ⏳ Community launch preparation
- ⏳ Documentation finalization

#### **Buffer Period** (Weeks 9-12) ⏳

- ⏳ Debugging and issue resolution
- ⏳ Polish and user experience improvements
- ⏳ Community feedback integration
- ⏳ Final release preparation

### Current Status: **Phase 1 Complete, Phase 2 In Progress**

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **IPFS & libp2p**: Decentralized network protocols
- **Tauri Team**: Amazing desktop app framework
- **SolidJS Community**: Reactive UI framework
- **Cultural Advisors**: Guidance on sensitive content
- **Open Source Community**: Inspiration and support

---

<div align="center">

**Made with ❤️ by the AlLibrary Community**

[🌟 Star us on GitHub](https://github.com/yourusername/allibrary) •
[🐛 Report Issues](https://github.com/yourusername/allibrary/issues) •
[💬 Join Discussions](https://github.com/yourusername/allibrary/discussions)

</div>
