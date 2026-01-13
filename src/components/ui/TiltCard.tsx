'use client'

import React, { useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { cn } from '@/lib/utils'

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode
    className?: string
    tiltIntensity?: number
    glareOpacity?: number
}

export function TiltCard({
    children,
    className,
    tiltIntensity = 20,
    glareOpacity = 0.4,
    ...props
}: TiltCardProps) {
    const ref = useRef<HTMLDivElement>(null)
    const [hovering, setHovering] = useState(false)

    // Motion values for mouse position
    const x = useMotionValue(0)
    const y = useMotionValue(0)

    // Smooth spring physics for rotation
    const mouseX = useSpring(x, { stiffness: 500, damping: 40 })
    const mouseY = useSpring(y, { stiffness: 500, damping: 40 })

    // Calculate rotation based on mouse position
    const rotateX = useTransform(mouseY, [-0.5, 0.5], [tiltIntensity, -tiltIntensity])
    const rotateY = useTransform(mouseX, [-0.5, 0.5], [-tiltIntensity, tiltIntensity])

    // Glare position
    const glareX = useTransform(mouseX, [-0.5, 0.5], [0, 100])
    const glareY = useTransform(mouseY, [-0.5, 0.5], [0, 100])

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return

        const rect = ref.current.getBoundingClientRect()
        const width = rect.width
        const height = rect.height

        const mouseXPos = e.clientX - rect.left
        const mouseYPos = e.clientY - rect.top

        // Normalize mouse coordinates to -0.5 to 0.5 range
        const xPct = mouseXPos / width - 0.5
        const yPct = mouseYPos / height - 0.5

        x.set(xPct)
        y.set(yPct)
    }

    const handleMouseLeave = () => {
        setHovering(false)
        x.set(0)
        y.set(0)
    }

    const handleMouseEnter = () => {
        setHovering(true)
    }

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseEnter={handleMouseEnter}
            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
            }}
            className={cn("relative will-change-transform", className)}
            {...props as any}
        >
            <div
                style={{
                    transform: "translateZ(20px)",
                    transformStyle: "preserve-3d"
                }}
                className="relative h-full"
            >
                {children}
            </div>

            {/* Glare Effect */}
            <motion.div
                className="absolute inset-0 pointer-events-none rounded-2xl z-50 mix-blend-overlay"
                style={{
                    opacity: hovering ? glareOpacity : 0,
                    background: useTransform(
                        [glareX, glareY],
                        ([latestX, latestY]) => `radial-gradient(circle at ${latestX}% ${latestY}%, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 80%)`
                    )
                }}
            />
        </motion.div>
    )
}
