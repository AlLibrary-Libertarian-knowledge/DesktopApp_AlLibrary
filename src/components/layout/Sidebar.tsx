import { Component, createSignal } from 'solid-js';
import { A } from '@solidjs/router';
import './Sidebar.css';

interface SidebarProps {
  collapsed?: boolean;
}

const Sidebar: Component<SidebarProps> = props => {
  const [activeSection, setActiveSection] = createSignal('library');

  const navigationItems = [
    {
      section: 'library',
      title: 'Library',
      icon: '📚',
      items: [
        { path: '/', label: 'My Documents', icon: '📄' },
        { path: '/collections', label: 'Collections', icon: '📂' },
        { path: '/favorites', label: 'Favorites', icon: '⭐' },
        { path: '/recent', label: 'Recent', icon: '🕒' },
      ],
    },
    {
      section: 'discovery',
      title: 'Discovery',
      icon: '🔍',
      items: [
        { path: '/search', label: 'Search Network', icon: '🌐' },
        { path: '/browse', label: 'Browse Categories', icon: '🗂️' },
        { path: '/trending', label: 'Trending', icon: '📈' },
        { path: '/new-arrivals', label: 'New Arrivals', icon: '✨' },
      ],
    },
    {
      section: 'cultural',
      title: 'Cultural Heritage',
      icon: '🏛️',
      items: [
        { path: '/cultural-contexts', label: 'Cultural Contexts', icon: '🌍' },
        { path: '/traditional-knowledge', label: 'Traditional Knowledge', icon: '📜' },
        { path: '/community-guidelines', label: 'Guidelines', icon: '📋' },
        { path: '/preservation', label: 'Preservation', icon: '🛡️' },
      ],
    },
    {
      section: 'network',
      title: 'Network',
      icon: '🌐',
      items: [
        { path: '/peers', label: 'Peer Network', icon: '👥' },
        { path: '/sharing', label: 'Sharing Status', icon: '🔄' },
        { path: '/downloads', label: 'Downloads', icon: '⬇️' },
        { path: '/sync', label: 'Synchronization', icon: '🔄' },
      ],
    },
  ];

  return (
    <aside class={`app-sidebar ${props.collapsed ? 'collapsed' : ''}`}>
      <nav class="sidebar-nav">
        {navigationItems.map(section => (
          <div class="nav-section">
            <button
              class={`section-header ${activeSection() === section.section ? 'active' : ''}`}
              onClick={() =>
                setActiveSection(activeSection() === section.section ? '' : section.section)
              }
            >
              <span class="section-icon">{section.icon}</span>
              <span class="section-title">{section.title}</span>
              <span class={`expand-icon ${activeSection() === section.section ? 'expanded' : ''}`}>
                ▼
              </span>
            </button>

            <div class={`nav-items ${activeSection() === section.section ? 'expanded' : ''}`}>
              {section.items.map(item => (
                <A href={item.path} class="nav-item" activeClass="active">
                  <span class="nav-icon">{item.icon}</span>
                  <span class="nav-label">{item.label}</span>
                </A>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div class="sidebar-footer">
        <div class="storage-info">
          <div class="storage-bar">
            <div class="storage-used" style="width: 35%"></div>
          </div>
          <span class="storage-text">Storage: 3.5GB / 10GB</span>
        </div>

        <div class="sync-status">
          <span class="sync-indicator active"></span>
          <span class="sync-text">Syncing...</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
