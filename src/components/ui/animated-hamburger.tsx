import React from "react"
import { motion, MotionConfig } from "framer-motion"

interface AnimatedHamburgerProps {
  isOpen: boolean;
  toggle: () => void;
}

export const AnimatedHamburger = ({ isOpen, toggle }: AnimatedHamburgerProps) => {
  return (
    <MotionConfig transition={{ duration: 0.4, ease: "circInOut" }}>
      <button
        onClick={toggle}
        className="relative h-10 w-10 flex flex-col justify-center items-center gap-[6px] focus:outline-none z-50 md:hidden"
        aria-label="Toggle mobile menu"
      >
        <motion.div
          initial={false}
          animate={isOpen ? { rotate: 45, y: 4 } : { rotate: 0, y: 0 }}
          className="w-6 h-[2.5px] bg-white rounded-full origin-center shadow-[0_0_8px_rgba(255,255,255,0.6)]"
        />
        <motion.div
          initial={false}
          animate={isOpen ? { rotate: -45, y: -4 } : { rotate: 0, y: 0 }}
          className="w-6 h-[2.5px] bg-white rounded-full origin-center shadow-[0_0_8px_rgba(255,255,255,0.6)]"
        />
      </button>
    </MotionConfig>
  )
}
