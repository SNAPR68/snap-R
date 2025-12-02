"use client";
export const dynamic = "force-dynamic";
import { useSession } from "@/app/providers/session-provider";
import { useState, useEffect } from "react";
import { User, Mail, CreditCard, Bell, Shield, Trash2, Check, ExternalLink, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const { user, supabase } = useSession();
  const [name, setName] = useState(user?.user_metadata?.name || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [notifications, setNotifications] = useState({ emailUpdates: true, marketingEmails: false, processingAlerts: true });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => { fetchProfile(); }, [user]);

  const fetchProfile = async () => {
    if (!user?.id) return;
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (data) setProfile(data);
  };

  const saveProfile = async () => {
    if (!user?.id) return;
    setLoading(true);
    setMessage("");
    const { error } = await supabase.from("profiles").update({ name, updated_at: new Date().toISOString() }).eq("id", user.id);
    if (error) { setMessage("Failed to update."); } else { setMessage("Saved!"); setTimeout(() => setMessage(""), 3000); }
    setLoading(false);
  };

  const handleDeleteAccount = async () => {
    alert("Please contact support@snap-r.com to delete your account.");
    setShowDeleteConfirm(false);
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "billing", label: "Billing", icon: CreditCard },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield }
  ];

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <div className="border-b border-white/10 bg-[#1A1A1A]">
        <div className="max-w-6xl mx-auto px-8 py-5">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-white/60 text-sm mt-1">Manage your account preferences</p>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-56 flex-shrink-0">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${activeTab === tab.id ? "bg-[#D4A017]/10 text-[#D4A017]" : "text-white/60 hover:bg-white/5"}`}>
                  <tab.icon className="w-5 h-5" />{tab.label}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex-1">
            {activeTab === "profile" && (
              <div className="bg-[#1A1A1A] rounded-2xl p-6 border border-white/10">
                <h2 className="text-lg font-semibold mb-6">Profile Information</h2>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center text-2xl font-bold text-black">{name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}</div>
                  <div><p className="font-medium">{name || "No name set"}</p><p className="text-white/60 text-sm">{user?.email}</p></div>
                </div>
                <div className="mb-4">
                  <label className="block mb-2 text-sm text-white/60">Email Address</label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl text-white/80"><Mail className="w-5 h-5 text-white/40" />{user?.email || "Loading..."}<span className="ml-auto text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">Verified</span></div>
                </div>
                <div className="mb-6">
                  <label className="block mb-2 text-sm text-white/60">Full Name</label>
                  <input type="text" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#D4A017]" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" />
                </div>
                <button className="w-full px-4 py-3 bg-gradient-to-r from-[#D4A017] to-[#B8860B] rounded-xl text-black font-semibold disabled:opacity-50 flex items-center justify-center gap-2" disabled={loading} onClick={saveProfile}>{loading ? "Saving..." : message ? <><Check className="w-5 h-5" /> Saved</> : "Save Changes"}</button>
              </div>
            )}
            {activeTab === "billing" && (
              <div className="bg-[#1A1A1A] rounded-2xl p-6 border border-white/10">
                <h2 className="text-lg font-semibold mb-6">Subscription and Billing</h2>
                <div className="bg-gradient-to-r from-[#D4A017]/10 to-transparent rounded-xl p-5 border border[#D4A017]/30 mb-6">
                  <div className="flex items-center justify-between">
                    <div><p className="text-[#D4A017] text-sm font-medium">CURRENT PLAN</p><p className="text-2xl font-bold mt-1">{profile?.plan || "Free Trial"}</p></div>
                    <Link href="/billing" className="px-4 py-2 bg-[#D4A017] text-black rounded-lg font-medium text-sm hover:opacity-90">Upgrade Plan</Link>
                  </div>
                </div>
                <div className="flex items-center justify-between py-4 border-b border-white/10"><div><p className="font-medium">Available Credits</p><p className="text-white/60 text-sm">Used for AI enhancements</p></div><div className="text-2xl font-bold text-[#D4A017]">{profile?.credits || 0}</div></div>
                <Link href="/billing" className="flex items-center justify-between py-4 text-white/60 hover:text-white"><span>View billing history</span><ExternalLink className="w-4 h-4" /></Link>
              </div>
            )}
            {activeTab === "notifications" && (
              <div className="bg-[#1A1A1A] rounded-2xl p-6 border border-white/10">
                <h2 className="text-lg font-semibold mb-6">Notification Preferences</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3"><div><p className="font-medium">Processing Alerts</p><p className="text-white/60 text-sm">Get notified when photos are done</p></div><button onClick={() => setNotifications({...notifications, processingAlerts: !notifications.processingAlerts})} className={`w-12 h-6 rounded-full transition-colors ${notifications.processingAlerts ? "bg-[#D4A017]" : "bg-white/20"}`}><div className={`w-5 h-5 rounded-full bg-white transition-transform ${notifications.processingAlerts ? "translate-x-6" : "translate-x-1"}`} /></button></div>
                  <div className="flex items-center justify-between py-3 border-t border-white/10"><div><p className="font-medium">Email Updates</p><p className="text-white/60 text-sm">Receive updates about your account</p></div><button onClick={() => setNotifications({...notifications, emailUpdates: !notifications.emailUpdates})} className={`w-12 h-6 rounded-full transition-colors ${notifications.emailUpdates ? "bg-[#D4A017]" : "bg-white/20"}`}><div className={`w-5 h-5 rounded-full bg-white transition-transform ${notifications.emailUpdates ? "translate-x-6" : "translate-x-1"}`} /></button></div>
                  <div className="flex items-center justify_between py-3 border-t border-white/10"><div><p className="font-medium">Marketing Emails</p><p className="text-white/60 text-sm">Receive tips and offers</p></div><button onClick={() => setNotifications({...notifications, marketingEmails: !notifications.marketingEmails})} className={`w-12 h-6 rounded-full transition-colors ${notifications.marketingEmails ? "bg-[#D4A017]" : "bg-white/20"}`}><div className={`w-5 h-5 rounded-full bg-white transition-transform ${notifications.marketingEmails ? "translate-x-6" : "translate-x-1"}`} /></button></div>
                </div>
              </div>
            )}
            {activeTab === "security" && (
              <div className="bg-[#1A1A1A] rounded-2xl p-6 border border-white/10">
                <h2 className="text-lg font-semibold mb-6">Security Settings</h2>
                <div className="flex items-center justify-between py-4 border-b border-white/10"><div><p className="font-medium">Password</p><p className="text-white/60 text-sm">Change your account password</p></div><button className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20">Change Password</button></div>
                <div className="flex items-center justify-between py-4 border-b border-white/10"><div><p className="font-medium">Two-Factor Authentication</p><p className="text-white/60 text-sm">Add an extra layer of security</p></div><span className="px-3 py-1 bg-white/10 rounded-full text-xs text-white/60">Coming Soon</span></div>
                <div className="pt-6"><h3 className="text-red-400 font-medium mb-2">Danger Zone</h3><p className="text-white/60 text-sm mb-4">Once you delete your account, there is no going back.</p>{!showDeleteConfirm ? (<button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-2 px-4 py-2 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/10"><Trash2 className="w-4 h-4" />Delete Account</button>) : (<div className="flex items-center gap-3"><button onClick={handleDeleteAccount} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Yes, Delete My Account</button><button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20">Cancel</button></div>)} </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
