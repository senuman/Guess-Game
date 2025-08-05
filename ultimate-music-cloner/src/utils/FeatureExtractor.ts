/**
 * Feature Extractor utility for advanced audio feature extraction
 */

import { Logger } from './Logger';

export class FeatureExtractor {
  private logger: Logger;
  private config: any;
  
  constructor(config: any) {
    this.logger = new Logger('FeatureExtractor');
    this.config = config;
  }
  
  /**
   * Extract spectral centroid
   */
  extractSpectralCentroid(spectrum: Float32Array, sampleRate: number): number {
    let weightedSum = 0;
    let magnitudeSum = 0;
    
    for (let i = 0; i < spectrum.length; i++) {
      const frequency = (i * sampleRate) / (2 * spectrum.length);
      weightedSum += frequency * spectrum[i];
      magnitudeSum += spectrum[i];
    }
    
    return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
  }
  
  /**
   * Extract spectral rolloff
   */
  extractSpectralRolloff(spectrum: Float32Array, sampleRate: number, threshold: number = 0.85): number {
    const totalEnergy = spectrum.reduce((sum, val) => sum + val, 0);
    const targetEnergy = totalEnergy * threshold;
    
    let cumulativeEnergy = 0;
    for (let i = 0; i < spectrum.length; i++) {
      cumulativeEnergy += spectrum[i];
      if (cumulativeEnergy >= targetEnergy) {
        return (i * sampleRate) / (2 * spectrum.length);
      }
    }
    
    return sampleRate / 2;
  }
  
  /**
   * Extract spectral flux
   */
  extractSpectralFlux(currentSpectrum: Float32Array, previousSpectrum: Float32Array): number {
    let flux = 0;
    
    for (let i = 0; i < currentSpectrum.length; i++) {
      const diff = currentSpectrum[i] - (previousSpectrum?.[i] || 0);
      if (diff > 0) {
        flux += diff;
      }
    }
    
    return flux;
  }
  
  /**
   * Extract zero crossing rate
   */
  extractZeroCrossingRate(frame: Float32Array): number {
    let crossings = 0;
    
    for (let i = 1; i < frame.length; i++) {
      if ((frame[i] >= 0) !== (frame[i - 1] >= 0)) {
        crossings++;
      }
    }
    
    return crossings / frame.length;
  }
  
  /**
   * Extract spectral bandwidth
   */
  extractSpectralBandwidth(spectrum: Float32Array, centroid: number, sampleRate: number): number {
    let weightedVariance = 0;
    let magnitudeSum = 0;
    
    for (let i = 0; i < spectrum.length; i++) {
      const frequency = (i * sampleRate) / (2 * spectrum.length);
      const deviation = frequency - centroid;
      weightedVariance += spectrum[i] * deviation * deviation;
      magnitudeSum += spectrum[i];
    }
    
    return magnitudeSum > 0 ? Math.sqrt(weightedVariance / magnitudeSum) : 0;
  }
  
  /**
   * Extract spectral contrast
   */
  extractSpectralContrast(spectrum: Float32Array, numBands: number = 6): number[] {
    const contrast: number[] = [];
    const bandSize = Math.floor(spectrum.length / numBands);
    
    for (let band = 0; band < numBands; band++) {
      const start = band * bandSize;
      const end = Math.min((band + 1) * bandSize, spectrum.length);
      
      const bandSpectrum = spectrum.slice(start, end);
      const sorted = [...bandSpectrum].sort((a, b) => b - a);
      
      // Peak (average of top 10%)
      const peakCount = Math.max(1, Math.floor(sorted.length * 0.1));
      const peak = sorted.slice(0, peakCount).reduce((a, b) => a + b, 0) / peakCount;
      
      // Valley (average of bottom 10%)
      const valleyCount = Math.max(1, Math.floor(sorted.length * 0.1));
      const valley = sorted.slice(-valleyCount).reduce((a, b) => a + b, 0) / valleyCount;
      
      contrast.push(peak - valley);
    }
    
    return contrast;
  }
  
  /**
   * Extract spectral flatness
   */
  extractSpectralFlatness(spectrum: Float32Array): number {
    const geometricMean = this.geometricMean(spectrum);
    const arithmeticMean = spectrum.reduce((a, b) => a + b, 0) / spectrum.length;
    
    return arithmeticMean > 0 ? geometricMean / arithmeticMean : 0;
  }
  
  /**
   * Calculate geometric mean
   */
  private geometricMean(values: Float32Array): number {
    let logSum = 0;
    let count = 0;
    
    for (const value of values) {
      if (value > 0) {
        logSum += Math.log(value);
        count++;
      }
    }
    
    return count > 0 ? Math.exp(logSum / count) : 0;
  }
  
  /**
   * Extract harmonic-to-noise ratio
   */
  extractHNR(frame: Float32Array, sampleRate: number): number {
    // Simplified HNR calculation
    // In production, would use autocorrelation-based method
    const energy = frame.reduce((sum, val) => sum + val * val, 0);
    const noise = this.estimateNoise(frame);
    
    return energy > 0 ? 10 * Math.log10(energy / noise) : 0;
  }
  
  /**
   * Estimate noise in signal
   */
  private estimateNoise(frame: Float32Array): number {
    // Simple noise estimation using high-frequency energy
    const highFreqStart = Math.floor(frame.length * 0.8);
    let noiseEnergy = 0;
    
    for (let i = highFreqStart; i < frame.length; i++) {
      noiseEnergy += frame[i] * frame[i];
    }
    
    return noiseEnergy / (frame.length - highFreqStart);
  }
  
  /**
   * Extract onset strength
   */
  extractOnsetStrength(spectrum: Float32Array, previousSpectrum: Float32Array): number {
    let strength = 0;
    
    // Spectral flux with emphasis on increases
    for (let i = 0; i < spectrum.length; i++) {
      const diff = spectrum[i] - (previousSpectrum?.[i] || 0);
      if (diff > 0) {
        // Weight by frequency band
        const weight = 1 + i / spectrum.length; // Higher frequencies weighted more
        strength += diff * weight;
      }
    }
    
    return strength;
  }
  
  /**
   * Extract tonal power ratio
   */
  extractTonalPowerRatio(spectrum: Float32Array): number {
    // Find peaks (tonal components)
    const peaks = this.findSpectralPeaks(spectrum);
    
    let tonalPower = 0;
    for (const peak of peaks) {
      tonalPower += spectrum[peak];
    }
    
    const totalPower = spectrum.reduce((sum, val) => sum + val, 0);
    
    return totalPower > 0 ? tonalPower / totalPower : 0;
  }
  
  /**
   * Find spectral peaks
   */
  private findSpectralPeaks(spectrum: Float32Array, threshold: number = 0.1): number[] {
    const peaks: number[] = [];
    const maxValue = Math.max(...spectrum);
    const minPeakHeight = maxValue * threshold;
    
    for (let i = 1; i < spectrum.length - 1; i++) {
      if (spectrum[i] > minPeakHeight &&
          spectrum[i] > spectrum[i - 1] &&
          spectrum[i] > spectrum[i + 1]) {
        peaks.push(i);
      }
    }
    
    return peaks;
  }
  
  /**
   * Extract roughness
   */
  extractRoughness(spectrum: Float32Array): number {
    // Simplified roughness based on beating between close frequencies
    let roughness = 0;
    
    for (let i = 0; i < spectrum.length - 1; i++) {
      for (let j = i + 1; j < Math.min(i + 10, spectrum.length); j++) {
        const freqDiff = j - i;
        const amplitudeProduct = spectrum[i] * spectrum[j];
        
        // Roughness is highest for frequency differences around 20-200 Hz
        const roughnessWeight = Math.exp(-Math.pow((freqDiff - 5) / 10, 2));
        roughness += amplitudeProduct * roughnessWeight;
      }
    }
    
    return roughness;
  }
  
  /**
   * Extract inharmonicity
   */
  extractInharmonicity(spectrum: Float32Array, fundamentalBin: number): number {
    if (fundamentalBin <= 0) return 0;
    
    let inharmonicity = 0;
    let totalEnergy = 0;
    
    // Check first 10 harmonics
    for (let harmonic = 1; harmonic <= 10; harmonic++) {
      const expectedBin = fundamentalBin * harmonic;
      const actualBin = this.findNearestPeak(spectrum, expectedBin);
      
      if (actualBin !== -1) {
        const deviation = Math.abs(actualBin - expectedBin) / expectedBin;
        const energy = spectrum[actualBin];
        inharmonicity += deviation * energy;
        totalEnergy += energy;
      }
    }
    
    return totalEnergy > 0 ? inharmonicity / totalEnergy : 0;
  }
  
  /**
   * Find nearest peak to expected position
   */
  private findNearestPeak(spectrum: Float32Array, targetBin: number, searchRadius: number = 5): number {
    const start = Math.max(1, Math.floor(targetBin - searchRadius));
    const end = Math.min(spectrum.length - 2, Math.ceil(targetBin + searchRadius));
    
    let nearestPeak = -1;
    let nearestDistance = Infinity;
    
    for (let i = start; i <= end; i++) {
      if (spectrum[i] > spectrum[i - 1] && spectrum[i] > spectrum[i + 1]) {
        const distance = Math.abs(i - targetBin);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestPeak = i;
        }
      }
    }
    
    return nearestPeak;
  }
}