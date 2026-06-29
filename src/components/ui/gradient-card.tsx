import React from "react";
import { motion } from "framer-motion";

interface GradientCardProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
}

export const GradientCard: React.FC<GradientCardProps> = ({ children, className = "", containerClassName = "" }) => {
  return (
    <div className={`relative group rounded-[22px] p-[1px] overflow-hidden ${containerClassName}`}>
      {/* Animated gradient border */}
      <span className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/50 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[22px]" />
      
      {/* Glowing background blob */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 blur-xl bg-gradient-to-br from-emerald-500 to-teal-400" />
      
      <div className={`relative h-full bg-[#0B0F19] rounded-[21px] p-5 border border-white/[0.07] group-hover:border-transparent transition-colors duration-500 ${className}`}>
        {children}
      </div>
    </div>
  );
};
