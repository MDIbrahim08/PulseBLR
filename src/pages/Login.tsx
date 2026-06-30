import React from 'react';
import { LoginForm, SmokeyBackground } from '../components/ui/login-form';

export default function Login() {
  return (
    <main className="relative w-screen h-screen bg-slate-950 overflow-hidden flex items-center justify-center">
      {/* Optimized Background */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-pulse-900/40 via-slate-950 to-slate-950"></div>
      
      {/* Smokey Animated Background */}
      <SmokeyBackground className="absolute inset-0 z-0" />

      {/* PulseBLR Login Form */}
      <div className="relative z-10 w-full p-4 flex items-center justify-center">
        <LoginForm />
      </div>
    </main>
  );
}
