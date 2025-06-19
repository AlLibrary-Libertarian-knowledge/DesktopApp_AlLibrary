import type { PhysicsConfig } from '../types';

// Galaxy physics simulation parameters
export const physicsConfig: PhysicsConfig = {
  minOrbitRadius: 80, // Minimum distance from center
  maxOrbitRadius: 300, // Maximum distance from center
  baseOrbitSpeed: 0.003, // Increased from 0.001 to 0.003 - faster orbital speed for continuous movement
  speedVariation: 0.4, // Increased variation for more dynamic movement
  drag: 0.95, // Friction when dragging
  snapBackForce: 0.02, // Force to return to orbit when released
  centerAttraction: 0.001, // Gentle pull toward center
  nodeRadius: 35, // Visual radius of nodes
  atmosphereRadius: 160, // Invisible atmosphere around each node (much larger)
  maxRepulsionForce: 15.0, // Maximum repulsion strength (much stronger)
  minSafeDistance: 120, // Minimum safe distance between nodes (increased)
  emergencyRepulsion: 25.0, // Very strong force when too close (much stronger)
  atmosphereDamping: 0.95, // Speed reduction when entering atmosphere
  orbitAdjustmentSensitivity: 0.5, // How much dragging toward/away from center affects orbit
};

// Performance configuration
export const performanceConfig = {
  ACTIVITY_TIMEOUT: 100, // Reduced from 3000ms to 100ms - keeps animation running more consistently
  STABLE_VELOCITY_THRESHOLD: 0.05, // Reduced threshold for more sensitive movement detection
  THROTTLE_INTERVAL: 16, // 16ms for 60fps mouse handling
  MAX_MEMORY_THRESHOLD: 50 * 1024 * 1024, // 50MB memory warning threshold
  TARGET_FRAME_TIME: 16.67, // Target frame time for 60fps
};

// Animation configuration
export const animationConfig = {
  EXPANSION_ANIMATION_DURATION: 75, // ms for node expansion
  CLOSE_ANIMATION_DURATION: 200, // ms for node close
  HOVER_SCALE_EFFECT: 0.05, // Scale multiplier for hover effect
  HOVER_RADIUS_BONUS: 6, // Extra pixels for hover detection
};

export default physicsConfig;
