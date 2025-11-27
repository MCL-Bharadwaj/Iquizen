import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import MobileTopBar from './mobile/MobileTopBar';
import BottomTabBar from './mobile/BottomTabBar';
import ProfileMenu from './mobile/ProfileMenu';

/**
 * ResponsiveLayout - Adaptive navigation wrapper
 * Desktop (>= 1024px): Traditional sidebar
 * Mobile (< 1024px): Top bar + Bottom tabs + Profile menu
 */
const ResponsiveLayout = ({ children, isDark, toggleTheme, role }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024); // < 1024px = mobile/tablet
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Desktop view - show traditional sidebar
  if (!isMobile) {
    return (
      <div className="flex h-screen">
        <Sidebar isDark={isDark} toggleTheme={toggleTheme} role={role} />
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    );
  }

  // Mobile view - top bar + content + bottom tabs
  return (
    <div className="flex flex-col h-screen">
      {/* Top App Bar */}
      <MobileTopBar isDark={isDark} role={role} />

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto pb-20">
        {children}
      </main>

      {/* Bottom Tab Bar */}
      <BottomTabBar 
        isDark={isDark} 
        role={role}
        onProfileClick={() => setIsProfileMenuOpen(true)}
      />

      {/* Profile Menu Modal */}
      <ProfileMenu
        isOpen={isProfileMenuOpen}
        onClose={() => setIsProfileMenuOpen(false)}
        isDark={isDark}
        toggleTheme={toggleTheme}
        role={role}
      />

      {/* Backdrop */}
      {isProfileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setIsProfileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default ResponsiveLayout;
