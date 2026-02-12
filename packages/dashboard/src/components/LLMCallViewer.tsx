'use client';

import { useState } from 'react';
import { LLMCall } from '@/lib/api-client';
import { formatDuration, formatCost, formatNumber } from '@/lib/utils';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import { github } from 'react-syntax-highlighter/dist/esm/styles/hljs';

SyntaxHighlighter.registerLanguage('json', json);

interface LLMCallViewerProps {
  llmCall: LLMCall;
}

export default function LLMCallViewer({ llmCall }: LLMCallViewerProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'request' | 'response'>('summary');
  const [expanded, setExpanded] = useState(false);

  const latency = llmCall.latencyMs || 0;
  const cost = parseFloat(llmCall.costUsd || '0');

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Collapsed Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 bg-purple-50 hover:bg-purple-100 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center space-x-3">
          <span className={`transform transition-transform ${expanded ? 'rotate-90' : ''}`}>
            ▶
          </span>
          <div className="text-left">
            <div className="font-medium text-gray-900">
              {llmCall.provider}/{llmCall.model}
            </div>
            <div className="text-xs text-gray-600 flex items-center space-x-4 mt-1">
              <span>{formatNumber(llmCall.tokensTotal || 0)} tokens</span>
              <span>{formatCost(cost)}</span>
              <span>{formatDuration(latency)}</span>
            </div>
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div>
          {/* Tabs */}
          <div className="border-b border-gray-200 bg-gray-50">
            <nav className="flex space-x-4 px-4" aria-label="Tabs">
              {(['summary', 'request', 'response'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 px-1 border-b-2 font-medium text-sm capitalize ${
                    activeTab === tab
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-4">
            {/* Summary Tab */}
            {activeTab === 'summary' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded p-3">
                  <div className="text-xs text-gray-500 uppercase">Model</div>
                  <div className="text-sm font-semibold text-gray-900 mt-1">
                    {llmCall.provider}/{llmCall.model}
                  </div>
                </div>
                <div className="bg-gray-50 rounded p-3">
                  <div className="text-xs text-gray-500 uppercase">Tokens</div>
                  <div className="text-sm font-semibold text-gray-900 mt-1">
                    {formatNumber(llmCall.tokensTotal || 0)}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    In: {formatNumber(llmCall.tokensInput || 0)} / Out:{' '}
                    {formatNumber(llmCall.tokensOutput || 0)}
                  </div>
                </div>
                <div className="bg-gray-50 rounded p-3">
                  <div className="text-xs text-gray-500 uppercase">Cost</div>
                  <div className="text-sm font-semibold text-gray-900 mt-1">
                    {formatCost(cost)}
                  </div>
                </div>
                <div className="bg-gray-50 rounded p-3">
                  <div className="text-xs text-gray-500 uppercase">Latency</div>
                  <div className="text-sm font-semibold text-gray-900 mt-1">
                    {formatDuration(latency)}
                  </div>
                </div>
              </div>
            )}

            {/* Request Tab */}
            {activeTab === 'request' && (
              <div className="space-y-3">
                {llmCall.messages && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Messages</div>
                    <div className="code-block">
                      <SyntaxHighlighter
                        language="json"
                        style={github}
                        customStyle={{
                          margin: 0,
                          padding: '1rem',
                          fontSize: '0.75rem',
                          maxHeight: '400px',
                          overflow: 'auto',
                        }}
                      >
                        {JSON.stringify(llmCall.messages, null, 2)}
                      </SyntaxHighlighter>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Response Tab */}
            {activeTab === 'response' && (
              <div>
                {llmCall.response && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Full Response</div>
                    <div className="code-block">
                      <SyntaxHighlighter
                        language="json"
                        style={github}
                        customStyle={{
                          margin: 0,
                          padding: '1rem',
                          fontSize: '0.75rem',
                          maxHeight: '400px',
                          overflow: 'auto',
                        }}
                      >
                        {JSON.stringify(llmCall.response, null, 2)}
                      </SyntaxHighlighter>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
