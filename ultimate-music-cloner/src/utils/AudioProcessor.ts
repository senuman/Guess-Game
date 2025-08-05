/**
 * Audio Processor utility for format conversion and basic processing
 */

import ffmpeg from 'fluent-ffmpeg';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from './Logger';

export class AudioProcessor {
  private logger: Logger;
  private tempDir: string;
  private sampleRate: number;
  
  constructor(config: { tempDir?: string; sampleRate?: number }) {
    this.logger = new Logger('AudioProcessor');
    this.tempDir = config.tempDir || '/tmp/audio-processor';
    this.sampleRate = config.sampleRate || 44100;
    
    // Ensure temp directory exists
    this.ensureTempDir();
  }
  
  /**
   * Ensure temp directory exists
   */
  private async ensureTempDir(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      this.logger.error('Failed to create temp directory:', error);
    }
  }
  
  /**
   * Convert audio to WAV format
   */
  async convertToWav(inputBuffer: Buffer): Promise<Buffer> {
    const inputPath = path.join(this.tempDir, `${uuidv4()}.input`);
    const outputPath = path.join(this.tempDir, `${uuidv4()}.wav`);
    
    try {
      // Write input buffer to temp file
      await fs.writeFile(inputPath, inputBuffer);
      
      // Convert using ffmpeg
      await new Promise<void>((resolve, reject) => {
        ffmpeg(inputPath)
          .toFormat('wav')
          .audioCodec('pcm_s16le')
          .audioFrequency(this.sampleRate)
          .audioChannels(1) // Mono for analysis
          .on('end', () => resolve())
          .on('error', (err) => reject(err))
          .save(outputPath);
      });
      
      // Read converted file
      const wavBuffer = await fs.readFile(outputPath);
      
      // Cleanup temp files
      await Promise.all([
        fs.unlink(inputPath).catch(() => {}),
        fs.unlink(outputPath).catch(() => {})
      ]);
      
      return wavBuffer;
      
    } catch (error) {
      this.logger.error('Audio conversion failed:', error);
      
      // Cleanup on error
      await Promise.all([
        fs.unlink(inputPath).catch(() => {}),
        fs.unlink(outputPath).catch(() => {})
      ]);
      
      throw error;
    }
  }
  
  /**
   * Decode WAV buffer to Float32Array
   */
  async decode(wavBuffer: Buffer): Promise<Float32Array> {
    // Parse WAV header
    const dataOffset = this.findDataChunk(wavBuffer);
    if (dataOffset === -1) {
      throw new Error('Invalid WAV file: data chunk not found');
    }
    
    // Extract PCM data
    const pcmData = wavBuffer.slice(dataOffset);
    const samples = new Float32Array(pcmData.length / 2);
    
    // Convert 16-bit PCM to float32
    for (let i = 0; i < samples.length; i++) {
      const sample = pcmData.readInt16LE(i * 2);
      samples[i] = sample / 32768.0; // Normalize to [-1, 1]
    }
    
    return samples;
  }
  
  /**
   * Find data chunk in WAV file
   */
  private findDataChunk(buffer: Buffer): number {
    let offset = 12; // Skip RIFF header
    
    while (offset < buffer.length - 8) {
      const chunkId = buffer.toString('ascii', offset, offset + 4);
      const chunkSize = buffer.readUInt32LE(offset + 4);
      
      if (chunkId === 'data') {
        return offset + 8; // Return offset to actual data
      }
      
      offset += 8 + chunkSize;
      if (chunkSize % 2 === 1) offset++; // Padding byte
    }
    
    return -1;
  }
  
  /**
   * Normalize audio data
   */
  normalize(audioData: Float32Array): Float32Array {
    // Find peak amplitude
    let peak = 0;
    for (let i = 0; i < audioData.length; i++) {
      const abs = Math.abs(audioData[i]);
      if (abs > peak) peak = abs;
    }
    
    if (peak === 0) return audioData;
    
    // Normalize to peak of 0.95 to avoid clipping
    const normalized = new Float32Array(audioData.length);
    const scale = 0.95 / peak;
    
    for (let i = 0; i < audioData.length; i++) {
      normalized[i] = audioData[i] * scale;
    }
    
    return normalized;
  }
  
  /**
   * Apply pre-emphasis filter
   */
  applyPreEmphasis(audioData: Float32Array, coefficient: number = 0.97): Float32Array {
    const filtered = new Float32Array(audioData.length);
    filtered[0] = audioData[0];
    
    for (let i = 1; i < audioData.length; i++) {
      filtered[i] = audioData[i] - coefficient * audioData[i - 1];
    }
    
    return filtered;
  }
  
  /**
   * Apply high-pass filter to remove DC offset
   */
  removeDCOffset(audioData: Float32Array): Float32Array {
    // Calculate mean
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) {
      sum += audioData[i];
    }
    const mean = sum / audioData.length;
    
    // Remove DC offset
    const filtered = new Float32Array(audioData.length);
    for (let i = 0; i < audioData.length; i++) {
      filtered[i] = audioData[i] - mean;
    }
    
    return filtered;
  }
  
  /**
   * Resample audio to target sample rate
   */
  async resample(
    audioData: Float32Array, 
    currentRate: number, 
    targetRate: number
  ): Promise<Float32Array> {
    if (currentRate === targetRate) return audioData;
    
    const ratio = targetRate / currentRate;
    const newLength = Math.floor(audioData.length * ratio);
    const resampled = new Float32Array(newLength);
    
    // Simple linear interpolation resampling
    for (let i = 0; i < newLength; i++) {
      const srcIndex = i / ratio;
      const srcIndexInt = Math.floor(srcIndex);
      const fraction = srcIndex - srcIndexInt;
      
      if (srcIndexInt + 1 < audioData.length) {
        resampled[i] = audioData[srcIndexInt] * (1 - fraction) +
                       audioData[srcIndexInt + 1] * fraction;
      } else {
        resampled[i] = audioData[srcIndexInt];
      }
    }
    
    return resampled;
  }
  
  /**
   * Extract mono channel from stereo
   */
  extractMono(stereoData: Float32Array): Float32Array {
    const monoLength = Math.floor(stereoData.length / 2);
    const mono = new Float32Array(monoLength);
    
    for (let i = 0; i < monoLength; i++) {
      // Average left and right channels
      mono[i] = (stereoData[i * 2] + stereoData[i * 2 + 1]) / 2;
    }
    
    return mono;
  }
  
  /**
   * Apply fade in/out to audio
   */
  applyFade(
    audioData: Float32Array, 
    fadeInSamples: number = 0, 
    fadeOutSamples: number = 0
  ): Float32Array {
    const faded = new Float32Array(audioData);
    
    // Apply fade in
    for (let i = 0; i < fadeInSamples && i < audioData.length; i++) {
      const gain = i / fadeInSamples;
      faded[i] *= gain;
    }
    
    // Apply fade out
    const startFadeOut = audioData.length - fadeOutSamples;
    for (let i = startFadeOut; i < audioData.length; i++) {
      const gain = (audioData.length - i) / fadeOutSamples;
      faded[i] *= gain;
    }
    
    return faded;
  }
  
  /**
   * Split audio into chunks
   */
  splitIntoChunks(
    audioData: Float32Array, 
    chunkSize: number, 
    overlap: number = 0
  ): Float32Array[] {
    const chunks: Float32Array[] = [];
    const hopSize = chunkSize - overlap;
    
    for (let i = 0; i <= audioData.length - chunkSize; i += hopSize) {
      chunks.push(audioData.slice(i, i + chunkSize));
    }
    
    return chunks;
  }
  
  /**
   * Cleanup temporary files
   */
  async cleanup(): Promise<void> {
    try {
      await fs.rmdir(this.tempDir, { recursive: true });
    } catch (error) {
      this.logger.warn('Failed to cleanup temp directory:', error);
    }
  }
}