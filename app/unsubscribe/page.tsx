import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Unsubscribe – SnapR',
  description: 'Manage your email notification preferences.',
  robots: { index: false, follow: false },
}

export default function UnsubscribePage() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Logo */}
        <Link href="/" className="inline-block">
          <h1 className="text-2xl font-bold text-white">
            Snap<span className="text-primary">R</span>
          </h1>
        </Link>

        {/* Card */}
        <div className="bg-surface-container-high border border-white/10 rounded-2xl p-8 space-y-5">
          <div className="w-14 h-14 mx-auto rounded-full bg-accent-gold/10 flex items-center justify-center">
            <svg
              className="w-7 h-7 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 9v.906a2.25 2.25 0 0 1-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 0 0 1.183 1.981l6.478 3.488m8.839 2.51-4.66-2.51m0 0-1.023-.55a2.25 2.25 0 0 0-2.134 0l-1.022.55m0 0-4.661 2.51m16.5 1.615a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V8.844a2.25 2.25 0 0 1 1.183-1.981l7.5-4.039a2.25 2.25 0 0 1 2.134 0l7.5 4.039a2.25 2.25 0 0 1 1.183 1.98V19.5Z"
              />
            </svg>
          </div>

          <h2 className="text-xl font-semibold text-white">
            Manage Email Preferences
          </h2>

          <p className="text-sm text-gray-400 leading-relaxed">
            To update your notification preferences, sign in to your dashboard
            and visit <strong className="text-gray-300">Settings → Notifications</strong>.
          </p>

          <p className="text-sm text-gray-500 leading-relaxed">
            You can control which emails you receive, including marketing
            updates, usage alerts, and listing notifications.
          </p>

          <div className="pt-2 space-y-3">
            <Link
              href="/dashboard/settings"
              className="block w-full py-3 px-4 bg-accent-gold text-black font-semibold rounded-xl text-sm hover:bg-accent-gold transition-colors"
            >
              Go to Notification Settings
            </Link>

            <Link
              href="/"
              className="block w-full py-3 px-4 border border-white/10 text-gray-400 rounded-xl text-sm hover:text-white hover:border-white/20 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>

        <p className="text-xs text-gray-600">
          If you&apos;re having trouble, email{' '}
          <a href="mailto:support@snap-r.com" className="text-primary hover:underline">
            support@snap-r.com
          </a>{' '}
          and we&apos;ll help.
        </p>
      </div>
    </div>
  )
}
