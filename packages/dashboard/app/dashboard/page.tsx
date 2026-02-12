'use client';

import { useOrganization } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { Activity, Clock, DollarSign } from 'lucide-react';

interface Session {
  session_id: string;
  agent_name: string;
  start_time: string;
  end_time?: string;
  status: string;
  total_cost_usd?: number;
}

const isCloudMode = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function SessionsPage() {
  // In cloud mode, get organization from Clerk
  const { organization } = isCloudMode ? useOrganization() : { organization: null };
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cloud mode: Wait for organization selection
    if (isCloudMode && !organization) {
      setLoading(false);
      return;
    }

    // Fetch sessions from API
    // In cloud mode: fetch for specific organization
    // In self-hosted mode: fetch all sessions
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    // TODO: Implement actual API call
    // fetch(`${apiUrl}/v1/sessions`)
    //   .then(res => res.json())
    //   .then(data => setSessions(data.sessions))
    //   .catch(console.error)
    //   .finally(() => setLoading(false));

    setLoading(false);
    setSessions([]);
  }, [organization]);

  // Cloud mode: Show org selection prompt
  if (isCloudMode && !organization) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Please select an organization
          </h2>
          <p className="text-sm text-gray-600 mt-2">
            Use the organization switcher in the header to get started
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Agent Sessions</h1>
        <p className="text-gray-600 mt-2">
          Monitor your AI agent sessions and performance
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900">
                {sessions.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Duration</p>
              <p className="text-2xl font-bold text-gray-900">-</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Cost</p>
              <p className="text-2xl font-bold text-gray-900">$0.00</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Sessions
          </h2>
        </div>
        <div className="overflow-x-auto">
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No sessions yet
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Start instrumenting your agents to see sessions here
              </p>
              <a
                href="https://github.com/justcopyai/bagula.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                View Documentation
              </a>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sessions.map((session) => (
                  <tr key={session.session_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {session.agent_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(session.start_time).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        {session.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${session.total_cost_usd?.toFixed(4) || '0.0000'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
