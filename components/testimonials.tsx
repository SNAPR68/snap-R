'use client';

const TESTIMONIALS = [
  {
    name: 'Sarah Mitchell',
    role: 'Real Estate Photographer',
    company: 'Mitchell Photography',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    quote:
      'SnapR has completely transformed my workflow. What used to take me 2 hours in Photoshop now takes 30 seconds. My clients are amazed by the quality.',
    rating: 5,
  },
  {
    name: 'Michael Chen',
    role: 'Broker',
    company: 'Luxury Homes Realty',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    quote:
      'The virtual twilight feature alone has helped us sell 3 properties faster. Buyers love the dramatic photos. Worth every penny.',
    rating: 5,
  },
  {
    name: 'Emily Rodriguez',
    role: 'Property Manager',
    company: 'Urban Living Co.',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    quote:
      'We manage 200+ units and SnapR saves us thousands on photo editing every month. The AI staging is incredibly realistic.',
    rating: 5,
  },
  {
    name: 'David Thompson',
    role: 'Real Estate Agent',
    company: 'RE/MAX Elite',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    quote:
      "I was skeptical about AI editing, but SnapR proved me wrong. The sky replacement is seamless - you can't tell it's not the original.",
    rating: 5,
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
            Trusted by <span className="text-[#D4A017]">Photographers</span> Everywhere
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            Join thousands of real estate professionals who have transformed their workflow with SnapR
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {TESTIMONIALS.map((testimonial, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl p-6 border border-white/10 hover:border-[#D4A017]/30 transition-colors"
            >
              <div className="flex items-start gap-4 mb-4">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-[#D4A017]/30"
                />
                <div className="flex-1">
                  <h3 className="text-white font-semibold">{testimonial.name}</h3>
                  <p className="text-white/50 text-sm">{testimonial.role}</p>
                  <p className="text-[#D4A017] text-sm">{testimonial.company}</p>
                </div>
                <StarRating rating={testimonial.rating} />
              </div>
              <p className="text-white/70 italic">"{testimonial.quote}"</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-8 px-8 py-4 bg-white/5 rounded-2xl border border-white/10">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#D4A017]">10,000+</div>
              <div className="text-white/50 text-sm">Photos Enhanced</div>
            </div>
            <div className="w-px h-12 bg-white/10"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#D4A017]">500+</div>
              <div className="text-white/50 text-sm">Happy Clients</div>
            </div>
            <div className="w-px h-12 bg-white/10"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#D4A017]">4.9/5</div>
              <div className="text-white/50 text-sm">Average Rating</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
