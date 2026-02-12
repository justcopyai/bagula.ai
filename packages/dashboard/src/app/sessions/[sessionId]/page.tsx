'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import bagulaApi, { AgentSession, Opportunity } from '@/lib/api-client';
import { formatDate, formatDuration, formatCost, formatNumber } from '@/lib/utils';
import LLMCallViewer from '@/components/LLMCallViewer';
import OpportunityCard from '@/components/OpportunityCard';

export default function SessionDetailPage({ params }: { params: { sessionId: string } }) {
  const { sessionId } = params;
  const [session, setSession] = useState<AgentSession | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'turns' | 'opportunities'>('overview');

  useEffect(() => {
    loadSessionData();
  }, [sessionId]);

  async function loadSessionData() {
    try {
      setLoading(true);
      setError(null);

      const [sessionData, opportunitiesData] = await Promise.all([
        bagulaApi.getSession(sessionId),
        bagulaApi.getSessionOpportunities(sessionId),
      ]);

      setSession(sessionData);
      setOpportunities(opportunitiesData.opportunities);
    } catch (err: any) {
      console.error('Error loading session:', err);
      setError(err.message || 'Failed to load session');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Session</h3>
        <p className="text-red-700">{error || 'Session not found'}</p>
        <Link href="/" className="text-primary-600 hover:text-primary-700 mt-4 inline-block">
          ← Back to Sessions
        </Link>
      </div>
    );
  }

  const duration = session.endTime
    ? new Date(session.endTime).getTime() - new Date(session.startTime).getTime()
    : 0;

  // Calculate aggregated metrics
  const totalLLMCalls = session.turns?.reduce((sum, turn) => sum + (turn.llmCalls?.length || 0), 0) || 0;
  const totalToolCalls = session.turns?.reduce((sum, turn) => sum + (turn.toolCalls?.length || 0), 0) || 0;
  const totalTokens = session.turns?.reduce(
    (sum, turn) =>
      sum +
      (turn.llmCalls?.reduce((s, call) => s + (call.tokensTotal || 0), 0) || 0),
    0
  ) || 0;
  const totalCost = session.turns?.reduce(
    (sum, turn) =>
      sum +
      (turn.llmCalls?.reduce((s, call) => s + parseFloat(call.costUsd || '0'), 0) || 0),
    0
  ) || 0;

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/"
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        ← Back to Sessions
      </Link>

      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{session.agentName}</h1>
            <p className="mt-2 text-gray-700">{session.initialRequest}</p>
            {session.userId && (
              <p className="mt-2 text-sm text-gray-500">User: {session.userId}</p>
            )}
          </div>
          <div className="ml-4">
            <span
              className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                (session.finalOutcome as any)?.status === 'success'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {(session.finalOutcome as any)?.status || 'unknown'}
            </span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-6 pt-6 border-t border-gray-200">
          <div>
            <div className="text-xs text-gray-500 uppercase">Duration</div>
            <div className="text-lg font-semibold text-gray-900 mt-1">
              {formatDuration(duration)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase">Turns</div>
            <div className="text-lg font-semibold text-gray-900 mt-1">
              {session.turns?.length || 0}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase">LLM Calls</div>
            <div className="text-lg font-semibold text-gray-900 mt-1">{totalLLMCalls}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase">Tool Calls</div>
            <div className="text-lg font-semibold text-gray-900 mt-1">{totalToolCalls}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase">Tokens</div>
            <div className="text-lg font-semibold text-gray-900 mt-1">
              {formatNumber(totalTokens)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase">Cost</div>
            <div className="text-lg font-semibold text-gray-900 mt-1">
              {formatCost(totalCost)}
            </div>
          </div>
        </div>

        {/* Session ID */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">Session ID</div>
          <code className="text-xs text-gray-700 bg-gray-50 px-2 py-1 rounded mt-1 inline-block">
            {session.sessionId}
          </code>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {(['overview', 'turns', 'opportunities'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
                {tab === 'opportunities' && opportunities.length > 0 && (
                  <span className="ml-2 bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">
                    {opportunities.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Session Timeline</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <span className="text-gray-500 w-32">Started:</span>
                      <span className="text-gray-900 font-medium">
                        {formatDate(session.startTime)}
                      </span>
                    </div>
                    {session.endTime && (
                      <div className="flex items-center text-sm">
                        <span className="text-gray-500 w-32">Completed:</span>
                        <span className="text-gray-900 font-medium">
                          {formatDate(session.endTime)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {session.finalOutcome && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Final Outcome</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="text-sm text-gray-700 overflow-x-auto">
                      {JSON.stringify(session.finalOutcome, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {session.metadata && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Metadata</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="text-sm text-gray-700 overflow-x-auto">
                      {JSON.stringify(session.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Turns Tab */}
          {activeTab === 'turns' && (
            <div className="space-y-6">
              {session.turns?.map((turn, index) => (
                <div key={turn.turnId} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Turn Header */}
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-gray-900">
                        Turn {turn.turnNumber}
                      </h4>
                      <span className="text-xs text-gray-500">
                        {formatDate(turn.timestamp)}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Trigger */}
                    <div>
                      <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                        Trigger
                      </div>
                      <div className="bg-blue-50 rounded p-3">
                        <pre className="text-sm text-gray-700 overflow-x-auto">
                          {JSON.stringify(turn.trigger, null, 2)}
                        </pre>
                      </div>
                    </div>

                    {/* LLM Calls */}
                    {turn.llmCalls && turn.llmCalls.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-gray-500 uppercase mb-2">
                          LLM Calls ({turn.llmCalls.length})
                        </div>
                        <div className="space-y-3">
                          {turn.llmCalls.map((llmCall) => (
                            <LLMCallViewer key={llmCall.callId} llmCall={llmCall} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tool Calls */}
                    {turn.toolCalls && turn.toolCalls.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-gray-500 uppercase mb-2">
                          Tool Calls ({turn.toolCalls.length})
                        </div>
                        <div className="space-y-2">
                          {turn.toolCalls.map((toolCall) => (
                            <div
                              key={toolCall.toolId}
                              className="border border-gray-200 rounded-lg p-3"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-gray-900">
                                  {toolCall.toolName}
                                </span>
                                <div className="flex items-center space-x-2">
                                  {toolCall.error && (
                                    <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                                      Error
                                    </span>
                                  )}
                                  {toolCall.latencyMs && (
                                    <span className="text-xs text-gray-500">
                                      {formatDuration(toolCall.latencyMs)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {toolCall.arguments && (
                                <details className="mt-2">
                                  <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-900">
                                    Arguments
                                  </summary>
                                  <pre className="text-xs text-gray-700 bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                                    {JSON.stringify(toolCall.arguments, null, 2)}
                                  </pre>
                                </details>
                              )}
                              {toolCall.result && (
                                <details className="mt-2">
                                  <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-900">
                                    Result
                                  </summary>
                                  <pre className="text-xs text-gray-700 bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                                    {JSON.stringify(toolCall.result, null, 2)}
                                  </pre>
                                </details>
                              )}
                              {toolCall.error && (
                                <div className="mt-2 text-sm text-red-700 bg-red-50 p-2 rounded">
                                  {toolCall.error}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Agent Response */}
                    {turn.agentResponse && (
                      <div>
                        <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                          Agent Response
                        </div>
                        <div className="bg-green-50 rounded p-3">
                          <pre className="text-sm text-gray-700 overflow-x-auto">
                            {JSON.stringify(turn.agentResponse, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Opportunities Tab */}
          {activeTab === 'opportunities' && (
            <div className="space-y-4">
              {opportunities.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">✨</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Opportunities Detected
                  </h3>
                  <p className="text-gray-600">
                    This session looks good! No cost, performance, or quality issues found.
                  </p>
                </div>
              ) : (
                opportunities.map((opportunity) => (
                  <OpportunityCard
                    key={opportunity.opportunityId}
                    opportunity={opportunity}
                    onResolve={() => loadSessionData()}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
