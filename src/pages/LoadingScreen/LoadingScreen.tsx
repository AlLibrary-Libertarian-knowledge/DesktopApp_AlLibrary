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
import logoSvg from '/src/assets/logo.svg';
import styles from './LoadingScreen.module.css';

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
          const newProgress = Math.min(prev + Math.random() * 2 + 0.5, 100);
          if (newProgress >= 100) {
            clearInterval(progressInterval);
            setTimeout(() => {
              props.onComplete?.();
            }, 1000);
            return 100;
          }
          return newProgress;
        });
      }, 100);

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
          clearInterval(phaseInterval);
          return prev;
        });
      }, 2000);
    }
  });

  onCleanup(() => {
    clearInterval(progressInterval);
    clearInterval(phaseInterval);
  });

  return (
    <div class={styles.loadingScreen}>
      {/* Background Pattern */}
      <div class={styles.loadingBackground}>
        <div class={styles.floatingParticles}>
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              class={styles.particle}
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
      <div class={styles.loadingContent}>
        {/* Logo and Branding */}
        <div class={styles.loadingHeader}>
          <div class={styles.appLogo}>
            <div class={styles.logoIcon}>
              <img src={logoSvg} alt="AlLibrary Logo" class={styles.logoImage} />
            </div>
            <div class={styles.logoRings}>
              <div class={`${styles.ring} ${styles.ring1}`} />
              <div class={`${styles.ring} ${styles.ring2}`} />
              <div class={`${styles.ring} ${styles.ring3}`} />
            </div>
          </div>
          <h1 class={styles.appTitle}>AlLibrary</h1>
          <p class={styles.appSubtitle}>Preserving Cultural Heritage for Future Generations</p>
        </div>

        {/* Loading Progress */}
        <div class={styles.loadingProgressSection}>
          <div class={styles.progressContainer}>
            <div class={styles.progressBar} style={`width: ${loadingProgress()}%`} />
            <div class={styles.progressGlow} />
          </div>
          <div class={styles.progressPercentage}>{Math.round(loadingProgress())}%</div>
        </div>

        {/* Current Phase */}
        <div class={styles.loadingPhase}>
          <div class={styles.phaseIcon}>
            <Dynamic component={currentIcon()} size={24} />
          </div>
          <span class={styles.phaseText}>{currentMessage()}</span>
        </div>

        {/* Cultural Elements */}
        <div class={styles.culturalElements}>
          <div class={`${styles.element} ${styles.element1}`}>
            <Layers size={20} />
          </div>
          <div class={`${styles.element} ${styles.element2}`}>
            <Zap size={18} />
          </div>
          <div class={`${styles.element} ${styles.element3}`}>
            <Shield size={22} />
          </div>
          <div class={`${styles.element} ${styles.element4}`}>
            <Users size={20} />
          </div>
        </div>

        {/* Network Visualization */}
        <div class={styles.networkViz}>
          <div class={`${styles.networkNode} ${styles.central}`}>
            <div class={styles.nodePulse} />
          </div>
          <div class={`${styles.networkNode} ${styles.node1}`} />
          <div class={`${styles.networkNode} ${styles.node2}`} />
          <div class={`${styles.networkNode} ${styles.node3}`} />
          <div class={`${styles.networkNode} ${styles.node4}`} />
          <div class={`${styles.networkConnection} ${styles.conn1}`} />
          <div class={`${styles.networkConnection} ${styles.conn2}`} />
          <div class={`${styles.networkConnection} ${styles.conn3}`} />
          <div class={`${styles.networkConnection} ${styles.conn4}`} />
        </div>
      </div>

      {/* Bottom Credits */}
      <div class={styles.loadingFooter}>
        <p>Connecting minds • Preserving wisdom • Building bridges</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
