export default function Features() {
  const features = [
    {
      tag: 'Cost Optimization',
      title: 'Identify and eliminate wasteful spending',
      description: 'Track every LLM call, spot redundant operations, and get actionable recommendations to reduce costs without sacrificing quality.',
      benefits: [
        'Real-time cost tracking per agent and skill',
        'Duplicate LLM call detection',
        'Token usage analytics by prompt',
        'Budget alerts and forecasting',
      ],
      illustration: (
        <div className="aspect-video bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl border border-green-200 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-4xl font-bold text-green-700 mb-2">-42%</div>
            <div className="text-sm text-green-600">Average cost reduction</div>
          </div>
        </div>
      ),
    },
    {
      tag: 'Performance Monitoring',
      title: 'Catch slowdowns before users notice',
      description: 'Monitor response times, identify bottlenecks, and optimize your agents for the best user experience.',
      benefits: [
        'End-to-end latency tracking per session',
        'Skill and tool execution profiling',
        'Prompt performance analysis',
        'Performance regression alerts',
      ],
      illustration: (
        <div className="aspect-video bg-gradient-to-br from-blue-50 to-primary-100 rounded-xl border border-blue-200 flex items-center justify-center p-8">
          <div className="flex items-end space-x-2 h-32">
            {[65, 45, 70, 80, 40, 55, 75].map((height, i) => (
              <div
                key={i}
                className="w-8 bg-primary-500 rounded-t"
                style={{ height: `${height}%` }}
              ></div>
            ))}
          </div>
        </div>
      ),
    },
    {
      tag: 'Quality Analysis',
      title: 'Ensure consistent, high-quality outputs',
      description: 'Automatically detect quality issues, track output consistency, and maintain high standards across all agent interactions.',
      benefits: [
        'Agent output quality scoring',
        'Prompt consistency monitoring',
        'Error pattern detection across skills',
        'A/B testing for prompt variations',
      ],
      illustration: (
        <div className="aspect-video bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl border border-purple-200 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-6xl font-bold text-purple-700 mb-2">98%</div>
            <div className="text-sm text-purple-600">Quality score</div>
          </div>
        </div>
      ),
    },
    {
      tag: 'Regression Detection',
      title: 'Know immediately when things break',
      description: 'Automated alerts when agent behavior changes unexpectedly, so you can fix issues before they impact users.',
      benefits: [
        'Agent behavioral baseline tracking',
        'Anomaly detection in tool usage',
        'Instant Slack/email alerts',
        'Root cause analysis with full traces',
      ],
      illustration: (
        <div className="aspect-video bg-gradient-to-br from-amber-50 to-orange-100 rounded-xl border border-amber-200 flex items-center justify-center p-8">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div className="text-sm text-neutral-600">Normal behavior</div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <div className="text-sm text-neutral-900 font-medium">Regression detected</div>
            </div>
          </div>
        </div>
      ),
    },
  ]

  return (
    <section id="features" className="bg-white py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <p className="text-sm font-semibold text-primary-600 tracking-wide uppercase mb-3">
            Complete Visibility
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4 tracking-tight">
            Everything you need to monitor AI agents
          </h2>
          <p className="text-lg text-neutral-600 max-w-3xl mx-auto leading-relaxed">
            From cost optimization to quality assurance, Bagula gives you the tools to run AI agents with confidence.
          </p>
        </div>

        <div className="space-y-32">
          {features.map((feature, index) => (
            <div
              key={index}
              className={'grid lg:grid-cols-2 gap-12 lg:gap-16 items-center'}
            >
              <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                <p className="text-sm font-semibold text-primary-600 tracking-wide uppercase mb-3">
                  {feature.tag}
                </p>
                <h3 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-4 tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-lg text-neutral-600 mb-8 leading-relaxed">
                  {feature.description}
                </p>
                <ul className="space-y-3">
                  {feature.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start">
                      <svg className="w-5 h-5 text-primary-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-neutral-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                {feature.illustration}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
