"use client"

import * as React from "react"
import { motion, AnimatePresence, MotionConfig } from "framer-motion"
import type { Variants } from "framer-motion"
import { ChevronDown, Globe, MessageCircle, Mic } from "lucide-react"

// Utility function for className merging
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}

// Custom hook for click outside detection
function useClickAway(ref: React.RefObject<HTMLElement | null>, handler: (event: MouseEvent | TouchEvent) => void) {
  React.useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return
      }
      handler(event)
    }

    document.addEventListener("mousedown", listener)
    document.addEventListener("touchstart", listener)

    return () => {
      document.removeEventListener("mousedown", listener)
      document.removeEventListener("touchstart", listener)
    }
  }, [ref, handler])
}

// Button component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "outline"
  children: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          variant === "outline" && "border border-white/10 bg-black/40 shadow-[0_0_20px_rgba(0,0,0,0.2)] backdrop-blur-sm",
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

// Types
export interface LanguageCategory {
  id: string
  label: string
  icon: React.ElementType
  color: string
}

const defaultLanguages: LanguageCategory[] = [
  { id: "English", label: "English", icon: Globe, color: "#45B7D1" },
  { id: "Kannada", label: "Kannada", icon: MessageCircle, color: "#FF6B6B" },
  { id: "Hindi", label: "Hindi", icon: Mic, color: "#F9C74F" },
]

// Icon wrapper with animation
const IconWrapper = ({
  icon: Icon,
  isHovered,
  color,
}: { icon: React.ElementType; isHovered: boolean; color: string }) => (
  <motion.div 
    className="w-4 h-4 mr-2 relative" 
    initial={false} 
    animate={isHovered ? { scale: 1.2 } : { scale: 1 }}
  >
    <Icon className="w-4 h-4" />
    {isHovered && (
      <motion.div
        className="absolute inset-0"
        style={{ color }}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        <Icon className="w-4 h-4" strokeWidth={2} />
      </motion.div>
    )}
  </motion.div>
)

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.1,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
}

interface FluidDropdownProps {
  onLanguageChange: (lang: string) => void;
}

// Main component
export function FluidDropdown({ onLanguageChange }: FluidDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedCategory, setSelectedCategory] = React.useState<LanguageCategory>(defaultLanguages[0])
  const [hoveredCategory, setHoveredCategory] = React.useState<string | null>(null)
  const dropdownRef = React.useRef<HTMLDivElement | null>(null)

  useClickAway(dropdownRef, () => setIsOpen(false))

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false)
    }
  }

  return (
    <MotionConfig reducedMotion="user">
      <div
        className="w-[120px] relative font-schibsted"
        ref={dropdownRef}
      >
          <Button
            variant="outline"
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "w-full justify-between text-white",
              "hover:bg-black/60",
              "transition-all duration-200 ease-in-out",
              "h-10 px-3",
              isOpen && "bg-black/80",
            )}
            aria-expanded={isOpen}
            aria-haspopup="true"
          >
            <span className="flex items-center">
              <IconWrapper 
                icon={selectedCategory.icon} 
                isHovered={false} 
                color={selectedCategory.color} 
              />
              {selectedCategory.label}
            </span>
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center w-4 h-4 ml-1"
            >
              <ChevronDown className="w-3 h-3" />
            </motion.div>
          </Button>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 1, y: 0, height: 0 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  height: "auto",
                  transition: {
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                    mass: 1,
                  },
                }}
                exit={{
                  opacity: 0,
                  y: 0,
                  height: 0,
                  transition: {
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                    mass: 1,
                  },
                }}
                className="absolute left-0 right-0 top-full mt-2 z-50"
                onKeyDown={handleKeyDown}
              >
                <motion.div
                  className="w-full rounded-xl border border-white/10 bg-black/80 backdrop-blur-md p-1 shadow-[0_0_20px_rgba(0,0,0,0.4)]"
                  initial={{ borderRadius: 8 }}
                  animate={{
                    borderRadius: 12,
                    transition: { duration: 0.2 },
                  }}
                  style={{ transformOrigin: "top" }}
                >
                  <motion.div 
                    className="py-1 relative" 
                    variants={containerVariants} 
                    initial="hidden" 
                    animate="visible"
                  >
                    <motion.div
                      layoutId="hover-highlight"
                      className="absolute inset-x-1 bg-white/10 rounded-md"
                      animate={{
                        y: defaultLanguages.findIndex((c) => (hoveredCategory || selectedCategory.id) === c.id) * 36,
                        height: 36,
                      }}
                      transition={{
                        type: "spring",
                        bounce: 0.15,
                        duration: 0.5,
                      }}
                    />
                    {defaultLanguages.map((category, index) => (
                      <React.Fragment key={category.id}>
                        <motion.button
                          onClick={() => {
                            setSelectedCategory(category)
                            onLanguageChange(category.id)
                            setIsOpen(false)
                          }}
                          onHoverStart={() => setHoveredCategory(category.id)}
                          onHoverEnd={() => setHoveredCategory(null)}
                          className={cn(
                            "relative flex w-full items-center px-3 py-2 text-sm rounded-md",
                            "transition-colors duration-150",
                            "focus:outline-none h-[36px]",
                            selectedCategory.id === category.id || hoveredCategory === category.id
                              ? "text-white"
                              : "text-white/60",
                          )}
                          whileTap={{ scale: 0.98 }}
                          variants={itemVariants}
                        >
                          <IconWrapper
                            icon={category.icon}
                            isHovered={hoveredCategory === category.id}
                            color={category.color}
                          />
                          {category.label}
                        </motion.button>
                      </React.Fragment>
                    ))}
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
    </MotionConfig>
  )
}
