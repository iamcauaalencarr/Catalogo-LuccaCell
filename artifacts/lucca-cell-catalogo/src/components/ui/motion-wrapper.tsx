import React from 'react';
import { motion, AnimatePresence, HTMLMotionProps, Transition } from 'framer-motion';

// Motion principles spring configuration (from kylezantos/design-principles)
export const springTransition: Transition = {
  type: 'spring',
  stiffness: 320,
  damping: 28,
  mass: 0.8,
};

export const easeTransition: Transition = {
  duration: 0.35,
  ease: [0.16, 1, 0.3, 1], // Custom smooth ease-out curve
};

interface MotionWrapperProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
}

export const FadeIn: React.FC<MotionWrapperProps> = ({
  children,
  delay = 0,
  direction = 'up',
  className,
  ...props
}) => {
  const getInitialPosition = () => {
    switch (direction) {
      case 'up': return { opacity: 0, y: 16 };
      case 'down': return { opacity: 0, y: -16 };
      case 'left': return { opacity: 0, x: 16 };
      case 'right': return { opacity: 0, x: -16 };
      case 'none': return { opacity: 0 };
    }
  };

  const getAnimatePosition = () => {
    switch (direction) {
      case 'up':
      case 'down': return { opacity: 1, y: 0 };
      case 'left':
      case 'right': return { opacity: 1, x: 0 };
      case 'none': return { opacity: 1 };
    }
  };

  return (
    <motion.div
      initial={getInitialPosition()}
      animate={getAnimatePosition()}
      exit={getInitialPosition()}
      transition={{ ...easeTransition, delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const ScaleIn: React.FC<MotionWrapperProps> = ({
  children,
  delay = 0,
  className,
  ...props
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.94 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.94 }}
    transition={{ ...springTransition, delay }}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

export const StaggerContainer: React.FC<{ children: React.ReactNode; className?: string; staggerDelay?: number }> = ({
  children,
  className,
  staggerDelay = 0.06,
}) => (
  <motion.div
    initial="hidden"
    animate="show"
    exit="hidden"
    variants={{
      hidden: { opacity: 0 },
      show: {
        opacity: 1,
        transition: {
          staggerChildren: staggerDelay,
        },
      },
    }}
    className={className}
  >
    {children}
  </motion.div>
);

export const StaggerItem: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 12, scale: 0.98 },
      show: { opacity: 1, y: 0, scale: 1, transition: springTransition },
    }}
    className={className}
  >
    {children}
  </motion.div>
);

export const PageTransition: React.FC<{ children: React.ReactNode; pageKey: string }> = ({
  children,
  pageKey,
}) => (
  <AnimatePresence mode="wait">
    <motion.div
      key={pageKey}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={easeTransition}
    >
      {children}
    </motion.div>
  </AnimatePresence>
);
