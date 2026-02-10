/**
 * Bagula Confidence Calibration
 * Measures and analyzes agent confidence calibration
 */

import {
  ConfidenceCalibration,
  ConfidenceBucket,
  TestResult,
} from './types';

export interface CalibrationDataPoint {
  confidence: number;
  correct: boolean;
  testId: string;
  timestamp: Date;
}

export class ConfidenceCalibrator {
  private dataPoints: CalibrationDataPoint[] = [];
  private numBuckets: number;

  constructor(numBuckets: number = 10) {
    this.numBuckets = numBuckets;
  }

  /**
   * Add a data point for calibration analysis
   */
  addDataPoint(
    testResult: TestResult,
    isCorrect: boolean
  ): void {
    if (testResult.metrics.confidence === undefined) {
      return;
    }

    this.dataPoints.push({
      confidence: testResult.metrics.confidence,
      correct: isCorrect,
      testId: testResult.testId,
      timestamp: testResult.timestamp,
    });
  }

  /**
   * Calculate calibration metrics
   */
  calculateCalibration(): ConfidenceCalibration {
    if (this.dataPoints.length === 0) {
      return {
        buckets: [],
        overallAccuracy: 0,
        expectedCalibrationError: 0,
      };
    }

    // Create buckets
    const buckets = this.createBuckets();

    // Calculate overall accuracy
    const correctCount = this.dataPoints.filter((dp) => dp.correct).length;
    const overallAccuracy = correctCount / this.dataPoints.length;

    // Calculate Expected Calibration Error (ECE)
    const ece = this.calculateECE(buckets);

    return {
      buckets,
      overallAccuracy,
      expectedCalibrationError: ece,
    };
  }

  /**
   * Create confidence buckets
   */
  private createBuckets(): ConfidenceBucket[] {
    const buckets: ConfidenceBucket[] = [];
    const bucketSize = 1.0 / this.numBuckets;

    for (let i = 0; i < this.numBuckets; i++) {
      const minConfidence = i * bucketSize;
      const maxConfidence = (i + 1) * bucketSize;

      // Find data points in this bucket
      const pointsInBucket = this.dataPoints.filter(
        (dp) => dp.confidence >= minConfidence && dp.confidence < maxConfidence
      );

      // Handle edge case for last bucket
      if (i === this.numBuckets - 1) {
        pointsInBucket.push(
          ...this.dataPoints.filter((dp) => dp.confidence === 1.0)
        );
      }

      if (pointsInBucket.length === 0) {
        buckets.push({
          minConfidence,
          maxConfidence,
          averageConfidence: (minConfidence + maxConfidence) / 2,
          accuracy: 0,
          count: 0,
        });
        continue;
      }

      const correctCount = pointsInBucket.filter((dp) => dp.correct).length;
      const avgConfidence =
        pointsInBucket.reduce((sum, dp) => sum + dp.confidence, 0) /
        pointsInBucket.length;

      buckets.push({
        minConfidence,
        maxConfidence,
        averageConfidence: avgConfidence,
        accuracy: correctCount / pointsInBucket.length,
        count: pointsInBucket.length,
      });
    }

    return buckets;
  }

  /**
   * Calculate Expected Calibration Error (ECE)
   * Lower ECE means better calibration
   */
  private calculateECE(buckets: ConfidenceBucket[]): number {
    const totalSamples = this.dataPoints.length;
    if (totalSamples === 0) return 0;

    let ece = 0;

    for (const bucket of buckets) {
      if (bucket.count === 0) continue;

      const weight = bucket.count / totalSamples;
      const calibrationError = Math.abs(bucket.averageConfidence - bucket.accuracy);
      ece += weight * calibrationError;
    }

    return ece;
  }

  /**
   * Get reliability diagram data
   * Returns [confidence, accuracy] pairs for plotting
   */
  getReliabilityDiagram(): Array<{ confidence: number; accuracy: number }> {
    const buckets = this.createBuckets();
    return buckets
      .filter((b) => b.count > 0)
      .map((b) => ({
        confidence: b.averageConfidence,
        accuracy: b.accuracy,
      }));
  }

  /**
   * Analyze overconfidence and underconfidence
   */
  analyzeConfidenceBias(): {
    overconfident: boolean;
    bias: number;
    description: string;
  } {
    const calibration = this.calculateCalibration();

    if (calibration.buckets.length === 0) {
      return {
        overconfident: false,
        bias: 0,
        description: 'Insufficient data',
      };
    }

    // Calculate average bias across all buckets with data
    const bucketsWithData = calibration.buckets.filter((b) => b.count > 0);
    const avgBias =
      bucketsWithData.reduce(
        (sum, b) => sum + (b.averageConfidence - b.accuracy),
        0
      ) / bucketsWithData.length;

    let description: string;
    if (Math.abs(avgBias) < 0.05) {
      description = 'Well calibrated - confidence matches accuracy';
    } else if (avgBias > 0) {
      description = `Overconfident - claims ${(avgBias * 100).toFixed(1)}% more confidence than actual accuracy`;
    } else {
      description = `Underconfident - claims ${(Math.abs(avgBias) * 100).toFixed(1)}% less confidence than actual accuracy`;
    }

    return {
      overconfident: avgBias > 0,
      bias: avgBias,
      description,
    };
  }

  /**
   * Get confidence-accuracy gap for a specific confidence level
   */
  getConfidenceGap(targetConfidence: number): number {
    const buckets = this.createBuckets();
    const bucket = buckets.find(
      (b) =>
        targetConfidence >= b.minConfidence &&
        targetConfidence <= b.maxConfidence
    );

    if (!bucket || bucket.count === 0) {
      return 0;
    }

    return bucket.averageConfidence - bucket.accuracy;
  }

  /**
   * Clear all data points
   */
  clear(): void {
    this.dataPoints = [];
  }

  /**
   * Get data points for analysis
   */
  getDataPoints(): CalibrationDataPoint[] {
    return [...this.dataPoints];
  }
}
