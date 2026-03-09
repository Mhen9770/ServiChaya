'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'

interface AnimatedIconProps {
  icon: LucideIcon | ReactNode
  size?: 'sm' | 'md' | 'lg'
  className?: string
  animationType?: 'float' | 'pulse' | 'rotate' | 'bounce' | 'glow'
  color?: string
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8 sm:w-10 sm:h-10'
}

export default function AnimatedIcon({ 
  icon, 
  size = 'md', 
  className = '', 
  animationType = 'float',
  color = 'text-white'
}: AnimatedIconProps) {
  const IconComponent = typeof icon === 'function' ? icon : null
  const iconContent = typeof icon === 'string' ? icon : null

  const animations = {
    float: {
      animate: {
        y: [0, -8, 0],
        rotate: [0, 5],
        scale: [1, 1.1, 1]
      },
      transition: {
        y: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
        rotate: { duration: 3, repeat: Infinity, repeatType: "reverse" as const, ease: "easeInOut" },
        scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
      }
    },
    pulse: {
      animate: {
        scale: [1, 1.2, 1],
        opacity: [1, 0.8, 1]
      },
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    rotate: {
      animate: {
        rotate: [0, 360]
      },
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "linear"
      }
    },
    bounce: {
      animate: {
        y: [0, -10, 0],
        scale: [1, 1.15, 1]
      },
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    glow: {
      animate: {
        scale: [1, 1.15, 1],
        filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)']
      },
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }

  const animation = animations[animationType]

  return (
    <motion.div
      className={`relative ${className}`}
      {...animation}
      whileHover={{ scale: 1.2, rotate: 10 }}
    >
      {IconComponent ? (
        <IconComponent className={`${sizeClasses[size]} ${color}`} />
      ) : iconContent ? (
        <span className={`${sizeClasses[size]} ${color} text-4xl`}>{iconContent}</span>
      ) : (
        <div className={`${sizeClasses[size]} ${color}`}>{icon}</div>
      )}
      {animationType === 'glow' && (
        <motion.div
          className="absolute inset-0 blur-md opacity-50"
          animate={{
            scale: [1, 1.3],
            opacity: [0.5, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeOut"
          }}
        />
      )}
    </motion.div>
  )
}
