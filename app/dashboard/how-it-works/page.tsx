
import { Upload, Wand2, Download, Share2, HelpCircle, ArrowLeft } from 'lucide-react';

import Link from 'next/link';



export default function HowItWorksPage() {

  const steps = [

    {

      icon: Upload,

      title: '1. Upload Your Photos',

      description: 'Upload property photos from your device. We support JPG, PNG, and most image formats.',

    },

    {

      icon: Wand2,

      title: '2. Choose Enhancement',

      description: 'Select from AI tools: Sky Replacement, Virtual Twilight, HDR, Declutter, Virtual Staging, and more.',

    },

    {

      icon: Download,

      title: '3. Preview & Download',

      description: 'Preview the enhanced image with before/after comparison. Accept to save or try another style.',

    },

    {

      icon: Share2,

      title: '4. Share Gallery',

      description: 'Share a gallery link with your client for approval before downloading final images.',

    },

  ];



  const creditInfo = [

    { tool: 'Sky Replacement', credits: 1 },

    { tool: 'HDR Enhancement', credits: 1 },

    { tool: 'Lawn Repair', credits: 1 },

    { tool: 'Auto Enhance', credits: 1 },

    { tool: 'Virtual Twilight', credits: 2 },

    { tool: 'Declutter', credits: 2 },

    { tool: 'Virtual Staging', credits: 3 },

  ];



  return (

    <div className="min-h-screen bg-[#0F0F0F] text-white p-6">

      <div className="max-w-4xl mx-auto">

        <Link href="/dashboard" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8">

          <ArrowLeft className="w-4 h-4" /> Back to Dashboard

        </Link>



        <div className="flex items-center gap-3 mb-8">

          <div className="p-3 bg-[#D4A017]/20 rounded-xl">

            <HelpCircle className="w-8 h-8 text-[#D4A017]" />

          </div>

          <div>

            <h1 className="text-3xl font-bold">How It Works</h1>

            <p className="text-white/50">Get started with SnapR in minutes</p>

          </div>

        </div>



        {/* Steps */}

        <div className="grid md:grid-cols-2 gap-6 mb-12">

          {steps.map((step, index) => (

            <div key={index} className="bg-[#1A1A1A] rounded-xl p-6 border border-white/10">

              <div className="flex items-start gap-4">

                <div className="p-3 bg-[#D4A017]/10 rounded-lg">

                  <step.icon className="w-6 h-6 text-[#D4A017]" />

                </div>

                <div>

                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>

                  <p className="text-white/60 text-sm">{step.description}</p>

                </div>

              </div>

            </div>

          ))}

        </div>



        {/* Credit Info */}

        <div className="bg-[#1A1A1A] rounded-xl p-6 border border-white/10 mb-8">

          <h2 className="text-xl font-bold mb-4">Credit Usage</h2>

          <p className="text-white/60 mb-4">Each enhancement uses credits from your plan:</p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">

            {creditInfo.map((item, index) => (

              <div key={index} className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3">

                <span className="text-white/80">{item.tool}</span>

                <span className="text-[#D4A017] font-semibold">{item.credits} cr</span>

              </div>

            ))}

          </div>

        </div>



        {/* Tips */}

        <div className="bg-gradient-to-r from-[#D4A017]/10 to-transparent rounded-xl p-6 border border-[#D4A017]/20">

          <h2 className="text-xl font-bold mb-4">Pro Tips</h2>

          <ul className="space-y-2 text-white/70">

            <li>• Use high-resolution photos for best results</li>

            <li>• Sky Replacement works best with visible sky in the image</li>

            <li>• Virtual Staging is ideal for empty rooms</li>

            <li>• Share Gallery with clients to get approval before downloading</li>

            <li>• Request Human Edit for complex changes our AI can&apos;t handle</li>

          </ul>

        </div>



        {/* CTA */}

        <div className="text-center mt-12">

          <Link href="/dashboard">

            <button className="px-8 py-3 bg-gradient-to-r from-[#D4A017] to-[#B8860B] rounded-xl text-black font-semibold hover:opacity-90">

              Start Enhancing Photos

            </button>

          </Link>

        </div>

      </div>

    </div>

  );

}

