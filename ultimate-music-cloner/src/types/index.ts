/**
 * Core type definitions for the Ultimate Music Cloning System
 */

// Input types for song processing
export interface SongInput {
  source: 'url' | 'file' | 'name' | 'humming' | 'description';
  data: string | Buffer;
  targetSimilarity?: number;
  language?: string;
  genre?: string;
  options?: CloningOptions;
}

export interface CloningOptions {
  maxIterations?: number;
  qualityPreset?: 'fast' | 'balanced' | 'maximum';
  preserveOriginalKey?: boolean;
  preserveOriginalTempo?: boolean;
  enhanceQuality?: boolean;
  targetFormat?: AudioFormat;
}

// Audio analysis types
export interface AudioFeatures {
  // Temporal features
  tempo: number;
  tempoConfidence: number;
  timeSignature: [number, number];
  duration: number;
  
  // Tonal features
  key: string;
  mode: 'major' | 'minor' | 'modal';
  keyConfidence: number;
  chordProgression: ChordInfo[];
  
  // Spectral features
  mfcc: number[][];
  chroma: number[][];
  spectralCentroid: number[];
  spectralRolloff: number[];
  spectralFlux: number[];
  zeroCrossingRate: number[];
  
  // Rhythm features
  beatPositions: number[];
  onsetStrength: number[];
  rhythmPattern: string;
  groove: GrooveFeatures;
  
  // Harmonic features
  harmonicContent: number[];
  percussiveContent: number[];
  pitchContent: PitchInfo[];
  
  // Timbre features
  brightness: number;
  warmth: number;
  roughness: number;
  formants: FormantInfo[];
  
  // Dynamic features
  loudness: number[];
  dynamicRange: number;
  peakAmplitude: number;
  rms: number[];
}

export interface AudioDNA {
  fingerprint: string;
  features: AudioFeatures;
  structure: SongStructure;
  production: ProductionAnalysis;
  style: StyleGenome;
  instruments: InstrumentAnalysis[];
  vocals: VocalAnalysis;
  metadata: SongMetadata;
  uniqueSignatures: string[];
  culturalMarkers: CulturalMarker[];
}

export interface SongStructure {
  sections: Section[];
  form: string; // e.g., "ABABCB"
  transitions: Transition[];
  dynamics: DynamicMap;
  energy: EnergyProfile;
  tension: TensionCurve;
}

export interface Section {
  type: 'intro' | 'verse' | 'chorus' | 'bridge' | 'pre-chorus' | 'outro' | 'instrumental' | 'break';
  startTime: number;
  endTime: number;
  bars: number;
  energy: number;
  characteristics: string[];
}

export interface ProductionAnalysis {
  era: string;
  mixingStyle: MixingProfile;
  masteringChain: ProcessingChain;
  spatialImage: SpatialAnalysis;
  frequencyBalance: FrequencyProfile;
  compressionCharacter: CompressionAnalysis;
  analogVsDigital: number; // 0-1 scale
  productionQuality: QualityMetrics;
}

export interface StyleGenome {
  primaryGenre: string;
  subGenres: string[];
  influences: StyleInfluence[];
  era: string;
  region: string;
  mood: MoodProfile;
  energy: number;
  danceability: number;
  complexity: number;
  uniqueness: number;
}

// Cloning result types
export interface CloneResult {
  id: string;
  similarity: SimilarityScore;
  lyrics: ProcessedLyrics;
  musicPrompt: MusicPrompt;
  sunoJobId?: string;
  audioUrl?: string;
  iterations: number;
  metadata: CloneMetadata;
  quality: QualityReport;
}

export interface SimilarityScore {
  overall: number;
  melody: number;
  rhythm: number;
  harmony: number;
  timbre: number;
  structure: number;
  production: number;
  emotion: number;
  confidence: number;
  details: SimilarityDetails;
}

export interface ProcessedLyrics {
  original: string;
  compressed: string;
  structure: LyricStructure;
  language: string;
  characterCount: number;
  tags: string[];
  sentiment: SentimentAnalysis;
  themes: string[];
}

export interface MusicPrompt {
  full: string;
  genre: string;
  tempo: string;
  key: string;
  mood: string;
  instruments: string[];
  production: string;
  reference: string;
  characterCount: number;
}

// Advanced analysis types
export interface ChordInfo {
  chord: string;
  startTime: number;
  duration: number;
  confidence: number;
  function: string; // e.g., "tonic", "dominant"
}

export interface GrooveFeatures {
  swing: number;
  syncopation: number;
  microTiming: number[];
  humanization: number;
  pattern: string;
}

export interface PitchInfo {
  pitch: number;
  time: number;
  confidence: number;
  vibrato?: number;
}

export interface FormantInfo {
  frequency: number;
  amplitude: number;
  bandwidth: number;
  time: number;
}

export interface InstrumentAnalysis {
  instrument: string;
  presence: number[];
  soloSections: TimeRange[];
  playingStyle: string;
  effects: string[];
  stereoPosition: number;
}

export interface VocalAnalysis {
  present: boolean;
  gender?: 'male' | 'female' | 'mixed';
  range: [number, number];
  technique: string[];
  emotion: EmotionProfile;
  language?: string;
  lyrics?: ExtractedLyrics;
  harmony: VocalHarmony;
}

export interface ExtractedLyrics {
  text: string;
  confidence: number;
  timing: LyricTiming[];
  language: string;
  transliteration?: string;
}

// Processing pipeline types
export interface ProcessingJob {
  id: string;
  input: SongInput;
  status: JobStatus;
  progress: number;
  stages: ProcessingStage[];
  result?: CloneResult;
  error?: Error;
  startTime: Date;
  endTime?: Date;
}

export interface ProcessingStage {
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  startTime?: Date;
  endTime?: Date;
  output?: any;
  error?: string;
}

export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';

// Configuration types
export interface SystemConfig {
  processing: ProcessingConfig;
  analysis: AnalysisConfig;
  cloning: CloningConfig;
  api: APIConfig;
  storage: StorageConfig;
  monitoring: MonitoringConfig;
}

export interface ProcessingConfig {
  maxConcurrentJobs: number;
  jobTimeout: number;
  gpuEnabled: boolean;
  workerThreads: number;
  memoryLimit: number;
}

export interface AnalysisConfig {
  fftSize: number;
  hopLength: number;
  sampleRate: number;
  features: string[];
  precision: 'low' | 'medium' | 'high' | 'maximum';
}

// Utility types
export interface TimeRange {
  start: number;
  end: number;
}

export interface AudioFormat {
  codec: string;
  bitrate: number;
  sampleRate: number;
  channels: number;
}

export interface QualityMetrics {
  clarity: number;
  warmth: number;
  punch: number;
  space: number;
  glue: number;
}

// API types
export interface CloneRequest {
  input: SongInput;
  options?: CloningOptions;
  webhook?: string;
}

export interface CloneResponse {
  jobId: string;
  status: JobStatus;
  estimatedTime?: number;
  result?: CloneResult;
}

// Error types
export class CloningError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'CloningError';
  }
}

// Event types
export interface CloningEvent {
  type: 'progress' | 'stage_complete' | 'complete' | 'error';
  jobId: string;
  data: any;
  timestamp: Date;
}

// Additional helper types
export interface SongMetadata {
  title?: string;
  artist?: string;
  album?: string;
  year?: number;
  genre?: string;
  duration: number;
  bitrate?: number;
  format?: string;
}

export interface CulturalMarker {
  type: string;
  region: string;
  confidence: number;
  description: string;
}

export interface StyleInfluence {
  style: string;
  weight: number;
  elements: string[];
}

export interface MoodProfile {
  valence: number;
  arousal: number;
  dominance: number;
  emotions: EmotionScore[];
}

export interface EmotionScore {
  emotion: string;
  intensity: number;
}

export interface SimilarityDetails {
  melodicContour: number;
  rhythmicPattern: number;
  harmonicProgression: number;
  timbreMatching: number;
  structuralAlignment: number;
  productionStyle: number;
  emotionalResonance: number;
  overallCoherence: number;
}