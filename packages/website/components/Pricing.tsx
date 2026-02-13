export default function Pricing() {
  const plans = [
    {
      name: 'Self-Hosted',
      price: 'Free',
      description: 'Deploy Bagula in your own infrastructure. Full control, no usage limits.',
      features: [
        'Unlimited agents and traces',
        'Complete data ownership',
        'All monitoring features',
        'Community support',
        'Open source',
      ],
      cta: 'View on GitHub',
      ctaLink: 'https://github.com/justcopyai/bagula.ai',
      ctaStyle: 'secondary',
      badge: null,
    },
    {
      name: 'Cloud',
      price: 'Usage-based',
      description: 'Fully managed monitoring. Pay only for what you use, starting at $0.',
      features: [
        'Everything in Self-Hosted',
        'Managed infrastructure',
        'Automatic scaling',
        'Priority support',
        'Advanced analytics',
        'Team collaboration',
        'SSO & RBAC',
      ],
      cta: 'Start Free Trial',
      ctaLink: 'https://dashboard.bagula.ai',
      ctaStyle: 'primary',
      badge: 'Most Popular',
      pricing: '$0.01 per 1,000 traces',
    },
  ]

  return (
    <section id="pricing" className="bg-neutral-50 py-24 md:py-32 border-y border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-primary-600 tracking-wide uppercase mb-3">
            Pricing
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4 tracking-tight">
            Start free, scale as you grow
          </h2>
          <p className="text-lg text-neutral-600 max-w-3xl mx-auto leading-relaxed">
            Choose between self-hosted for complete control or cloud for managed convenience.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={'bg-white rounded-2xl p-8 border-2 relative ' + (plan.badge ? 'border-neutral-900 shadow-xl' : 'border-neutral-200')}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center px-4 py-1 rounded-full text-xs font-semibold bg-neutral-900 text-white">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-2xl font-bold text-neutral-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline mb-4">
                  <span className="text-4xl font-bold text-neutral-900">{plan.price}</span>
                </div>
                {plan.pricing && (
                  <p className="text-sm text-neutral-600 mb-2">{plan.pricing}</p>
                )}
                <p className="text-neutral-600 leading-relaxed">{plan.description}</p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <svg className="w-5 h-5 text-primary-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-neutral-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <a
                href={plan.ctaLink}
                className={'block w-full text-center px-6 py-3 rounded-lg font-medium transition-colors ' + (plan.ctaStyle === 'primary' ? 'bg-neutral-900 text-white hover:bg-neutral-800' : 'bg-white text-neutral-900 border-2 border-neutral-300 hover:border-neutral-400')}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="max-w-3xl mx-auto bg-white rounded-2xl p-8 border border-neutral-200">
            <h3 className="text-xl font-bold text-neutral-900 mb-2">
              Enterprise
            </h3>
            <p className="text-neutral-600 mb-6">
              Need custom deployment, dedicated support, or volume pricing? We've got you covered.
            </p>
            <a
              href="https://calendly.com/anup-bagula/30min"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 border border-neutral-300 text-base font-medium rounded-lg text-neutral-900 bg-white hover:bg-neutral-50 transition-colors"
            >
              Contact Sales
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
