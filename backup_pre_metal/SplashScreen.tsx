import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Loader from './Loader';

export const SplashScreen = ({ isLoading, isDark = true }: { isLoading: boolean; isDark?: boolean }) => {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] } }}
          className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center ${isDark ? 'bg-[#0a0a0a]' : 'bg-transparent backdrop-blur-md'}`}
        >
          <Loader />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
