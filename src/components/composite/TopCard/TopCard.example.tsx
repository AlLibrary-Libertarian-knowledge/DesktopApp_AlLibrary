import { Component } from 'solid-js';
import { TopCard } from './TopCard';

/**
 * TopCard Usage Examples
 *
 * This file demonstrates how to use the TopCard component
 * in different scenarios across the application.
 */

// Example 1: Basic usage with simple content
export const BasicTopCardExample: Component = () => {
  return (
    <TopCard
      title="Search Results"
      subtitle="Discover knowledge across cultures and time"
      rightContent={
        <div style="display: flex; gap: 1rem; align-items: center;">
          <div style="text-align: center;">
            <div style="font-size: 2rem; font-weight: bold; color: white;">1,247</div>
            <div style="font-size: 0.8rem; color: rgba(255,255,255,0.7);">Results Found</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 2rem; font-weight: bold; color: white;">23</div>
            <div style="font-size: 0.8rem; color: rgba(255,255,255,0.7);">Cultural Contexts</div>
          </div>
        </div>
      }
    />
  );
};

// Example 2: Custom colors
export const CustomColorTopCardExample: Component = () => {
  return (
    <TopCard
      title="Cultural Heritage"
      subtitle="Preserving traditional knowledge for future generations"
      rightContent={
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          <div style="color: white; font-weight: 600;">Sacred Knowledge</div>
          <div style="color: rgba(255,255,255,0.8); font-size: 0.9rem;">
            Educational context provided for cultural understanding
          </div>
        </div>
      }
      gradientColors={{
        primary: 'rgba(139, 92, 246, 0.95)',
        secondary: 'rgba(79, 70, 229, 0.9)',
      }}
    />
  );
};

// Example 3: Interactive card
export const InteractiveTopCardExample: Component = () => {
  const handleCardClick = () => {
    console.log('Top card clicked!');
  };

  return (
    <TopCard
      title="Network Status"
      subtitle="P2P network connectivity and peer information"
      rightContent={
        <div style="display: flex; gap: 1rem; align-items: center;">
          <div style="width: 12px; height: 12px; background: #10b981; border-radius: 50%; animation: pulse 2s infinite;"></div>
          <span style="color: white; font-weight: 500;">Connected to 47 peers</span>
        </div>
      }
      onClick={handleCardClick}
      aria-label="Network status dashboard - click to view details"
    />
  );
};

// Example 4: Complex content with multiple sections
export const ComplexContentTopCardExample: Component = () => {
  return (
    <TopCard
      title="Upload Progress"
      subtitle="Batch document processing and validation"
      rightContent={
        <div style="display: flex; flex-direction: column; gap: 1rem; width: 100%;">
          {/* Progress bars */}
          <div style="display: flex; gap: 1rem;">
            <div style="flex: 1;">
              <div style="color: rgba(255,255,255,0.8); font-size: 0.8rem; margin-bottom: 0.25rem;">
                Security Scan
              </div>
              <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.2); border-radius: 3px;">
                <div style="width: 75%; height: 100%; background: #10b981; border-radius: 3px;"></div>
              </div>
            </div>
            <div style="flex: 1;">
              <div style="color: rgba(255,255,255,0.8); font-size: 0.8rem; margin-bottom: 0.25rem;">
                Cultural Analysis
              </div>
              <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.2); border-radius: 3px;">
                <div style="width: 45%; height: 100%; background: #8b5cf6; border-radius: 3px;"></div>
              </div>
            </div>
          </div>

          {/* Status indicators */}
          <div style="display: flex; gap: 1rem; justify-content: center;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <div style="width: 8px; height: 8px; background: #f59e0b; border-radius: 50%;"></div>
              <span style="color: rgba(255,255,255,0.8); font-size: 0.75rem;">Processing</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <div style="width: 8px; height: 8px; background: #10b981; border-radius: 50%;"></div>
              <span style="color: rgba(255,255,255,0.8); font-size: 0.75rem;">Validated</span>
            </div>
          </div>
        </div>
      }
      class="upload-progress-card"
    />
  );
};

// Example 5: Minimal content
export const MinimalTopCardExample: Component = () => {
  return (
    <TopCard
      title="Settings"
      rightContent={
        <div style="color: rgba(255,255,255,0.8); font-style: italic;">
          Configure your AlLibrary preferences
        </div>
      }
    />
  );
};
