/**
 * Additional type definitions for the Ultimate Music Cloning System
 */

export interface Transition {
  fromSection: string;
  toSection: string;
  type: 'smooth' | 'abrupt' | 'crossfade' | 'drop' | 'build';
  duration: number;
  energy: number;
}

export interface DynamicMap {
  points: DynamicPoint[];
  averageLevel: number;
  range: number;
  compression: number;
}

export interface DynamicPoint {
  time: number;
  level: number;
  type: 'peak' | 'valley' | 'plateau';
}

export interface EnergyProfile {
  curve: number[];
  peaks: number[];
  valleys: number[];
  averageEnergy: number;
  energyVariance: number;
}

export interface TensionCurve {
  points: TensionPoint[];
  climaxTime: number;
  resolutionTime: number;
}

export interface TensionPoint {
  time: number;
  tension: number;
  musicalElement: string;
}

export interface MixingProfile {
  stereoWidth: number;
  depthLayers: number;
  panningStrategy: string;
  frequencyBalance: FrequencyBalance;
  dynamicsProcessing: DynamicsSettings;
}

export interface FrequencyBalance {
  bass: number;
  lowMids: number;
  mids: number;
  highMids: number;
  highs: number;
  airiness: number;
}

export interface DynamicsSettings {
  compression: number;
  limiting: number;
  gating: number;
  expansion: number;
  transientShaping: number;
}

export interface ProcessingChain {
  stages: ProcessingStage[];
  analogEmulation: boolean;
  characterType: string;
}

export interface SpatialAnalysis {
  width: number;
  depth: number;
  height: number;
  monophony: number;
  correlation: number;
  spatialCoherence: number;
}

export interface FrequencyProfile {
  spectrum: number[];
  tiltAngle: number;
  resonances: Resonance[];
  nulls: FrequencyNull[];
}

export interface Resonance {
  frequency: number;
  q: number;
  amplitude: number;
}

export interface FrequencyNull {
  frequency: number;
  width: number;
  depth: number;
}

export interface CompressionAnalysis {
  ratio: number;
  threshold: number;
  attack: number;
  release: number;
  knee: number;
  makeupGain: number;
  character: 'transparent' | 'colored' | 'aggressive' | 'gentle';
}

export interface VocalHarmony {
  type: 'unison' | 'octave' | 'third' | 'fifth' | 'complex';
  layers: number;
  spread: number;
  blend: number;
}

export interface LyricTiming {
  word: string;
  startTime: number;
  endTime: number;
  confidence: number;
}

export interface LyricStructure {
  sections: LyricSection[];
  rhymeScheme: string;
  meter: string;
  syllableCount: number[];
}

export interface LyricSection {
  type: string;
  lines: string[];
  startTime: number;
  endTime: number;
}

export interface SentimentAnalysis {
  overall: number;
  emotions: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    love: number;
    surprise: number;
  };
  subjectivity: number;
  intensity: number;
}

export interface EmotionProfile {
  primary: string;
  secondary: string[];
  intensity: number;
  valence: number;
  arousal: number;
}

export interface CloneMetadata {
  originalAnalysis: AudioDNA;
  processingTime: number;
  iterations: number;
  convergenceHistory: ConvergencePoint[];
  optimizationPath: OptimizationStep[];
  resourceUsage: ResourceMetrics;
}

export interface ConvergencePoint {
  iteration: number;
  similarity: number;
  delta: number;
  timestamp: number;
}

export interface OptimizationStep {
  parameter: string;
  oldValue: any;
  newValue: any;
  impact: number;
}

export interface ResourceMetrics {
  cpuUsage: number;
  memoryUsage: number;
  gpuUsage?: number;
  processingTime: number;
}

export interface QualityReport {
  audioQuality: AudioQualityMetrics;
  productionQuality: ProductionQualityMetrics;
  perceptualQuality: PerceptualQualityMetrics;
  technicalIssues: TechnicalIssue[];
  recommendations: string[];
}

export interface AudioQualityMetrics {
  snr: number;
  thd: number;
  clarity: number;
  definition: number;
  naturalness: number;
}

export interface ProductionQualityMetrics {
  balance: number;
  cohesion: number;
  polish: number;
  professionalismScore: number;
}

export interface PerceptualQualityMetrics {
  pleasantness: number;
  engagement: number;
  memorability: number;
  authenticity: number;
}

export interface TechnicalIssue {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  timestamp?: number;
}

// API Configuration interfaces
export interface APIConfig {
  port: number;
  host: string;
  cors: CORSConfig;
  rateLimit: RateLimitConfig;
  authentication: AuthConfig;
}

export interface CORSConfig {
  origins: string[];
  credentials: boolean;
  methods: string[];
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests: boolean;
}

export interface AuthConfig {
  type: 'jwt' | 'apiKey' | 'oauth2';
  secret: string;
  expiresIn: string;
}

export interface StorageConfig {
  type: 'local' | 's3' | 'gcs';
  basePath: string;
  credentials?: any;
  maxFileSize: number;
  allowedFormats: string[];
}

export interface MonitoringConfig {
  enabled: boolean;
  metrics: MetricsConfig;
  logging: LoggingConfig;
  tracing: TracingConfig;
}

export interface MetricsConfig {
  provider: 'prometheus' | 'datadog' | 'cloudwatch';
  interval: number;
  customMetrics: string[];
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  format: 'json' | 'text';
  destination: 'console' | 'file' | 'remote';
}

export interface TracingConfig {
  enabled: boolean;
  samplingRate: number;
  provider: 'jaeger' | 'zipkin' | 'xray';
}

export interface CloningConfig {
  targetSimilarity: number;
  maxIterations: number;
  convergenceThreshold: number;
  optimizationStrategy: 'aggressive' | 'balanced' | 'conservative';
  parallelJobs: number;
}