'use client'
import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { MapPin, User, HardHat, ShieldCheck, Mail, Lock, Phone, Map, Calendar, Users, ArrowRight, CheckCircle2, FileText, BadgeCheck } from 'lucide-react';

type Role = 'user' | 'contractor' | 'authority';

export default function Register() {
  const [role, setRole] = useState<Role>('user');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    pincode: '',
    address: '',
    age: '',
    gender: '',
    password: '',
    contractorId: '',
    authorityId: '',
    agreeTerms: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  const { name, value, type } = e.target;
  const checked = (e.target as HTMLInputElement).checked;
  setFormData(prev => ({
    ...prev,
    [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Registration attempt:', { role, ...formData });
    // Add actual registration logic here
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#0a0f1c] transition-colors duration-300">
      {/* Left side - Branding/Image */}
      <div className="hidden lg:flex lg:w-5/12 bg-slate-900 relative overflow-hidden items-center justify-center fixed inset-y-0 left-0">
        <div className="absolute inset-0">
          <img 
            src="https://picsum.photos/seed/civic2/1920/1080?blur=2" 
            alt="City infrastructure" 
            className="w-full h-full object-cover opacity-40"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/80 to-slate-900/90 mix-blend-multiply" />
        </div>
        
        <div className="relative z-10 p-12 text-white max-w-xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                <img 
                  src="https://picsum.photos/seed/civiclens-logo/200/200" 
                  alt="Logo" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h1 className="text-4xl font-bold tracking-tight">CivicLens</h1>
            </div>
            <h2 className="text-4xl font-semibold leading-tight mb-6">
              Join the movement for <br />
              <span className="text-indigo-400">better infrastructure.</span>
            </h2>
            <div className="space-y-4 mt-8">
              <div className="flex items-center gap-3 text-slate-300">
                <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                <span>Report issues anonymously</span>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                <span>Track project progress in real-time</span>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                <span>Hold contractors accountable</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right side - Register Form */}
      <div className="w-full lg:w-7/12 lg:ml-auto flex items-center justify-center p-6 sm:p-12">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-2xl"
        >
          <div className="mb-8 lg:hidden flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
              <img 
                src="https://picsum.photos/seed/civiclens-logo/200/200" 
                alt="Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">CivicLens</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">Create an account</h2>
            <p className="text-slate-500 dark:text-slate-400">Fill in your details to get started with CivicLens.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-8">
            {/* Role Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">I am registering as a</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('user')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                    role === 'user' 
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 shadow-sm ring-1 ring-indigo-600' 
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <User className="w-6 h-6 mb-2" />
                  <span className="text-sm font-medium">Citizen</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('contractor')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                    role === 'contractor' 
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 shadow-sm ring-1 ring-emerald-600' 
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <HardHat className="w-6 h-6 mb-2" />
                  <span className="text-sm font-medium">Contractor</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('authority')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                    role === 'authority' 
                      ? 'border-amber-600 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 shadow-sm ring-1 ring-amber-600' 
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <ShieldCheck className="w-6 h-6 mb-2" />
                  <span className="text-sm font-medium">Authority</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Conditional ID Fields */}
              {role === 'contractor' && (
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Contractor Registration ID</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FileText className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      name="contractorId"
                      value={formData.contractorId}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent bg-white dark:bg-[#111827] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-shadow"
                      placeholder="Enter your official contractor ID"
                      required
                    />
                  </div>
                </div>
              )}

              {role === 'authority' && (
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Authority ID / Badge Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <BadgeCheck className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      name="authorityId"
                      value={formData.authorityId}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent bg-white dark:bg-[#111827] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-shadow"
                      placeholder="Enter your official authority ID"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent bg-white dark:bg-[#111827] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-shadow"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent bg-white dark:bg-[#111827] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-shadow"
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>

              {/* Phone & Pincode (OTP) */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number & Verification</label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent bg-white dark:bg-[#111827] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-shadow"
                      placeholder="+91 98765 43210"
                      required
                    />
                  </div>
                  <button type="button" className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 transition-colors whitespace-nowrap">
                    Send OTP
                  </button>
                </div>
                <div className="mt-3">
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    className="block w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent bg-white dark:bg-[#111827] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-shadow text-center tracking-widest"
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    required
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Address</label>
                <div className="relative">
                  <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                    <Map className="h-5 w-5 text-slate-400" />
                  </div>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={2}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent bg-white dark:bg-[#111827] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-shadow resize-none"
                    placeholder="Enter your complete address"
                    required
                  />
                </div>
              </div>

              {/* Age */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Age</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    min="18"
                    max="120"
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent bg-white dark:bg-[#111827] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-shadow"
                    placeholder="Years"
                    required
                  />
                </div>
              </div>

              {/* Gender */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Gender</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Users className="h-5 w-5 text-slate-400" />
                  </div>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent bg-white dark:bg-[#111827] text-slate-900 dark:text-white transition-shadow appearance-none"
                    required
                  >
                    <option value="" disabled>Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent bg-white dark:bg-[#111827] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-shadow"
                    placeholder="Create a strong password"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Checkbox */}
            <div className="flex items-start gap-3">
              <div className="flex items-center h-5 mt-0.5">
                <input
                  id="agreeTerms"
                  name="agreeTerms"
                  type="checkbox"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                  className="w-4 h-4 text-indigo-600 border-slate-300 dark:border-slate-700 rounded focus:ring-indigo-600 dark:bg-[#111827]"
                  required
                />
              </div>
              <label htmlFor="agreeTerms" className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                I agree to the <a href="#" className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">Terms of Service</a> and <a href="#" className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">Privacy Policy</a>. I understand that my identity will remain anonymous when filing complaints.
              </label>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 transition-colors"
            >
              Create Account
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-8 text-center pb-8 lg:pb-0">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors">
                Sign in instead
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
