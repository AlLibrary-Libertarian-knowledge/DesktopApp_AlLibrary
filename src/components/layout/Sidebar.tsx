import { Component, createSignal, Show, createEffect } from 'solid-js';
import { A, useLocation } from '@solidjs/router';
import {
  BookOpen,
  FileText,
  Folder,
  Star,
  Clock,
  Search,
  Globe,
  FolderOpen,
  TrendingUp,
  Sparkles,
  Building2,
  Earth,
  ScrollText,
  ClipboardList,
  Shield,
  Users,
  RefreshCw,
  Download,
  RotateCcw,
  ChevronDown,
  HardDrive,
  Wifi,
  WifiOff,
} from 'lucide-solid';
import './Sidebar.css';

interface NavItem {
  path: string;
  label: string;
  icon: Component<{ size: number }>;
  badge?: string;
}

interface NavSection {
  section: string;
  title: string;
  icon: Component<{ size: number }>;
  items: NavItem[];
}

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

const Sidebar: Component<SidebarProps> = props => {
  const [activeSection, setActiveSection] = createSignal('');
  const [isOnline] = createSignal(true);
  const [isTransitioning, setIsTransitioning] = createSignal(false);
  const [wasCollapsed, setWasCollapsed] = createSignal(false);
  const [pendingSection, setPendingSection] = createSignal<string | null>(null);
  const location = useLocation();

  const navigationItems: NavSection[] = [
    {
      section: 'library',
      title: 'Library',
      icon: BookOpen,
      items: [
        { path: '/', label: 'Dashboard', icon: HardDrive },
        { path: '/documents', label: 'Documents & Search', icon: FileText },
        { path: '/collections', label: 'Collections', icon: Folder },
        { path: '/favorites', label: 'Favorites', icon: Star },
        { path: '/recent', label: 'Recent', icon: Clock },
      ],
    },
    {
      section: 'discovery',
      title: 'Discovery',
      icon: Search,
      items: [
        { path: '/search-network', label: 'Search Network', icon: Globe },
        { path: '/browse', label: 'Browse Categories', icon: FolderOpen },
        { path: '/trending', label: 'Trending', icon: TrendingUp, badge: '12' },
        { path: '/new-arrivals', label: 'New Arrivals', icon: Sparkles, badge: 'New' },
      ],
    },
    {
      section: 'cultural',
      title: 'Cultural Heritage',
      icon: Building2,
      items: [
        { path: '/cultural-contexts', label: 'Cultural Contexts', icon: Earth },
        { path: '/traditional-knowledge', label: 'Traditional Knowledge', icon: ScrollText },
        { path: '/community-guidelines', label: 'Guidelines', icon: ClipboardList },
        { path: '/preservation', label: 'Preservation', icon: Shield },
      ],
    },
    {
      section: 'network',
      title: 'Network',
      icon: Globe,
      items: [
        { path: '/peers', label: 'Peer Network', icon: Users, badge: '8' },
        { path: '/sharing', label: 'Sharing Status', icon: RefreshCw },
        { path: '/downloads', label: 'Downloads', icon: Download, badge: '3' },
        { path: '/sync', label: 'Synchronization', icon: RotateCcw },
      ],
    },
  ];

  // Find which section contains the current path
  const getCurrentPageSection = () => {
    const currentPath = location.pathname;
    for (const section of navigationItems) {
      for (const item of section.items) {
        if (item.path === currentPath) {
          return section.section;
        }
      }
    }
    return 'library'; // Default to library if no match
  };

  // Handle collapsed state changes
  createEffect(() => {
    const isCurrentlyCollapsed = props.collapsed;
    const prevCollapsed = wasCollapsed();

    if (isCurrentlyCollapsed && !prevCollapsed) {
      // Just became collapsed - unselect everything
      setActiveSection('');
      setPendingSection(null);
    } else if (!isCurrentlyCollapsed && prevCollapsed) {
      // Just became expanded
      const pending = pendingSection();
      if (pending) {
        // Use the specific section that was clicked while collapsed
        setActiveSection(pending);
        setPendingSection(null);
      } else {
        // Auto-select current page section
        setActiveSection(getCurrentPageSection());
      }
    }

    setWasCollapsed(isCurrentlyCollapsed || false);
  });

  const toggleSection = (section: string) => {
    // If sidebar is collapsed, expand it and set the specific section
    if (props.collapsed) {
      setPendingSection(section); // Store which section to activate
      if (props.onToggle) {
        props.onToggle(); // Trigger sidebar expansion
      }
      return;
    }

    if (isTransitioning()) return;

    const currentActive = activeSection();

    if (currentActive === section) {
      // Just close the current section
      setActiveSection('');
    } else if (currentActive && currentActive !== section) {
      // Close current, then open new one
      setIsTransitioning(true);
      setActiveSection(''); // Close current first

      globalThis.setTimeout(() => {
        setActiveSection(section); // Open new one after delay
        setIsTransitioning(false);
      }, 200); // Delay matches the CSS transition timing
    } else {
      // No section open, just open the new one
      setActiveSection(section);
    }
  };

  const storagePercentage = () => 35; // This would come from props/store in real app
  const storageUsed = () => '3.5GB';
  const storageTotal = () => '10GB';

  return (
    <aside class={`app-sidebar ${props.collapsed ? 'collapsed' : ''}`}>
      {/* Navigation */}
      <nav class="sidebar-nav" data-testid="main-navigation">
        {navigationItems.map(section => (
          <div class="nav-section">
            <button
              class={`section-header ${activeSection() === section.section ? 'active' : ''}`}
              onClick={() => toggleSection(section.section)}
              aria-expanded={activeSection() === section.section}
              aria-controls={`section-${section.section}`}
            >
              <span class="section-icon">
                <section.icon size={18} />
              </span>
              <Show when={!props.collapsed}>
                <span class="section-title">{section.title}</span>
                <span
                  class={`expand-icon ${activeSection() === section.section ? 'expanded' : ''}`}
                >
                  <ChevronDown size={14} />
                </span>
              </Show>
            </button>

            <div
              class={`nav-items ${activeSection() === section.section ? 'expanded' : ''}`}
              id={`section-${section.section}`}
            >
              {section.items.map(item => (
                <A href={item.path} class="nav-item" activeClass="active" end={item.path === '/'}>
                  <span class="nav-icon">
                    <item.icon size={16} />
                  </span>
                  <Show when={!props.collapsed}>
                    <span class="nav-label">{item.label}</span>
                    <Show when={item.badge}>
                      <span class="nav-badge">{item.badge}</span>
                    </Show>
                  </Show>
                </A>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Enhanced Footer */}
      <div class="sidebar-footer">
        <Show when={!props.collapsed}>
          {/* Storage Information */}
          <div class="storage-info">
            <div class="storage-header">
              <HardDrive size={14} />
              <span class="storage-label">Storage</span>
            </div>
            <div class="storage-bar">
              <div class="storage-used" style={`width: ${storagePercentage()}%`}></div>
            </div>
            <span class="storage-text">
              {storageUsed()} / {storageTotal()}
            </span>
          </div>
        </Show>

        {/* Connection Status */}
        <div class={`connection-status ${isOnline() ? 'online' : 'offline'}`}>
          <span class="connection-icon">
            {isOnline() ? <Wifi size={14} /> : <WifiOff size={14} />}
          </span>
          <Show when={!props.collapsed}>
            <span class="connection-text">{isOnline() ? 'Network Online' : 'Network Offline'}</span>
            <div class="connection-indicator">
              <div class="signal-dot"></div>
              <div class="signal-dot"></div>
              <div class="signal-dot"></div>
            </div>
          </Show>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
