import { Component, createSignal, onMount, onCleanup, createEffect } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import {
  BookOpen,
  Globe,
  Zap,
  Layers,
  Shield,
  Users,
  Heart,
  Sparkles,
  Database,
  CheckCircle,
} from 'lucide-solid';
import './LoadingScreen.css';

interface TauriProgress {
  phase: string;
  message: string;
  progress: number;
  icon: string;
}

interface LoadingScreenProps {
  onComplete?: () => void;
  tauriProgress?: TauriProgress | null;
}

const LoadingScreen: Component<LoadingScreenProps> = props => {
  const [loadingProgress, setLoadingProgress] = createSignal(0);
  const [currentPhase, setCurrentPhase] = createSignal(0);
  const [currentMessage, setCurrentMessage] = createSignal(
    'Initializing Cultural Heritage Network...'
  );
  const [currentIcon, setCurrentIcon] = createSignal<any>(Globe);

  const loadingPhases = [
    { text: 'Initializing Cultural Heritage Network...', icon: Globe },
    { text: 'Connecting to Preservation Nodes...', icon: Users },
    { text: 'Loading Knowledge Archives...', icon: BookOpen },
    { text: 'Securing Cultural Wisdom...', icon: Shield },
    { text: 'Preparing Sacred Stories...', icon: Sparkles },
    { text: 'Welcome to AlLibrary', icon: Heart },
  ];

  // Icon mapping for Tauri progress
  const iconMap: Record<string, any> = {
    Globe,
    Shield,
    Database,
    Users,
    BookOpen,
    CheckCircle,
    Heart,
    Sparkles,
  };

  let progressInterval: number;
  let phaseInterval: number;

  // Effect to handle Tauri progress updates
  createEffect(() => {
    const tauriProgress = props.tauriProgress;
    if (tauriProgress) {
      setLoadingProgress(tauriProgress.progress);
      setCurrentMessage(tauriProgress.message);

      // Map icon from string to component
      const iconComponent = iconMap[tauriProgress.icon] || Globe;
      setCurrentIcon(() => iconComponent);

      // Clear intervals if using Tauri progress
      if (progressInterval) clearInterval(progressInterval);
      if (phaseInterval) clearInterval(phaseInterval);
    }
  });

  onMount(() => {
    // Only start simulation if not using Tauri progress
    if (!props.tauriProgress) {
      // Simulate loading progress
      progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          const newProgress = prev + Math.random() * 3;
          if (newProgress >= 100) {
            clearInterval(progressInterval);
            setTimeout(() => {
              props.onComplete?.();
            }, 1000);
            return 100;
          }
          return newProgress;
        });
      }, 80);

      // Change phases during loading
      phaseInterval = setInterval(() => {
        setCurrentPhase(prev => {
          const next = prev + 1;
          const nextPhase = loadingPhases[next];
          if (next < loadingPhases.length && nextPhase) {
            setCurrentMessage(nextPhase.text);
            setCurrentIcon(() => nextPhase.icon);
            return next;
          }
          return prev;
        });
      }, 1200);
    }
  });

  onCleanup(() => {
    clearInterval(progressInterval);
    clearInterval(phaseInterval);
  });

  return (
    <div class="loading-screen">
      {/* Background Pattern */}
      <div class="loading-background">
        <div class="floating-particles">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              class="particle"
              style={`
                left: ${Math.random() * 100}%; 
                animation-delay: ${Math.random() * 3}s;
                animation-duration: ${3 + Math.random() * 4}s;
              `}
            />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div class="loading-content">
        {/* Logo and Branding */}
        <div class="loading-header">
          <div class="app-logo">
            <div class="logo-icon">
              <BookOpen size={48} />
            </div>
            <div class="logo-rings">
              <div class="ring ring-1" />
              <div class="ring ring-2" />
              <div class="ring ring-3" />
            </div>
          </div>
          <h1 class="app-title">AlLibrary</h1>
          <p class="app-subtitle">Preserving Cultural Heritage for Future Generations</p>
        </div>

        {/* Loading Progress */}
        <div class="loading-progress-section">
          <div class="progress-container">
            <div class="progress-bar" style={`width: ${loadingProgress()}%`} />
            <div class="progress-glow" />
          </div>
          <div class="progress-percentage">{Math.round(loadingProgress())}%</div>
        </div>

        {/* Current Phase */}
        <div class="loading-phase">
          <div class="phase-icon">
            <Dynamic component={currentIcon()} size={24} />
          </div>
          <span class="phase-text">{currentMessage()}</span>
        </div>

        {/* Cultural Elements */}
        <div class="cultural-elements">
          <div class="element element-1">
            <Layers size={20} />
          </div>
          <div class="element element-2">
            <Zap size={18} />
          </div>
          <div class="element element-3">
            <Shield size={22} />
          </div>
          <div class="element element-4">
            <Users size={20} />
          </div>
        </div>

        {/* Network Visualization */}
        <div class="network-viz">
          <div class="network-node central">
            <div class="node-pulse" />
          </div>
          <div class="network-node node-1" />
          <div class="network-node node-2" />
          <div class="network-node node-3" />
          <div class="network-node node-4" />
          <div class="network-connection conn-1" />
          <div class="network-connection conn-2" />
          <div class="network-connection conn-3" />
          <div class="network-connection conn-4" />
        </div>
      </div>

      {/* Bottom Credits */}
      <div class="loading-footer">
        <p>Connecting minds • Preserving wisdom • Building bridges</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
