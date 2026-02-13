'use client'

import { useEffect, useState } from 'react'

interface SkillCall {
  id: string
  name: string
  status: 'running' | 'success' | 'warning'
  latency: number
  tokens?: number
  prompt?: string
}

interface AgentSession {
  id: string
  agent: string
  status: 'running' | 'success' | 'warning'
  cost: number
  skills: number
  timestamp: number
}

export default function LiveDashboard() {
  const [cost, setCost] = useState(234.50)
  const [avgLatency, setAvgLatency] = useState(1.2)
  const [currentSession, setCurrentSession] = useState<SkillCall[]>([])
  const [recentSessions, setRecentSessions] = useState<AgentSession[]>([
    { id: '1', agent: 'customer-support', status: 'success', cost: 0.04, skills: 3, timestamp: Date.now() - 5000 },
    { id: '2', agent: 'code-reviewer', status: 'success', cost: 0.08, skills: 6, timestamp: Date.now() - 10000 },
  ])
  const [issue, setIssue] = useState<string | null>(null)
  const [sessionTokens, setSessionTokens] = useState(4231)

  const skillTemplates = [
    { name: 'ReadFile', latency: [200, 400], tokens: [100, 300], good: true, prompts: ['Read config', 'Load user data'] },
    { name: 'AnalyzeCode', latency: [1500, 2200], tokens: [800, 1500], good: true, prompts: ['Review code quality', 'Check for bugs'] },
    { name: 'WebSearch', latency: [2800, 4500], tokens: [1200, 2500], good: false, prompts: ['Please search the entire internet for all comprehensive documentation about React hooks including all edge cases and best practices with detailed examples', 'Find API docs'] },
    { name: 'GenerateCode', latency: [700, 1200], tokens: [400, 900], good: true, prompts: ['Create tests', 'Generate helper'] },
    { name: 'DatabaseQuery', latency: [150, 350], tokens: [50, 150], good: true, prompts: ['Get user', 'Query orders'] },
    { name: 'SendEmail', latency: [3200, 5800], tokens: [2000, 4000], good: false, prompts: ['Draft extremely detailed comprehensive email to customer explaining the entire system architecture, all components, all integrations, complete troubleshooting guide, and every possible solution', 'Send alert'] },
    { name: 'ParseJSON', latency: [100, 250], tokens: [80, 200], good: true, prompts: ['Parse response', 'Extract fields'] },
    { name: 'FormatData', latency: [90, 180], tokens: [60, 120], good: true, prompts: ['Format output', 'Clean data'] },
  ]

  const agentNames = ['customer-support', 'code-reviewer', 'data-analyst', 'content-writer', 'bug-fixer']

  useEffect(() => {
    const interval = setInterval(() => {
      const randomTemplate = skillTemplates[Math.floor(Math.random() * skillTemplates.length)]
      const latency = Math.floor(Math.random() * (randomTemplate.latency[1] - randomTemplate.latency[0]) + randomTemplate.latency[0])
      const tokens = Math.floor(Math.random() * (randomTemplate.tokens[1] - randomTemplate.tokens[0]) + randomTemplate.tokens[0])
      const prompt = randomTemplate.prompts[Math.floor(Math.random() * randomTemplate.prompts.length)]

      const newSkill: SkillCall = {
        id: Math.random().toString(36).substr(2, 9),
        name: randomTemplate.name,
        status: 'running',
        latency,
        tokens,
        prompt
      }

      setCurrentSession(prev => [...prev, newSkill])

      setTimeout(() => {
        setCurrentSession(prev =>
          prev.map(skill =>
            skill.id === newSkill.id
              ? { ...skill, status: !randomTemplate.good && latency > 3000 ? 'warning' : 'success' }
              : skill
          )
        )

        setCost(prev => parseFloat((prev + (tokens * 0.00002)).toFixed(2)))
        setSessionTokens(prev => prev + tokens)
        setAvgLatency(prev => parseFloat(((prev + latency / 1000) / 2).toFixed(1)))

        if (!randomTemplate.good && latency > 3000) {
          setIssue(`${randomTemplate.name} taking ${(latency / 1000).toFixed(1)}s (${Math.floor(latency / 800)}x baseline). ${tokens > 2000 ? 'Bloated prompt detected.' : 'Cost spike detected.'}`)
          setTimeout(() => setIssue(null), 10000)
        }

        setTimeout(() => {
          setCurrentSession(prev => prev.filter(s => s.id !== newSkill.id))
        }, 8000)
      }, latency)

      if (Math.random() > 0.6) {
        const agentName = agentNames[Math.floor(Math.random() * agentNames.length)]
        const skillCount = Math.floor(Math.random() * 6) + 2
        const sessionCost = parseFloat((skillCount * 0.02 * Math.random()).toFixed(2))
        const hasIssue = Math.random() > 0.7

        setRecentSessions(prev => [
          {
            id: Math.random().toString(36).substr(2, 9),
            agent: agentName,
            status: hasIssue ? 'warning' : 'success',
            cost: sessionCost,
            skills: skillCount,
            timestamp: Date.now()
          },
          ...prev.slice(0, 2)
        ])
      }
    }, 3500)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative aspect-square rounded-3xl overflow-hidden bg-black/5 backdrop-blur-sm">
      {/* Glassmorphic container */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}></div>

        <div className="relative h-full p-5 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80"></div>
              </div>
              <div className="text-[11px] text-slate-500 font-medium ml-2">bagula.ai</div>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
              <div className="text-[10px] text-emerald-400 font-medium tracking-wide">LIVE</div>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="group relative overflow-hidden rounded-xl bg-slate-800/50 backdrop-blur border border-slate-700/50 p-3 hover:border-slate-600/50 transition-all">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="text-[10px] text-slate-400 font-medium tracking-wider mb-1.5">COST</div>
                <div className="text-2xl font-bold text-white mb-1 tabular-nums tracking-tight">${cost.toFixed(2)}</div>
                <div className="text-[11px] text-emerald-400 font-medium">↓ 18%</div>
              </div>
            </div>
            <div className="group relative overflow-hidden rounded-xl bg-slate-800/50 backdrop-blur border border-slate-700/50 p-3 hover:border-slate-600/50 transition-all">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="text-[10px] text-slate-400 font-medium tracking-wider mb-1.5">LATENCY</div>
                <div className="text-2xl font-bold text-white mb-1 tabular-nums tracking-tight">{avgLatency}s</div>
                <div className="text-[11px] text-amber-400 font-medium">2 slow</div>
              </div>
            </div>
          </div>

          {/* Active session */}
          {currentSession.length > 0 && (
            <div className="mb-3 rounded-xl bg-slate-800/40 backdrop-blur border border-slate-700/50 p-3 overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs text-slate-300 font-semibold tracking-wide">Session #a7f3</div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-slate-400 tabular-nums">{sessionTokens.toLocaleString()}</span>
                  <span className="text-emerald-400 font-medium tabular-nums">${(sessionTokens * 0.00002).toFixed(3)}</span>
                </div>
              </div>

              <div className="space-y-2 max-h-32 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {currentSession.map((skill) => (
                  <div
                    key={skill.id}
                    className={`flex items-center gap-2.5 text-xs transition-all duration-300 ${
                      skill.status === 'running' ? 'opacity-50' : 'opacity-100'
                    }`}
                  >
                    <div className={`flex-shrink-0 w-1 h-1 rounded-full ${
                      skill.status === 'running' ? 'bg-blue-400 animate-pulse' :
                      skill.status === 'warning' ? 'bg-amber-400' :
                      'bg-emerald-400'
                    }`}></div>
                    <span className={`font-mono text-xs ${
                      skill.status === 'warning' ? 'text-amber-400' : 'text-slate-300'
                    }`}>{skill.name}</span>
                    {skill.prompt && skill.prompt.length > 60 && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                        BLOATED
                      </span>
                    )}
                    <span className={`ml-auto text-[11px] tabular-nums font-medium ${
                      skill.status === 'warning' ? 'text-amber-400' : 'text-slate-400'
                    }`}>
                      {skill.status === 'running' ? '...' : `${skill.latency}ms`}
                    </span>
                  </div>
                ))}
              </div>

              {currentSession.length > 0 && currentSession[currentSession.length - 1].prompt && (
                <div className="mt-3 pt-3 border-t border-slate-700/50">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="text-[9px] text-slate-500 font-medium tracking-wider">PROMPT</div>
                    {currentSession[currentSession.length - 1].prompt!.length > 60 ? (
                      <div className="flex items-center gap-1">
                        <div className="w-1 h-1 rounded-full bg-red-400"></div>
                        <span className="text-[9px] text-red-400 font-medium tracking-wide">BLOATED</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <div className="w-1 h-1 rounded-full bg-emerald-400"></div>
                        <span className="text-[9px] text-emerald-400 font-medium tracking-wide">OPTIMIZED</span>
                      </div>
                    )}
                  </div>
                  <div className={`text-[10px] font-mono leading-relaxed ${
                    currentSession[currentSession.length - 1].prompt!.length > 60
                      ? 'text-red-400/90'
                      : 'text-emerald-400/90'
                  }`}>
                    "{currentSession[currentSession.length - 1].prompt!.slice(0, 75)}{currentSession[currentSession.length - 1].prompt!.length > 75 ? '...' : ''}"
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Issue alert */}
          {issue && (
            <div className="mb-3 rounded-xl bg-gradient-to-br from-red-900/20 to-red-950/20 backdrop-blur border border-red-500/30 p-3">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 w-4 h-4 rounded bg-red-500/20 flex items-center justify-center mt-0.5">
                  <svg className="w-2.5 h-2.5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-red-300 font-semibold tracking-wide mb-1">ISSUE DETECTED</div>
                  <div className="text-[11px] text-red-400/90 leading-relaxed">{issue}</div>
                </div>
              </div>
            </div>
          )}

          {/* Recent sessions */}
          <div className="flex-1 space-y-1.5 overflow-y-auto">
            {recentSessions.map((session, i) => (
              <div
                key={session.id}
                className="group flex items-center justify-between rounded-lg bg-slate-800/30 backdrop-blur border border-slate-700/30 px-3 py-2 hover:bg-slate-800/50 hover:border-slate-600/50 transition-all"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    session.status === 'success' ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}></div>
                  <div className="text-xs text-slate-300 font-mono">{session.agent}</div>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="text-slate-500 tabular-nums">{session.skills}</span>
                  <span className="text-slate-300 font-medium tabular-nums">${session.cost.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Glow effects */}
      <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-blue-500/5 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-emerald-500/5 rounded-full blur-3xl"></div>
    </div>
  )
}
