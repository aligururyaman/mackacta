import React from 'react'
import { motion } from "framer-motion";

function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <motion.div
        animate={{
          rotate: 360,
        }}
        transition={{
          repeat: Infinity,
          duration: 1,
          ease: "linear",
        }}
        className="w-16 h-16 border-4 border-slate-700 border-t-transparent rounded-full"
      ></motion.div>
    </div>
  )
}

export default Loading