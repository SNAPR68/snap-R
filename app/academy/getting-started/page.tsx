
import { Rocket, ArrowLeft, Clock, CheckCircle } from 'lucide-react';

import Link from 'next/link';



export default function GettingStartedPage() {

  const articles = [

    {

      title: 'Creating Your First Listing',

      description: 'Learn how to create a listing and upload your property photos.',

      readTime: '3 min read',

      slug: 'first-listing',

    },

    {

      title: 'Understanding the Studio',

      description: 'Navigate the SnapR Studio interface like a pro.',

      readTime: '5 min read',

      slug: 'studio-guide',

    },

    {

      title: 'Your First Enhancement',

      description: 'Step-by-step guide to enhancing your first photo.',

      readTime: '4 min read',

      slug: 'first-enhancement',

    },

  ];



  return (

    <div className="min-h-screen bg-surface text-on-surface">

      {/* Header */}

      <div className="bg-gradient-to-b from-emerald-500/20 to-transparent py-12 px-6">

        <div className="max-w-4xl mx-auto">

          <Link href="/academy" className="inline-flex items-center gap-2 text-on-surface-muted hover:text-on-surface mb-6">

            <ArrowLeft className="w-4 h-4" /> Back to Academy

          </Link>

          <div className="flex items-center gap-4">

            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">

              <Rocket className="w-7 h-7 text-on-surface" />

            </div>

            <div>

              <h1 className="text-3xl font-bold">Getting Started with SnapR</h1>

              <p className="text-on-surface-muted">Everything to set you up for success</p>

            </div>

          </div>

        </div>

      </div>



      {/* Articles List */}

      <div className="max-w-4xl mx-auto px-6 py-12">

        <div className="space-y-4">

          {articles.map((article, index) => (

            <Link 

              key={index}

              href={`/academy/getting-started/${article.slug}`}

              className="block bg-surface-container-low rounded-xl p-6 border border-white/10 hover:border-emerald-500/50 transition-all group"

            >

              <div className="flex items-start justify-between gap-4">

                <div className="flex-1">

                  <h3 className="text-lg font-semibold mb-2 group-hover:text-emerald-400 transition-colors">{article.title}</h3>

                  <p className="text-on-surface-muted text-sm">{article.description}</p>

                </div>

                <div className="flex items-center gap-1 text-on-surface-muted text-sm whitespace-nowrap">

                  <Clock className="w-4 h-4" />

                  {article.readTime}

                </div>

              </div>

            </Link>

          ))}

        </div>



        {/* Quick Tips */}

        <div className="mt-12 bg-surface-container-low rounded-xl p-6 border border-white/10">

          <h2 className="text-xl font-bold mb-4">Quick Start Checklist</h2>

          <div className="space-y-3">

            {['Create your account', 'Upload your first photo', 'Try Sky Replacement', 'Share with a client'].map((tip, i) => (

              <div key={i} className="flex items-center gap-3 text-white/70">

                <CheckCircle className="w-5 h-5 text-emerald-500" />

                <span>{tip}</span>

              </div>

            ))}

          </div>

        </div>

      </div>

    </div>

  );

}

