'use client'

import { motion, type HTMLMotionProps } from 'motion/react'
import { fadeUp, stagger } from '@/lib/motion'

type RevealProps = HTMLMotionProps<'div'> & { delay?: number; staggerChildren?: number }

export function Reveal({ children, delay = 0, staggerChildren = 0.08, ...props }: RevealProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      variants={stagger(staggerChildren, delay)}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function RevealItem({ children, ...props }: HTMLMotionProps<'div'>) {
  return (
    <motion.div variants={fadeUp} {...props}>
      {children}
    </motion.div>
  )
}
