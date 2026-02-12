'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import bagulaApi, { AgentSession } from '@/lib/api-client';
import { formatDate, formatRelativeDate, formatCost, formatDuration } from '@/lib/utils';

export default function SessionsPage() {
  const [sessions, setSessions] = useState<AgentSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [availableAgents, setAvailableAgents] = useState<string[]>([]);

  useEffect(() => {
    loadSessions();
  }, [agentFilter]);

  async function loadSessions() {
    try {
      setLoading(true);
      setError(null);

      // For now, we'll fetch sessions without agent filter
      // In production, you'd have an endpoint to list all sessions
      // For demo, we'll use a default agent name or fetch from multiple agents
      const response = await bagulaApi.getSessions(agentFilter === 'all' ? 'demo-agent' : agentFilter);
      setSessions(response.sessions);

      // Extract unique agent names
      const agents = Array.from(new Set(response.sessions.map((s) => s.agentName)));
      setAvailableAgents(agents);
    } catch (err: any) {
      console.error('Error loading sessions:', err);
      setError(err.message || 'Failed to load sessions');
      // Show empty state instead of error for demo
      setSessions([]);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agent Sessions</h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor and analyze your AI agent executions
          </p>
        </div>
        <button
          onClick={loadSessions}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      {availableAgents.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Filter by Agent:</label>
            <select
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Agents</option>
              {availableAgents.map((agent) => (
                <option key={agent} value={agent}>
                  {agent}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-red-600 mr-2">⚠️</span>
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && sessions.length === 0 && (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-4xl">🔍</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Sessions Yet</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Start sending session data from your instrumented agents to see them here.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 text-left max-w-2xl mx-auto">
            <p className="text-sm text-gray-700 font-medium mb-2">Quick Start:</p>
            <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
              {`npm install @bagula/client

import { BagulaClient } from '@bagula/client';

const bagula = new BagulaClient({
  apiKey: 'your-api-key',
  endpoint: '${process.env.NEXT_PUBLIC_API_URL}'
});`}
            </pre>
          </div>
        </div>
      )}

      {/* Sessions Table */}
      {sessions.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agent / Request
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sessions.map((session) => {
                const duration = session.endTime
                  ? new Date(session.endTime).getTime() - new Date(session.startTime).getTime()
                  : 0;
                const status = (session.finalOutcome as any)?.status || 'unknown';

                return (
                  <tr key={session.sessionId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">
                          {session.agentName}
                        </span>
                        <span className="text-sm text-gray-500 truncate max-w-md">
                          {session.initialRequest.substring(0, 100)}
                          {session.initialRequest.length > 100 && '...'}
                        </span>
                        {session.userId && (
                          <span className="text-xs text-gray-400 mt-1">
                            User: {session.userId}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-900">
                          {formatRelativeDate(session.startTime)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(session.startTime)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {duration > 0 ? formatDuration(duration) : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          status === 'success'
                            ? 'bg-green-100 text-green-800'
                            : status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        href={`/sessions/${session.sessionId}`}
                        className="text-primary-600 hover:text-primary-900 font-medium"
                      >
                        View Details →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Stats */}
      {sessions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Total Sessions</div>
            <div className="text-2xl font-bold text-gray-900 mt-2">{sessions.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Success Rate</div>
            <div className="text-2xl font-bold text-green-600 mt-2">
              {(
                (sessions.filter((s) => (s.finalOutcome as any)?.status === 'success').length /
                  sessions.length) *
                100
              ).toFixed(0)}
              %
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Avg Duration</div>
            <div className="text-2xl font-bold text-gray-900 mt-2">
              {formatDuration(
                sessions.reduce((sum, s) => {
                  if (s.endTime) {
                    return (
                      sum +
                      (new Date(s.endTime).getTime() - new Date(s.startTime).getTime())
                    );
                  }
                  return sum;
                }, 0) / sessions.filter((s) => s.endTime).length
              )}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Active Agents</div>
            <div className="text-2xl font-bold text-gray-900 mt-2">{availableAgents.length}</div>
          </div>
        </div>
      )}
    </div>
  );
}
