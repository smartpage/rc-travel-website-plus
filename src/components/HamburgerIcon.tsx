import React from 'react';
import { motion } from 'framer-motion';
import { useDesign } from '../contexts/DesignContext';

interface HamburgerIconProps {
  isOpen: boolean;
}

const HamburgerIcon = ({ isOpen }: HamburgerIconProps) => {
  const { design } = useDesign();
  const hamburgerStyle = {
    backgroundColor: design.navigation.hamburger.barColor,
    height: design.navigation.hamburger.barThickness
  };

  return (
    <div className="w-8 h-8 flex flex-col justify-center items-center relative">
      <motion.div
        animate={isOpen ? { rotate: 45, y: 0 } : { rotate: 0, y: -6 }}
        transition={{ duration: 0.3 }}
        className="w-8 absolute origin-center"
        style={hamburgerStyle}
      />
      <motion.div
        animate={isOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.3 }}
        className="w-8 absolute origin-center"
        style={hamburgerStyle}
      />
      <motion.div
        animate={isOpen ? { rotate: -45, y: 0 } : { rotate: 0, y: 6 }}
        transition={{ duration: 0.3 }}
        className="w-8 absolute origin-center"
        style={hamburgerStyle}
      />
    </div>
  );
};

export default HamburgerIcon;
