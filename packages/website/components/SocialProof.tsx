export default function SocialProof() {
  return (
    <section className="bg-white py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-4 tracking-tight">
            Trusted by leading AI teams
          </h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto leading-relaxed">
            Join forward-thinking companies building production AI agents with confidence.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center mb-20">
          {[
            { name: 'TechVentures', color: 'from-blue-600 to-blue-500' },
            { name: 'AI Labs', color: 'from-purple-600 to-purple-500' },
            { name: 'DataFlow', color: 'from-green-600 to-green-500' },
            { name: 'CloudAI', color: 'from-orange-600 to-orange-500' },
          ].map((company, i) => (
            <div
              key={i}
              className="w-full h-20 bg-white rounded-lg border border-neutral-200 flex items-center justify-center hover:border-neutral-300 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded bg-gradient-to-br ${company.color} flex items-center justify-center`}>
                  <span className="text-white font-bold text-sm">{company.name.charAt(0)}</span>
                </div>
                <span className="text-base font-semibold text-neutral-700">{company.name}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-neutral-50 rounded-2xl p-8 md:p-12 border border-neutral-200">
            <div className="flex items-start mb-6">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
              ))}
            </div>
            <blockquote className="text-xl md:text-2xl text-neutral-900 mb-8 leading-relaxed font-medium">
              "Bagula helped us reduce our LLM costs by 40% while improving response times.
              We now have complete visibility into our agent behavior and can catch issues before they affect users."
            </blockquote>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mr-4 flex items-center justify-center">
                <span className="text-white font-semibold text-lg">AC</span>
              </div>
              <div>
                <div className="font-semibold text-neutral-900">Alex Chen</div>
                <div className="text-neutral-600">Head of Engineering, TechVentures</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-20 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-neutral-900 mb-2">10M+</div>
            <div className="text-neutral-600">Agent calls monitored</div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-neutral-900 mb-2">42%</div>
            <div className="text-neutral-600">Average cost reduction</div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-neutral-900 mb-2">99.9%</div>
            <div className="text-neutral-600">Platform uptime</div>
          </div>
        </div>
      </div>
    </section>
  )
}
