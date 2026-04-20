'use client';

import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { GraduationCap, Users, ClipboardCheck, BarChart3, Calendar, Megaphone, Check, ArrowRight, BookOpen, School, DollarSign, MessageSquare, Lock } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const features = [
  { icon: Users, title: 'Student Management', desc: 'Track enrollment, profiles, and academic history for every student.' },
  { icon: Users, title: 'Teacher Management', desc: 'Manage staff assignments, schedules, and performance records.' },
  { icon: ClipboardCheck, title: 'Attendance Tracking', desc: 'Real-time attendance with automated reports and quick mark-all-present.' },
  { icon: BarChart3, title: 'Gradebook', desc: 'Comprehensive grading system with customizable rubrics and analytics.' },
  { icon: Calendar, title: 'Schedule & Timetable', desc: 'Intelligent scheduling that avoids conflicts and optimizes resources.' },
  { icon: Megaphone, title: 'Announcements', desc: 'Keep everyone informed with targeted announcements and notifications.' },
];

const basicFeatures = [
  'Student Management',
  'Teacher Management',
  'Dashboard & Overview',
  'Account Settings',
  'Password Management',
  'Up to 100 Students',
  'Up to 20 Teachers',
];

const proFeatures = [
  'Student & Teacher Management',
  'Class & Subject Management',
  'Attendance Tracking',
  'Gradebook & Reports',
  'Timetable Scheduling',
  'Events & Exams',
  'Homework & Behavior Tracking',
  'Announcements',
  'Internal Messaging',
  'Financial Management',
  'Fee Tracking & Payments',
  'Staff Management',
  'Advanced Analytics',
  'Up to 500 Students',
  'Up to 50 Teachers',
  'Priority Support',
];

/** Progressive enhancement: fade-in elements when they scroll into view */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 },
    );
    const items = el.querySelectorAll('.animate-on-scroll');
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);
  return ref;
}

export default function LandingPage() {
  const navigate = useStore((s) => s.navigate);
  const scrollRef = useScrollReveal();
  const [siteConfig, setSiteConfig] = useState<any>(null);

  useEffect(() => {
    fetch('/api/site-config')
      .then(r => r.json())
      .then(d => { if (d.config) setSiteConfig(d.config); })
      .catch(() => {});
  }, []);

  const proPrice = siteConfig?.proPrice || '1,500';

  return (
    <div className="min-h-screen bg-background" ref={scrollRef}>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-400 opacity-95" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.1)_0%,_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(0,0,0,0.1)_0%,_transparent_50%)]" />
        <nav className="relative z-10 flex items-center justify-between px-6 py-4 md:px-12 lg:px-20">
          <div className="flex items-center gap-3">
            <img src="/sahami-logo.png" alt="SAHAMI" className="h-10 w-10 rounded-lg" />
            <span className="text-2xl font-bold text-white tracking-tight">SAHAMI</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-white/90 hover:text-white hover:bg-white/10" onClick={() => navigate('login')}>
              Sign In
            </Button>
            <Button className="bg-white text-emerald-700 hover:bg-white/90 font-semibold shadow-lg" onClick={() => navigate('register')}>
              Get Started
            </Button>
          </div>
        </nav>

        <div className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-32 md:pt-24 md:pb-40">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-white/15 text-white/90 text-sm font-medium backdrop-blur-sm">
              <GraduationCap className="h-4 w-4" />
              {siteConfig?.heroBadge || 'Trusted by 500+ schools worldwide'}
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
              {siteConfig?.heroTitle ? (
                <span dangerouslySetInnerHTML={{ __html: siteConfig.heroTitle }} />
              ) : (
                <>The Smartest Way to<br /><span className="text-emerald-100">Manage Your School</span></>
              )}
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed">
              {siteConfig?.heroSubtitle || 'Streamline every aspect of school administration — from student enrollment to grade tracking, attendance, scheduling, and beyond.'}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-white text-emerald-700 hover:bg-white/90 font-semibold text-lg px-8 py-6 shadow-xl hover:shadow-2xl transition-all"
                onClick={() => navigate('register')}
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-emerald-700/40 border-2 border-white/60 text-white font-semibold text-lg px-8 py-6 backdrop-blur-sm transition-all duration-300 hover:bg-white hover:border-emerald-600 hover:text-emerald-700"
                onClick={() => navigate('login')}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>

        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,64C960,75,1056,85,1152,80C1248,75,1344,53,1392,42.7L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z" fill="var(--background)" />
          </svg>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14 animate-on-scroll">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need to Run Your School</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">A comprehensive suite of tools designed to make school administration effortless.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="group p-6 rounded-2xl border bg-card hover:shadow-lg hover:border-emerald-200 transition-all duration-300 animate-on-scroll"
            >
              <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition-colors">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-muted/50 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14 animate-on-scroll">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground text-lg">Start free with a 30-day PRO trial. Upgrade when you need more power.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Basic Plan */}
            <div className="p-8 rounded-2xl border bg-card shadow-sm animate-on-scroll">
              <h3 className="text-xl font-bold mb-1">BASIC — Free</h3>
              <p className="text-muted-foreground text-sm mb-4">For small schools getting started. Includes a 30-day PRO trial.</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold">Free</span>
              </div>
              <ul className="space-y-3 mb-8">
                {basicFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 mb-4">
                <p className="text-xs text-emerald-700 text-center font-medium">
                  30-day PRO trial included — try all features free!
                </p>
              </div>
              <Button className="w-full" variant="outline" onClick={() => navigate('register', { plan: 'BASIC' })}>
                Get Started Free
              </Button>
            </div>

            {/* Pro Plan */}
            <div className="relative p-8 rounded-2xl border-2 border-emerald-500 bg-card shadow-lg animate-on-scroll">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-emerald-500 text-white text-xs font-bold rounded-full">
                RECOMMENDED
              </div>
              <h3 className="text-xl font-bold mb-1">PRO</h3>
              <p className="text-muted-foreground text-sm mb-4">For growing schools that need the full experience</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold">{proPrice} ETB</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {proFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => navigate('register', { plan: 'PRO' })}>
                Start PRO Trial
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* What happens after trial */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14 animate-on-scroll">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Sign Up Free', desc: 'Create your school account and get instant access to all PRO features for 30 days.' },
              { step: '2', title: 'Choose Your Plan', desc: 'After the trial, upgrade to PRO for 1,500 ETB/month or continue with free BASIC (Students, Teachers, Settings only).' },
              { step: '3', title: 'Pay & Grow', desc: 'Pay via Telebirr, Kaafi, or CBE. Send proof, get approved, and unlock everything.' },
            ].map((item) => (
              <div key={item.step} className="text-center p-6 animate-on-scroll">
                <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 text-center animate-on-scroll">
          <div className="p-12 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your School?</h2>
            <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
              Join hundreds of schools already using SAHAMI to save time and improve outcomes.
            </p>
            <Button size="lg" className="bg-white text-emerald-700 hover:bg-white/90 font-semibold text-lg px-8" onClick={() => navigate('register')}>
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/sahami-logo.png" alt="SAHAMI" className="h-6 w-6 rounded" />
            <span className="font-semibold text-sm">SAHAMI</span>
          </div>
          <p className="text-muted-foreground text-sm">&copy; {new Date().getFullYear()} SAHAMI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
