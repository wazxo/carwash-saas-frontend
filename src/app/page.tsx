"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Droplets,
  Gauge,
  Users,
  CreditCard,
  Calendar,
  BarChart3,
  Shield,
  Clock,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Droplets className="w-7 h-7 text-primary" />
            <span className="font-bold text-xl tracking-tight">WashOS</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                Start Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        {/* Abstract background shapes */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              custom={0}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-8"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Now available for multi-location carwashes
            </motion.div>

            <motion.h1
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              custom={1}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6"
            >
              Run your carwash{" "}
              <span className="text-primary">like a tech company</span>
            </motion.h1>

            <motion.p
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              custom={2}
              className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              WashOS replaces spreadsheets, paper tickets, and guesswork with one
              clean dashboard. Manage locations, staff, customers, and payments in
              real time.
            </motion.p>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              custom={3}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
            >
              <Link href="/register">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto text-base px-8">
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8">
                  See Demo Dashboard
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              custom={4}
              className="flex items-center justify-center gap-6 text-sm text-muted-foreground"
            >
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-primary" /> No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-primary" /> 14-day free trial
              </span>
            </motion.div>
          </div>

          {/* Hero visual - abstract dashboard preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            className="mt-16 max-w-5xl mx-auto"
          >
            <div className="rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card/50">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <div className="flex-1 text-center text-xs text-muted-foreground font-mono">washos.app/dashboard</div>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Orders Today", value: "24", icon: Gauge, color: "text-primary" },
                  { label: "Revenue Today", value: "$1,240", icon: CreditCard, color: "text-emerald-400" },
                  { label: "Active Orders", value: "8", icon: Clock, color: "text-amber-400" },
                  { label: "Customers", value: "18", icon: Users, color: "text-sky-400" },
                ].map((stat, i) => (
                  <div key={i} className="rounded-lg border border-border bg-background p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground font-medium">{stat.label}</span>
                      <stat.icon className={`w-4 h-4 ${stat.color}`} />
                    </div>
                    <div className="text-2xl font-bold">{stat.value}</div>
                  </div>
                ))}
              </div>
              <div className="px-6 pb-6">
                <div className="rounded-lg border border-border bg-background p-4">
                  <div className="h-32 flex items-end gap-2">
                    {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 50, 95].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-primary/20 rounded-t-sm"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="border-y border-border bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <p className="text-center text-sm font-medium text-muted-foreground mb-8 uppercase tracking-wider">
            Trusted by independent carwashes and detailing shops
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-50">
            {["CleanWave", "AutoShine Pro", "Splash Brothers", "Detailing Kings", "WashHub"].map((name) => (
              <span key={name} className="text-lg font-semibold tracking-tight">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Running a carwash is hard enough
            </h2>
            <p className="text-lg text-muted-foreground">
              Your software shouldn&apos;t make it harder.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Lost tickets & messy handwriting",
                desc: "Paper orders get wet, lost, or misread. Customers wait while you search for their car.",
              },
              {
                title: "No clue what your team is doing",
                desc: "You don't know which washer is free, which order is stuck, or who's performing best.",
              },
              {
                title: "Cash register chaos at 5 PM",
                desc: "Split payments, tips, refunds, and partial payments turn into a nightmare without a system.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl border border-border bg-card p-6"
              >
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center mb-4">
                  <span className="text-destructive font-bold text-lg">{i + 1}</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-card/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Everything you need, nothing you don&apos;t
            </h2>
            <p className="text-lg text-muted-foreground">
              Built specifically for carwash owners who want clarity and control.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Gauge,
                title: "Live Work Queue",
                desc: "See every car in your wash pipeline. From queued to ready for pickup, in real time.",
              },
              {
                icon: Users,
                title: "Customer & Vehicle Profiles",
                desc: "Know your regulars. Store vehicles, service history, and preferences in one place.",
              },
              {
                icon: CreditCard,
                title: "Payments & Receipts",
                desc: "Cash, card, or transfer. Handle partial payments, tips, and auto-generate receipts.",
              },
              {
                icon: Calendar,
                title: "Appointments",
                desc: "Let customers book ceramic coating, detailing, or premium washes in advance.",
              },
              {
                icon: BarChart3,
                title: "Sales Dashboard",
                desc: "Daily revenue, popular services, and staff performance. No more guessing.",
              },
              {
                icon: Shield,
                title: "Role-Based Access",
                desc: "Owners see everything. Washers see only their orders. Cashiers can bill but not delete.",
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-xl border border-border bg-card p-6 hover:border-primary/30 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Up and running in 10 minutes
            </h2>
            <p className="text-lg text-muted-foreground">
              No installation, no training sessions, no IT department needed.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px bg-border" />
            {[
              {
                step: "01",
                title: "Create your account",
                desc: "Sign up as an owner. Your tenant, role, and first location are created automatically.",
              },
              {
                step: "02",
                title: "Add your team",
                desc: "Invite washers, cashiers, and managers by email. They join with one click.",
              },
              {
                step: "03",
                title: "Start washing",
                desc: "Create your first order, assign it to a washer, and watch the queue flow.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative text-center"
              >
                <div className="w-24 h-24 mx-auto rounded-full bg-card border border-border flex items-center justify-center mb-6 relative z-10">
                  <span className="text-3xl font-bold text-primary">{item.step}</span>
                </div>
                <h3 className="font-semibold text-xl mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed max-w-xs mx-auto">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-card/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Loved by carwash owners
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "We used to lose track of cars every Saturday. With WashOS, everyone knows exactly what to do next.",
                author: "Carlos Méndez",
                role: "Owner, CleanWave Carwash",
              },
              {
                quote: "The queue view on our wall-mounted tablet changed everything. Customers can see their car moving through the line.",
                author: "Ana Torres",
                role: "Manager, AutoShine Pro",
              },
              {
                quote: "I run three locations and I finally have visibility into all of them from my phone.",
                author: "Luis Rivera",
                role: "Owner, Splash Brothers",
              },
            ].map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl border border-border bg-card p-6"
              >
                <p className="text-foreground leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="font-semibold text-sm">{t.author}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-muted-foreground">
              One flat fee per location. No hidden charges, no transaction fees.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                name: "Starter",
                price: "$49",
                period: "/month",
                desc: "For single-location carwashes just getting organized.",
                features: ["1 Location", "Up to 5 staff", "Unlimited orders", "Basic dashboard", "Email support"],
                cta: "Start Free Trial",
                popular: false,
              },
              {
                name: "Pro",
                price: "$99",
                period: "/month",
                desc: "For growing operations with multiple bays and staff.",
                features: ["Up to 3 Locations", "Unlimited staff", "Advanced reporting", "Appointments", "Priority support", "Role-based access"],
                cta: "Start Free Trial",
                popular: true,
              },
              {
                name: "Enterprise",
                price: "Custom",
                period: "",
                desc: "For chains and franchises with custom needs.",
                features: ["Unlimited locations", "Custom integrations", "Dedicated account manager", "SLA", "Onboarding training"],
                cta: "Contact Sales",
                popular: false,
              },
            ].map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`rounded-xl border p-6 relative ${
                  plan.popular
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                <h3 className="font-semibold text-lg mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">{plan.desc}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={plan.name === "Enterprise" ? "mailto:sales@washos.app" : `/register?plan=${plan.name.toLowerCase()}`} className="block">
                  <Button
                    className={`w-full ${
                      plan.popular
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-card/20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Frequently asked questions
            </h2>
          </div>
          <div className="space-y-4">
            {[
              {
                q: "Do I need to install anything?",
                a: "No. WashOS runs in your browser. Your staff can use phones, tablets, or computers.",
              },
              {
                q: "Can I use it for a mobile detailing business?",
                a: "Absolutely. You can create locations for different service areas or simply run everything under one location.",
              },
              {
                q: "What happens after the 14-day trial?",
                a: "You choose a plan and confirm the subscription with PayPal. If you decide not to continue, your data is kept for 30 days in case you come back.",
              },
              {
                q: "Is my data safe?",
                a: "Yes. We use industry-standard encryption, role-based access control, and regular automated backups.",
              },
              {
                q: "Can I export my data?",
                a: "Yes. Owners can export customers, orders, and financial reports to CSV at any time.",
              },
            ].map((faq, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-6">
                <h3 className="font-semibold mb-2">{faq.q}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Stop managing your carwash with paper and memory.
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join hundreds of carwash owners who run cleaner, faster, and more profitable operations.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register?plan=starter">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto text-base px-8">
                  Start Your 14-Day Free Trial
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-primary" />
              <span className="font-bold">WashOS</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} WashOS. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
