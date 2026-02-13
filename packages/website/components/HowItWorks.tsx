export default function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Instrument your agents',
      description: 'Add our lightweight SDK to your agent code. Works with any framework.',
      code: `import { Bagula } from '@bagula/client'

const bagula = new Bagula({
  apiUrl: process.env.BAGULA_API_URL
})

// Start session tracking
const session = bagula.startSession({
  agentName: 'customer-support',
  userId: user.id
})

// Your agent logic with tool calls
await session.trackSkill('analyze_request', async () => {
  return await analyzeCustomerRequest(input)
})

session.end() // Auto-tracks cost, latency, tools used`,
    },
    {
      number: '02',
      title: 'Platform detects opportunities',
      description: 'Our AI analyzes your agent behavior in real-time and identifies issues.',
      features: [
        'Automatic cost anomaly detection',
        'Performance bottleneck identification',
        'Quality drift monitoring',
        'Smart alerting',
      ],
    },
    {
      number: '03',
      title: 'Act on insights',
      description: 'Get actionable recommendations and fix issues before they impact users.',
      features: [
        'Detailed trace visualization',
        'Root cause analysis',
        'Optimization suggestions',
        'Integration with your workflow',
      ],
    },
  ]

  return (
    <section className="bg-neutral-50 py-24 md:py-32 border-y border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <p className="text-sm font-semibold text-primary-600 tracking-wide uppercase mb-3">
            How It Works
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4 tracking-tight">
            Get started in minutes
          </h2>
          <p className="text-lg text-neutral-600 max-w-3xl mx-auto leading-relaxed">
            Three simple steps to complete visibility into your AI agents.
          </p>
        </div>

        <div className="space-y-24">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute left-16 top-32 w-0.5 h-24 bg-neutral-200"></div>
              )}

              <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                <div className="lg:col-span-2">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white border-2 border-neutral-200 text-2xl font-bold text-neutral-900">
                    {step.number}
                  </div>
                </div>

                <div className="lg:col-span-10">
                  <h3 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-4 tracking-tight">
                    {step.title}
                  </h3>
                  <p className="text-lg text-neutral-600 mb-6 leading-relaxed max-w-2xl">
                    {step.description}
                  </p>

                  {step.code ? (
                    <div className="bg-neutral-900 rounded-xl p-6 overflow-x-auto">
                      <pre className="text-sm text-neutral-100 font-mono">
                        <code>{step.code}</code>
                      </pre>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-4 max-w-3xl">
                      {step.features?.map((feature, i) => (
                        <div
                          key={i}
                          className="flex items-start bg-white rounded-lg p-4 border border-neutral-200"
                        >
                          <svg className="w-5 h-5 text-primary-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-neutral-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <a
            href="https://dashboard.bagula.ai"
            className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-lg text-white bg-neutral-900 hover:bg-neutral-800 transition-colors shadow-sm"
          >
            Start Monitoring Your Agents
          </a>
        </div>
      </div>
    </section>
  )
}
