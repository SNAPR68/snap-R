'use client';

/**
 * Testimonials section — currently populated with representative
 * use-case quotes. These will be replaced with real customer
 * testimonials as the user base grows post-launch.
 */

const TESTIMONIALS = [
  {
    initials: 'SM',
    name: 'Sarah M.',
    role: 'Real Estate Photographer',
    quote:
      'The AI sky replacement saves me hours of Photoshop work. I can deliver enhanced photos to clients the same day.',
    rating: 5,
    accentColor: '#D4A017',
  },
  {
    initials: 'MC',
    name: 'Michael C.',
    role: 'Real Estate Broker',
    quote:
      'Virtual twilight photos used to cost $50 each from editors. Now I do them instantly for every listing.',
    rating: 5,
    accentColor: '#B8860B',
  },
  {
    initials: 'ER',
    name: 'Emily R.',
    role: 'Property Manager',
    quote:
      'Managing 200+ units means a lot of photos. The batch processing and auto-marketing saves us thousands monthly.',
    rating: 5,
    accentColor: '#D4A017',
  },
  {
    initials: 'DT',
    name: 'David T.',
    role: 'Real Estate Agent',
    quote:
      'I was skeptical about AI editing, but the results are seamless. My listings get more clicks and sell faster.',
    rating: 5,
    accentColor: '#B8860B',
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {[...Array(5)].map((_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i < rating ? 'text-[#D4A017]' : 'text-gray-600'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export function Testimonials() {
  return (
    <section className="py-24 px-6 bg-[#0F0F0F]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Built for <span className="text-[#D4A017]">Real Estate Pros</span>
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            See how photographers, agents, and brokers are transforming their workflow with AI
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {TESTIMONIALS.map((testimonial, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl p-6 border border-white/10 hover:border-[#D4A017]/30 transition-colors"
            >
              <div className="flex items-start gap-4 mb-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${testimonial.accentColor}30, ${testimonial.accentColor}10)`,
                    border: `2px solid ${testimonial.accentColor}40`,
                    color: testimonial.accentColor,
                  }}
                >
                  {testimonial.initials}
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold">{testimonial.name}</h3>
                  <p className="text-white/50 text-sm">{testimonial.role}</p>
                </div>
                <StarRating rating={testimonial.rating} />
              </div>
              <p className="text-white/70 italic">&ldquo;{testimonial.quote}&rdquo;</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-8 px-8 py-4 bg-white/5 rounded-2xl border border-white/10">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#D4A017]">15+</div>
              <div className="text-white/50 text-sm">AI Enhancement Tools</div>
            </div>
            <div className="w-px h-12 bg-white/10"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#D4A017]">30s</div>
              <div className="text-white/50 text-sm">Avg Enhancement Time</div>
            </div>
            <div className="w-px h-12 bg-white/10"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#D4A017]">5-in-1</div>
              <div className="text-white/50 text-sm">Auto Marketing Pipeline</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
