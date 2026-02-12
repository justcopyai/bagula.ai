'use client';

import { useState } from 'react';
import { Opportunity } from '@/lib/api-client';
import bagulaApi from '@/lib/api-client';
import { getSeverityColor, getOpportunityIcon, formatCost, formatDuration } from '@/lib/utils';

interface OpportunityCardProps {
  opportunity: Opportunity;
  onResolve?: () => void;
}

export default function OpportunityCard({ opportunity, onResolve }: OpportunityCardProps) {
  const [resolving, setResolving] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  async function handleResolve() {
    if (resolving) return;

    try {
      setResolving(true);
      await bagulaApi.resolveOpportunity(opportunity.opportunityId, 'Resolved from dashboard');
      onResolve?.();
    } catch (error) {
      console.error('Error resolving opportunity:', error);
      alert('Failed to resolve opportunity');
    } finally {
      setResolving(false);
    }
  }

  const severityColor = getSeverityColor(opportunity.severity);
  const icon = getOpportunityIcon(opportunity.type);

  return (
    <div className={`border rounded-lg overflow-hidden ${opportunity.resolved ? 'opacity-60' : ''}`}>
      {/* Header */}
      <div className={`px-4 py-3 border-b ${severityColor}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{icon}</span>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-semibold">{opportunity.title}</h4>
                <span className="text-xs uppercase font-medium px-2 py-0.5 rounded">
                  {opportunity.severity}
                </span>
              </div>
              <div className="text-xs mt-1 opacity-75 capitalize">{opportunity.type}</div>
            </div>
          </div>
          {opportunity.resolved && (
            <span className="bg-gray-900 text-white text-xs px-3 py-1 rounded-full">
              ✓ Resolved
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 bg-white">
        {/* Description */}
        {opportunity.description && (
          <p className="text-sm text-gray-700 mb-3">{opportunity.description}</p>
        )}

        {/* Estimated Impact */}
        {(opportunity.estimatedCostSavingsUsd || opportunity.estimatedLatencyReductionMs) && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
            <div className="text-xs font-medium text-green-800 uppercase mb-2">
              Estimated Impact
            </div>
            <div className="flex items-center space-x-4 text-sm">
              {opportunity.estimatedCostSavingsUsd && (
                <div>
                  <span className="text-green-600 font-semibold">
                    {formatCost(opportunity.estimatedCostSavingsUsd)}
                  </span>
                  <span className="text-green-700 ml-1">saved</span>
                </div>
              )}
              {opportunity.estimatedLatencyReductionMs && (
                <div>
                  <span className="text-green-600 font-semibold">
                    {formatDuration(opportunity.estimatedLatencyReductionMs)}
                  </span>
                  <span className="text-green-700 ml-1">faster</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Suggested Action */}
        {opportunity.suggestedAction && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
            <div className="text-xs font-medium text-blue-800 uppercase mb-1">
              Suggested Action
            </div>
            <p className="text-sm text-blue-900">{opportunity.suggestedAction}</p>
          </div>
        )}

        {/* Details Toggle */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-gray-600 hover:text-gray-900 mb-3"
        >
          {showDetails ? '− Hide' : '+ Show'} Technical Details
        </button>

        {showDetails && (
          <div className="bg-gray-50 rounded-lg p-3 mb-3">
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Opportunity ID:</span>
                <code className="text-gray-900 bg-white px-2 py-1 rounded">
                  {opportunity.opportunityId.substring(0, 8)}...
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Session ID:</span>
                <code className="text-gray-900 bg-white px-2 py-1 rounded">
                  {opportunity.sessionId.substring(0, 8)}...
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Detected:</span>
                <span className="text-gray-900">{new Date(opportunity.detectedAt).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {!opportunity.resolved && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleResolve}
              disabled={resolving}
              className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {resolving ? 'Resolving...' : 'Mark as Resolved'}
            </button>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
              Learn More
            </button>
          </div>
        )}

        {opportunity.resolved && opportunity.resolutionNote && (
          <div className="text-sm text-gray-600 italic mt-2">
            Note: {opportunity.resolutionNote}
          </div>
        )}
      </div>
    </div>
  );
}
