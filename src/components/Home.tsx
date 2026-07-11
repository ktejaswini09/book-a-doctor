import React from "react";
import { motion } from "motion/react";
import { Stethoscope, Calendar, FileText, ShieldAlert, ArrowRight, Activity, Users, Star } from "lucide-react";

interface HomeProps {
  onNav: (view: "home" | "login" | "register" | "dashboard") => void;
}

export default function Home({ onNav }: HomeProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
  };

  return (
    <div id="landing-container" className="min-h-screen bg-slate-50 text-slate-800">
      {/* Header/Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-xl text-emerald-600 cursor-pointer" onClick={() => onNav("home")}>
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Stethoscope className="w-6 h-6 text-emerald-600" />
            </div>
            <span>Medicare<span className="text-slate-900 font-bold">Book</span></span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-emerald-600 transition-colors">Features</a>
            <a href="#about" className="hover:text-emerald-600 transition-colors">About</a>
            <a href="#statistics" className="hover:text-emerald-600 transition-colors">Insights</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNav("login")}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => onNav("register")}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-lg shadow-emerald-600/10 transition-all duration-200"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 pt-16 pb-24 md:pt-24 md:pb-32">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <motion.div 
            className="lg:col-span-7 flex flex-col items-start text-left"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold tracking-wide rounded-full mb-6">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span>Smart Appointment Scheduling</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 leading-[1.15] mb-6">
              Effortlessly schedule your doctor <span className="text-emerald-600 relative">appointments</span> with just a few clicks.
            </h1>
            
            <p className="text-lg text-slate-600 mb-8 max-w-xl leading-relaxed">
              Skip long wait times and phone queues. Find verified, credential-vetted specialists in your local area, upload medical details securely, and manage care pipelines seamlessly.
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => onNav("register")}
                className="group inline-flex items-center gap-2 px-6 py-3.5 bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 font-semibold rounded-xl shadow-xl transition-all duration-200"
              >
                <span>Book your Doctor Now</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button
                onClick={() => onNav("login")}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold rounded-xl shadow-sm transition-all"
              >
                Explore Specialists
              </button>
            </div>
          </motion.div>

          {/* Right Hero Card Visualizer */}
          <motion.div 
            className="lg:col-span-5 flex justify-center relative"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="relative w-full max-w-md bg-white border border-slate-100 rounded-3xl shadow-2xl p-6 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -z-10" />
              
              <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-4">
                <span className="font-bold text-slate-900">Featured Specialists</span>
                <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full">4.9 Average Rating</span>
              </div>

              {/* Demo Specialist Card */}
              <div className="space-y-4">
                {[
                  { name: "Dr. Sarah Jenkins", specialty: "Cardiologist", experience: "12 yrs", rating: "4.9", color: "bg-emerald-500" },
                  { name: "Dr. Marcus Vance", specialty: "Pediatrician", experience: "8 yrs", rating: "4.8", color: "bg-blue-500" },
                  { name: "Dr. Elena Rostova", specialty: "Dermatologist", experience: "15 yrs", rating: "5.0", color: "bg-purple-500" }
                ].map((spec, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-100 rounded-2xl hover:border-emerald-200 transition-colors">
                    <div className={`w-10 h-10 rounded-full ${spec.color} text-white flex items-center justify-center font-bold text-sm`}>
                      {spec.name.split(" ")[1][0]}
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="font-semibold text-sm text-slate-950">{spec.name}</h4>
                      <p className="text-xs text-slate-500">{spec.specialty} • {spec.experience} Exp</p>
                    </div>
                    <div className="flex items-center gap-1 text-amber-500 text-xs font-semibold">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{spec.rating}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Booking preview sticker */}
              <div className="mt-5 p-4 bg-emerald-600 rounded-2xl text-white text-left flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm">Instant Scheduling Live</h4>
                  <p className="text-[11px] text-emerald-100">Upload health files securely on booking</p>
                </div>
                <div className="p-2.5 bg-white/10 rounded-xl">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Bento Grid */}
      <section id="features" className="px-6 py-20 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-slate-950 mb-4 tracking-tight">
              Designed for patients, doctors, and admin alike
            </h2>
            <p className="text-slate-600">
              A comprehensive system digitizing healthcare workflows, ensuring speed, security, and verification at every touchpoint.
            </p>
          </div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {/* Feature 1 */}
            <motion.div variants={itemVariants} className="flex flex-col text-left p-6 bg-slate-50 border border-slate-100 rounded-2xl">
              <div className="p-3 bg-emerald-100 text-emerald-800 w-fit rounded-xl mb-5">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-950 mb-2">Doctor Browsing</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Filter and browse registered specialist doctors by specialization, consulting fees, experience, and real-time appointment calendars.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div variants={itemVariants} className="flex flex-col text-left p-6 bg-slate-50 border border-slate-100 rounded-2xl">
              <div className="p-3 bg-blue-100 text-blue-800 w-fit rounded-xl mb-5">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-950 mb-2">Interactive Booking</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Choose a suitable date/time and fill a dynamic medical form in seconds. No double-bookings, fully synchronized schedules.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div variants={itemVariants} className="flex flex-col text-left p-6 bg-slate-50 border border-slate-100 rounded-2xl">
              <div className="p-3 bg-amber-100 text-amber-800 w-fit rounded-xl mb-5">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-950 mb-2">Secure Uploads</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Upload critical files (prescriptions, test results, insurance summaries) securely. Doctors can download them straight from their dashboard.
              </p>
            </motion.div>

            {/* Feature 4 */}
            <motion.div variants={itemVariants} className="flex flex-col text-left p-6 bg-slate-50 border border-slate-100 rounded-2xl">
              <div className="p-3 bg-red-100 text-red-800 w-fit rounded-xl mb-5">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-950 mb-2">Admin Auditing</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Admin controls ensure only verified medical practitioners with active certifications are displayed to patients on the platform.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* About Section / Patient & Doctor Flow */}
      <section id="about" className="px-6 py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="text-left">
            <h2 className="text-3xl font-extrabold text-slate-950 tracking-tight mb-6">
              Bridging the gap in primary consultation
            </h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-none w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-slate-950 text-base mb-1">Apply as a Practitioner</h4>
                  <p className="text-sm text-slate-600">Register as a user and submit professional credentials, fees, and office location for review.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-none w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-slate-950 text-base mb-1">Verify Account Status</h4>
                  <p className="text-sm text-slate-600">Our platform administrators review credentials and approve verified doctors to ensure compliance.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-none w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-slate-950 text-base mb-1">Conduct Smart Care</h4>
                  <p className="text-sm text-slate-600">Receive bookings, analyze uploaded records, update schedules, and write digital follow-up summaries.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-xl text-left">
            <h3 className="font-bold text-lg text-slate-950 mb-3">Register today to experience:</h3>
            <ul className="space-y-3.5 text-slate-600 text-sm">
              <li className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                <span>Zero administrative phone queue waits.</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                <span>Encrypted medical file uploads for prior diagnostics.</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                <span>Live SMS-like in-app notifications on approval status.</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                <span>A clean, dedicated dashboard for consultation notes.</span>
              </li>
            </ul>
            <button
              onClick={() => onNav("register")}
              className="mt-6 w-full py-3 bg-emerald-600 text-white hover:bg-emerald-700 font-semibold rounded-xl transition-colors"
            >
              Sign Up Now
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12 px-6 border-t border-slate-900 text-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-emerald-500 font-bold text-lg">
            <Stethoscope className="w-5 h-5" />
            <span>MedicareBook</span>
          </div>
          <p>© 2026 MedicareBook. All rights reserved. Providing digital healthcare convenience.</p>
          <div className="flex gap-6">
            <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-white cursor-pointer transition-colors">Terms of Use</span>
            <span className="hover:text-white cursor-pointer transition-colors">Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
