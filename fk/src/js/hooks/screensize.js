import { useState, useEffect } from 'react';

function getWindowDimensions() {
  const { innerWidth: vpWidth, innerHeight: vpHeight } = window;
  return {
    vpWidth,
    vpHeight
  };
}

export default function useWindowDimensions() {
  const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());

  useEffect(() => {
    function handleResize() {
      setWindowDimensions(getWindowDimensions());
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowDimensions;
}