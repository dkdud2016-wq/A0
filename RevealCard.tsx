"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface RevealCardProps {
  children: ReactNode;
  index: number;
  className?: string;
}

export default function RevealCard({ children, index, className = "" }: RevealCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.15, ease: "easeOut" }}
      className={`rounded-3xl bg-white p-6 shadow-card ${className}`}
    >
      {children}
    </motion.div>
  );
}
