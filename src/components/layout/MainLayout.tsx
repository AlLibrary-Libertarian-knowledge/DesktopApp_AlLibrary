import { Component, ParentProps, onMount } from 'solid-js';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import './MainLayout.css';

interface MainLayoutProps extends ParentProps {
  sidebarCollapsed?: boolean;
  onSidebarToggle?: () => void;
}

const MainLayout: Component<MainLayoutProps> = props => {
  onMount(() => {
    // Ensure the layout is properly initialized
    console.log('MainLayout mounted');
  });

  return (
    <div class="main-layout">
      <Header
        onSidebarToggle={props.onSidebarToggle || undefined}
        sidebarCollapsed={props.sidebarCollapsed ?? false}
      />

      <div class="layout-body">
        <Sidebar collapsed={props.sidebarCollapsed ?? false} />

        <main class="main-content">
          <div class="content-wrapper">{props.children}</div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default MainLayout;
