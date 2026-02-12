/**
 * Utility functions for the dashboard
 */

import { format, formatDistanceToNow } from 'date-fns';

// Format date to readable string
export function formatDate(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy h:mm a');
}

// Format date relative to now (e.g., "2 hours ago")
export function formatRelativeDate(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

// Format duration in milliseconds to readable string
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}

// Format cost in USD
export function formatCost(usd: string | number): string {
  const cost = typeof usd === 'string' ? parseFloat(usd) : usd;
  if (cost < 0.01) return `$${(cost * 1000).toFixed(2)}m`; // Show in millidollars
  return `$${cost.toFixed(4)}`;
}

// Format large numbers with commas
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

// Get severity color
export function getSeverityColor(severity: 'low' | 'medium' | 'high'): string {
  switch (severity) {
    case 'high':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'medium':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'low':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

// Get opportunity type icon
export function getOpportunityIcon(type: 'cost' | 'performance' | 'quality' | 'regression'): string {
  switch (type) {
    case 'cost':
      return '💰';
    case 'performance':
      return '⚡';
    case 'quality':
      return '🎯';
    case 'regression':
      return '📉';
    default:
      return '🔍';
  }
}

// Truncate text with ellipsis
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Class name helper (simple implementation)
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
