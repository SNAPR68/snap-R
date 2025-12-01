'use client';

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      {/* Camera 1 - Left side */}
      <div
        className="absolute animate-float"
        style={{
          left: '12%',
          top: '25%',
          animationDuration: '6s',
        }}
      >
        <div className="relative opacity-40">
          <div className="w-16 h-11 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg border border-gray-600">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-[#D4A017] to-[#B8860B] p-1">
              <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white/20"></div>
              </div>
            </div>
            <div className="absolute -top-1 right-1 w-3 h-2 bg-gray-500 rounded-sm flash-pulse"></div>
            <div className="absolute -top-2 left-3 w-4 h-2 bg-gray-800 rounded-t-sm"></div>
          </div>
          <div className="absolute -top-1 right-0 w-16 h-16 flash-burst rounded-full"></div>
        </div>
      </div>

      {/* Camera 2 - Right side */}
      <div
        className="absolute animate-float"
        style={{
          right: '15%',
          top: '45%',
          animationDelay: '2.5s',
          animationDuration: '7s',
        }}
      >
        <div className="relative opacity-40">
          <div className="w-16 h-11 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg border border-gray-600">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-[#D4A017] to-[#B8860B] p-1">
              <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white/20"></div>
              </div>
            </div>
            <div className="absolute -top-1 right-1 w-3 h-2 bg-gray-500 rounded-sm flash-pulse-delayed"></div>
            <div className="absolute -top-2 left-3 w-4 h-2 bg-gray-800 rounded-t-sm"></div>
          </div>
          <div className="absolute -top-1 right-0 w-16 h-16 flash-burst-delayed rounded-full"></div>
        </div>
      </div>

      {/* Subtle gold sparkles */}
      {[...Array(10)].map((_, i) => (
        <div
          key={`sparkle-${i}`}
          className="absolute w-1 h-1 bg-[#D4A017] rounded-full animate-twinkle opacity-30"
          style={{
            left: `${10 + (i * 9)}%`,
            top: `${20 + (i * 7) % 60}%`,
            animationDelay: `${i * 0.5}s`,
            animationDuration: `${4 + (i % 3)}s`,
          }}
        />
      ))}

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(-1deg);
          }
          50% {
            transform: translateY(-15px) rotate(1deg);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        @keyframes twinkle {
          0%, 100% {
            opacity: 0;
            transform: scale(0.5);
          }
          50% {
            opacity: 0.3;
            transform: scale(1.2);
          }
        }
        .animate-twinkle {
          animation: twinkle 4s ease-in-out infinite;
        }
        @keyframes flashBurst {
          0%, 96%, 100% {
            opacity: 0;
            transform: scale(0);
          }
          97% {
            opacity: 0.4;
            background: radial-gradient(circle, rgba(212,160,23,0.6) 0%, rgba(212,160,23,0.2) 50%, transparent 70%);
            transform: scale(1);
          }
          99% {
            opacity: 0.1;
            transform: scale(0.8);
          }
        }
        .flash-burst {
          animation: flashBurst 5s ease-out infinite;
        }
        .flash-burst-delayed {
          animation: flashBurst 5s ease-out infinite;
          animation-delay: 2.5s;
        }
        @keyframes flashPulse {
          0%, 96%, 100% {
            background-color: #6b7280;
          }
          97% {
            background-color: #D4A017;
            box-shadow: 0 0 8px rgba(212,160,23,0.5);
          }
        }
        .flash-pulse {
          animation: flashPulse 5s ease-out infinite;
        }
        .flash-pulse-delayed {
          animation: flashPulse 5s ease-out infinite;
          animation-delay: 2.5s;
        }
      `}</style>
    </div>
  );
}
