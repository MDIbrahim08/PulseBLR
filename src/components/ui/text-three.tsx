import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface TextThreeProps {
    text?: string;
}

const TextThree = ({ text = "Namaste World!" }: TextThreeProps) => {
    const [displayText, setDisplayText] = useState("")

    useEffect(() => {
        let currentIndex = 0
        const intervalId = setInterval(() => {
            if (currentIndex <= text.length) {
                setDisplayText(text.slice(0, currentIndex))
                currentIndex++
            } else {
                clearInterval(intervalId)
            }
        }, 100) // Adjust speed here

        return () => clearInterval(intervalId)
    }, [text])

    return (
        <div className="flex justify-center items-center h-64 p-4">
            <motion.div
                className="text-4xl md:text-5xl lg:text-7xl font-schibsted font-semibold text-white tracking-tight"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                {displayText}
                <motion.span 
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="ml-1 inline-block w-1 h-10 md:h-12 lg:h-16 bg-pulse-500 align-middle"
                />
            </motion.div>
        </div>
    )
}

export default TextThree
