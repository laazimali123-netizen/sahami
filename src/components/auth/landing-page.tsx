'use client';

import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { GraduationCap, Users, ClipboardCheck, BarChart3, Calendar, Megaphone, DollarSign, MessageSquare, PieChart, ArrowRight, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  { icon: Users, title: 'Student Management', desc: 'Track enrollment, profiles, and academic history for every student.' },
  { icon: Users, title: 'Teacher Management', desc: 'Manage staff assignments, schedules, and performance records.' },
  { icon: ClipboardCheck, title: 'Attendance Tracking', desc: 'Real-time attendance with automated reports and alerts.' },
  { icon: BarChart3, title: 'Gradebook', desc: 'Comprehensive grading system with customizable rubrics and analytics.' },
  { icon: Calendar, title: 'Schedule & Timetable', desc: 'Intelligent scheduling that avoids conflicts and optimizes resources.' },
  { icon: Megaphone, title: 'Announcements', desc: 'Keep everyone informed with targeted announcements and notifications.' },
];

const basicFeatures = [
  'Student & Teacher Management',
  'Attendance Tracking',
  'Gradebook & Reports',
  'Class Management',
  'Subject Management',
  'Timetable Scheduling',
  'Announcements',
  'Up to 100 Students',
  'Up to 20 Teachers',
];

const proFeatures = [
  ...basicFeatures.slice(0, 6),
  'Financial Management',
  'Fee Tracking & Payments',
  'Internal Messaging',
  'Advanced Analytics',
  'Priority Support',
  'Unlimited Students',
  'Unlimited Teachers',
];

export default function LandingPage() {
  const navigate = useStore((s) => s.navigate);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-400 opacity-95" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.1)_0%,_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(0,0,0,0.1)_0%,_transparent_50%)]" />
        <motion.nav
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 flex items-center justify-between px-6 py-4 md:px-12 lg:px-20"
        >
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
        </motion.nav>

        <div className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-32 md:pt-24 md:pb-40">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-white/15 text-white/90 text-sm font-medium backdrop-blur-sm">
              <GraduationCap className="h-4 w-4" />
              Trusted by 500+ schools worldwide
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
              The Smartest Way to<br />
              <span className="text-emerald-100">Manage Your School</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed">
              Streamline every aspect of school administration — from student enrollment to grade tracking, attendance, scheduling, and beyond.
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
          </motion.div>
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
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need to Run Your School</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">A comprehensive suite of tools designed to make school administration effortless.</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group p-6 rounded-2xl border bg-card hover:shadow-lg hover:border-emerald-200 transition-all duration-300"
            >
              <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition-colors">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-muted/50 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground text-lg">Start free, upgrade when you need more power.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Basic Plan */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="p-8 rounded-2xl border bg-card shadow-sm"
            >
              <h3 className="text-xl font-bold mb-1">BASIC</h3>
              <p className="text-muted-foreground text-sm mb-4">For small schools getting started</p>
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
              <Button className="w-full" variant="outline" onClick={() => navigate('register', { plan: 'BASIC' })}>
                Get Started Free
              </Button>
            </motion.div>

            {/* Pro Plan */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative p-8 rounded-2xl border-2 border-emerald-500 bg-card shadow-lg"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-emerald-500 text-white text-xs font-bold rounded-full">
                RECOMMENDED
              </div>
              <h3 className="text-xl font-bold mb-1">PRO</h3>
              <p className="text-muted-foreground text-sm mb-4">For growing schools that need more</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold">$29</span>
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
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto px-6 text-center"
        >
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
        </motion.div>
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
