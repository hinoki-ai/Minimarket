"use client"

import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react"
import { motion, AnimatePresence } from "motion/react"
import { useEffect, useState, useCallback, useRef } from "react"
import Image from 'next/image'

export type AnimatedTestimonial = {
    quote: string
    name: string
    designation: string
    src: string
}

export function AnimatedTestimonials({
    testimonials,
    autoplay = false,
}: {
    testimonials: AnimatedTestimonial[]
    autoplay?: boolean
}) {
    const [active, setActive] = useState(0)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)

    const clearTimer = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
        }
    }, [])

    const startTimer = useCallback(() => {
        if (autoplay) {
            clearTimer()
            intervalRef.current = setInterval(() => {
                setActive((prev) => (prev + 1) % testimonials.length)
            }, 5000)
        }
    }, [autoplay, testimonials.length, clearTimer])

    const resetTimer = useCallback(() => {
        clearTimer()
        if (autoplay) {
            // Start timer after a brief delay to allow for smooth transitions
            setTimeout(startTimer, 100)
        }
    }, [autoplay, clearTimer, startTimer])

    const handleNext = useCallback(() => {
        setActive((prev) => (prev + 1) % testimonials.length)
        resetTimer()
    }, [testimonials.length, resetTimer])

    const handlePrev = useCallback(() => {
        setActive((prev) => (prev - 1 + testimonials.length) % testimonials.length)
        resetTimer()
    }, [testimonials.length, resetTimer])

    const isActive = (index: number) => index === active

    useEffect(() => {
        startTimer()
        return () => clearTimer()
    }, [autoplay, startTimer, clearTimer])

    // Predefined rotation values to avoid hydration mismatches
    const rotationValues = [4, -5, -8, 7, 3, -8, -7, 0, 2, -3]
    const getRotationForIndex = (index: number) => rotationValues[index % rotationValues.length]

    return (
        <div className="mx-auto max-w-sm px-4 py-12 font-sans antialiased md:max-w-4xl md:px-8 lg:px-12">
            <div className="relative grid grid-cols-1 gap-12 md:grid-cols-2">
                <div>
                    <div className="relative h-80 w-full">
                        <AnimatePresence>
                            {testimonials.map((testimonial, index) => (
                                <motion.div
                                    key={testimonial.src}
                                    initial={{
                                        opacity: 0,
                                        scale: 0.9,
                                        z: -100,
                                        rotate: getRotationForIndex(index),
                                    }}
                                    animate={{
                                        opacity: isActive(index) ? 1 : 0.7,
                                        scale: isActive(index) ? 1 : 0.95,
                                        z: isActive(index) ? 0 : -100,
                                        rotate: isActive(index) ? 0 : getRotationForIndex(index),
                                        zIndex: isActive(index) ? 40 : testimonials.length + 2 - index,
                                        y: isActive(index) ? [0, -80, 0] : 0,
                                    }}
                                    exit={{
                                        opacity: 0,
                                        scale: 0.9,
                                        z: 100,
                                        rotate: getRotationForIndex(index),
                                    }}
                                    transition={{ duration: 0.4, ease: "easeInOut" }}
                                    className="absolute inset-0 origin-bottom"
                                >
                                    <Image
                                        src={testimonial.src}
                                        alt={testimonial.name}
                                        width={500}
                                        height={500}
                                        draggable={false}
                                        className="h-full w-full rounded-3xl object-cover object-center"
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
                <div className="flex flex-col justify-between py-2">
                    <motion.div
                        key={active}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                    >
                        <h3 className="text-2xl font-bold text-black dark:text-white">
                            {testimonials[active].name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-neutral-500">
                            {testimonials[active].designation}
                        </p>
                        <motion.p className="mt-8 text-lg text-gray-500 dark:text-neutral-300">
                            {testimonials[active].quote.split(" ").map((word, index) => (
                                <motion.span
                                    key={index}
                                    initial={{ filter: "blur(10px)", opacity: 0, y: 5 }}
                                    animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, ease: "easeInOut", delay: 0.02 * index }}
                                    className="inline-block"
                                >
                                    {word}&nbsp;
                                </motion.span>
                            ))}
                        </motion.p>
                    </motion.div>
                    <div className="flex gap-4 pt-10 md:pt-0">
                        <button
                            onClick={handlePrev}
                            className="group/button flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800"
                            aria-label="Anterior"
                        >
                            <IconArrowLeft className="h-5 w-5 text-black transition-transform duration-300 group-hover/button:rotate-12 dark:text-neutral-400" />
                        </button>
                        <button
                            onClick={handleNext}
                            className="group/button flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800"
                            aria-label="Siguiente"
                        >
                            <IconArrowRight className="h-5 w-5 text-black transition-transform duration-300 group-hover/button:-rotate-12 dark:text-neutral-400" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AnimatedTestimonials

