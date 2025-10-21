import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Utility function to scroll to top smoothly
export const scrollToTop = (behavior = 'smooth') => {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: behavior
  });
};

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to the top of the page when route changes
    scrollToTop();
  }, [pathname]);

  return null;
};

export default ScrollToTop;