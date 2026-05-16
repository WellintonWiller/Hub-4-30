import React, { useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

export const GlobalCursor = () => {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const cursorScale = useMotionValue(1);
  const cursorOpacity = useMotionValue(0); // Start hidden until mouse moves
  const springConfig = { damping: 25, stiffness: 700, mass: 0.5 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);
  const cursorScaleSpring = useSpring(cursorScale, springConfig);
  const cursorOpacitySpring = useSpring(cursorOpacity, { damping: 25, stiffness: 400 });

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX - 4); // Offset to align with SVG tip
      cursorY.set(e.clientY - 2);
      if (cursorOpacity.get() === 0) cursorOpacity.set(1);
    };
    const handleMouseDown = () => cursorScale.set(0.85);
    const handleMouseUp = () => cursorScale.set(1);
    const handleMouseLeave = () => cursorOpacity.set(0);
    const handleMouseEnter = () => cursorOpacity.set(1);

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    
    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [cursorX, cursorY, cursorScale, cursorOpacity]);

  return (
    <>
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-[999999]"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          scale: cursorScaleSpring,
          opacity: cursorOpacitySpring,
          transformOrigin: '4px 2px'
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md">
          <path d="M4 2L20 10.5L12 12L10.5 20L4 2Z" fill="#64748b" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
      </motion.div>
      <style>{`
        * { cursor: none !important; }
        .cursor-default, .cursor-pointer, .cursor-text, .cursor-move, .cursor-help, .cursor-wait, .cursor-progress, .cursor-not-allowed {
          cursor: none !important;
        }
      `}</style>
    </>
  );
};
