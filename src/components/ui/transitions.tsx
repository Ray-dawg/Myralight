import React from "react";
import { motion } from "framer-motion";

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const slideUp = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: -20, opacity: 0 },
};

export const slideIn = {
  initial: { x: -20, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 20, opacity: 0 },
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const FadeIn = ({ children }: { children: React.ReactNode }) => (
  <motion.div initial="initial" animate="animate" exit="exit" variants={fadeIn}>
    {children}
  </motion.div>
);

export const SlideUp = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial="initial"
    animate="animate"
    exit="exit"
    variants={slideUp}
  >
    {children}
  </motion.div>
);

export const SlideIn = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial="initial"
    animate="animate"
    exit="exit"
    variants={slideIn}
  >
    {children}
  </motion.div>
);

export const StaggerChildren = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <motion.div
    variants={staggerContainer}
    initial="initial"
    animate="animate"
    exit="exit"
  >
    {children}
  </motion.div>
);
