import React from 'react';
import { SmokeyBackground, LoginForm } from '../components/ui/login-form';

export default function Login() {
  return (
    <main className="relative w-screen h-screen bg-slate-950 overflow-hidden flex items-center justify-center">
      {/* 21st.dev Smokey Background Shader */}
      <SmokeyBackground 
        className="absolute inset-0 z-0" 
        color="#0ea5e9" // PulseBLR accent color 
        backdropBlurAmount="sm" 
      />
      
      {/* PulseBLR Login Form */}
      <div className="relative z-10 w-full p-4 flex items-center justify-center">
        <LoginForm />
      </div>
    </main>
  );
}
