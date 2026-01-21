import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import SideNav from './components/SideNav';
import LoginPage from './components/LoginPage';
import AddProductPage from './components/AddProductPage';
import ItemsPage from './components/ItemsPage';
import DashboardPage from './components/DashboardPage';
import CreateShipmentPage from './components/CreateShipmentPage';
import ManageShipmentsPage from './components/ManageShipmentsPage';
import InventoryOverviewPage from './components/InventoryPage';
import ShipmentsOverviewPage from './components/ShipmentsPage';
import UsersPage from './components/UsersPage';
import ComingSoonPage from './components/ComingSoonPage';
import { ProductData } from './types';
import { Search, Bell, Menu, Code, Sparkles } from 'lucide-react';
import { ThemeProvider } from './contexts/ThemeContext';

// Centralized Portal component for z-index management
export const Portal = ({ children }: { children?: React.ReactNode }) => {
  if (typeof document === 'undefined') return null;
  return createPortal(children, document.body);
};

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [isSideNavOpen, setIsSideNavOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  // Loading State
  const [isAppReady, setIsAppReady] = useState(false);
  const [showLoaderContent, setShowLoaderContent] = useState(false);
  const [isLogoLoaded, setIsLogoLoaded] = useState(false);

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('isAuthenticated') === 'true';
    }
    return false;
  });
  const [userRole, setUserRole] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userRole') || '(Staff)';
    }
    return '(Staff)';
  });

  useEffect(() => {
    // Handle Screen Resize
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsMobile(true);
        setIsSideNavOpen(false);
      } else {
        setIsMobile(false);
        setIsSideNavOpen(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Handle Loader Logic
    const img = new Image();
    const logoSrc = "https://app.kambojventures.com/assets/images/logos/logo.png";
    img.src = logoSrc;
    
    const onImageSuccess = () => {
      setIsLogoLoaded(true);
      setShowLoaderContent(true);
      // Start the app entry timer only after the image is ready to be displayed
      setTimeout(() => {
        setIsAppReady(true);
      }, 2500);
    };

    const onImageFailure = () => {
      setIsLogoLoaded(false); // Image failed, don't show white box
      setShowLoaderContent(true); // Still show loader bar
      setTimeout(() => {
        setIsAppReady(true);
      }, 2500);
    };

    img.onload = onImageSuccess;
    img.onerror = onImageFailure;
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleLogin = (email: string, role: string) => {
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userRole', role);
    setIsAuthenticated(true);
    setUserRole(role);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
    setIsAuthenticated(false);
    setUserRole('(Staff)'); // Reset to default safely
    setCurrentView('dashboard'); // Reset view
  };

  const handleSaveProduct = (data: ProductData) => {
    console.log("Product Saved:", data);
  };

  const getBreadcrumbs = () => {
    switch (currentView) {
      case 'add-product':
        return ['Home', 'Inventory', 'Add Product'];
      case 'items':
        return ['Home', 'Inventory', 'Items'];
      case 'item-groups':
        return ['Home', 'Inventory', 'Item Groups'];
      case 'inventory':
        return ['Home', 'Inventory', 'Overview'];
      case 'inventory/products':
        return ['Home', 'Inventory', 'Products'];
      case 'create-shipment':
        return ['Home', 'Shipments', 'Create Shipment'];
      case 'manage-shipments':
        return ['Home', 'Shipments', 'Manage'];
      case 'shipments':
        return ['Home', 'Shipments', 'Overview'];
      case 'users':
        return ['Home', 'Settings', 'Users'];
      case 'dashboard':
      default:
        return ['Home', 'Dashboard'];
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'add-product':
        return (
          <AddProductPage
            onSave={handleSaveProduct}
            onCancel={() => setCurrentView('inventory/products')}
            onGoToProducts={() => setCurrentView('inventory/products')}
          />
        );
      case 'items':
        return (
          <ItemsPage onNavigate={setCurrentView} />
        );
      case 'item-groups':
        return (
          <ComingSoonPage 
            title="Item Groups" 
            description="We are currently building a powerful new way to organize, bundle, and manage inventory categories at our KV warehouse. This feature will be available in the next update."
            onBack={() => setCurrentView('dashboard')} 
          />
        );
      case 'inventory':
        return (
          <InventoryOverviewPage onNavigate={setCurrentView} />
        );
      case 'create-shipment':
        return (
          <CreateShipmentPage onNavigate={setCurrentView} />
        );
      case 'manage-shipments':
        return (
          <ManageShipmentsPage onNavigate={setCurrentView} />
        );
      case 'shipments':
        return (
          <ShipmentsOverviewPage onNavigate={setCurrentView} />
        );
      case 'users':
        return (
          <UsersPage onNavigate={setCurrentView} />
        );
      case 'dashboard':
      default:
        return <DashboardPage />;
    }
  };

  if (!isAppReady) {
    return (
      <div className="fixed inset-0 bg-[#161616] flex flex-col items-center justify-center z-[var(--z-splash)]">
        {showLoaderContent && (
          <div className="flex flex-col items-center justify-center animate-fade-in-fast">
            {/* Logo Container - Only shows white background if logo loaded successfully */}
            <div className={`p-6 rounded-2xl mb-8 animate-modal-enter transition-all duration-300 ${isLogoLoaded ? 'bg-white shadow-2xl' : 'bg-transparent'}`}>
              {isLogoLoaded && (
                <img 
                  src="https://app.kambojventures.com/assets/images/logos/logo.png" 
                  alt="Kamboj Ventures Logo" 
                  className="h-14 md:h-16 object-contain"
                />
              )}
            </div>

            {/* Loading Bar Container */}
            <div className="w-[200px] md:w-[300px] h-[4px] bg-[#393939] rounded-full overflow-hidden mb-6 relative">
              <div className="h-full bg-[#0f62fe] animate-loading-bar rounded-full shadow-[0_0_8px_rgba(15,98,254,0.5)]"></div>
            </div>

            {/* Credits */}
            <div className="text-center animate-slide-up-bounce" style={{ animationDelay: '300ms' }}>
              <p className="text-[#8d8d8d] text-[13px] md:text-[14px] font-normal tracking-wide">
                Designed & Developed by{' '}
                <a 
                  href="https://github.com/SalesGuyInTech" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#f4f4f4] hover:text-[#0f62fe] transition-colors border-b border-transparent hover:border-[#0f62fe] font-medium"
                >
                  GM
                </a>
                {' '}&{' '}
                <a 
                  href="https://github.com/AveragedevRK/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#f4f4f4] hover:text-[#0f62fe] transition-colors border-b border-transparent hover:border-[#0f62fe] font-medium"
                >
                  Rajab
                </a>
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // If app is ready but not authenticated, show login page
  if (!isAuthenticated) {
    return (
      <LoginPage onLogin={handleLogin} />
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-0)] text-[var(--text-primary)] flex animate-fade-in-fast transition-colors duration-300">

      <SideNav
        isOpen={isSideNavOpen}
        setIsOpen={setIsSideNavOpen}
        isMobile={isMobile}
        onNavigate={setCurrentView}
        currentView={currentView}
        userRole={userRole}
        onLogout={handleLogout}
      />

      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out
          ${isSideNavOpen && !isMobile ? 'ml-[250px]' : 'ml-[60px]'}
          ${isMobile ? 'ml-0' : ''}
        `}
      >
        {/* Top Header */}
        <header className="h-[48px] bg-[var(--bg-0)] border-b border-[var(--border-1)] flex items-center justify-between px-4 sticky top-0 z-[var(--z-header)] shrink-0 transition-colors duration-300">
          <div className="flex items-center gap-4">
            {isMobile && (
              <button onClick={() => setIsSideNavOpen(true)} className="text-[var(--text-primary)]">
                <Menu size={20} />
              </button>
            )}

            <div className="hidden md:flex text-[14px] text-[var(--text-secondary)] items-center animate-fade-in-fast">
              {getBreadcrumbs().map((crumb, index, arr) => (
                <React.Fragment key={index}>
                  <span
                    className={`transition-colors duration-200 ${index === arr.length - 1 ? 'text-[var(--text-primary)]' : 'hover:text-[var(--text-primary)] cursor-pointer'}`}
                    onClick={() => {
                      if (index === 0) setCurrentView('dashboard');
                    }}
                  >
                    {crumb}
                  </span>
                  {index < arr.length - 1 && <span className="mx-2">/</span>}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block group">
              <input
                type="text"
                placeholder="Search products, shipments..."
                className="bg-[var(--bg-1)] border-b border-[var(--border-2)] text-[var(--text-primary)] text-[14px] h-[32px] pl-8 pr-4 focus:outline-none focus:border-[var(--text-primary)] w-[240px] transition-all focus:w-[300px]"
              />
              <Search className="w-4 h-4 text-[var(--text-secondary)] absolute left-2 top-1/2 -translate-y-1/2 transition-colors group-hover:text-[var(--text-primary)]" />
            </div>

            <button className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-transform hover:scale-110">
              <Bell size={20} />
            </button>
            <div className="w-[32px] h-[32px] bg-[#0f62fe] flex items-center justify-center text-white font-medium cursor-pointer hover:bg-[#0353e9] transition-colors">
              AK
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-hidden flex flex-col relative bg-[var(--bg-0)] transition-colors duration-300">
           <div key={currentView} className="flex-1 h-full flex flex-col animate-fade-in-fast overflow-auto no-scrollbar">
              {renderContent()}
           </div>
           
           {/* Prominent Global Footer */}
           <footer className="h-[48px] px-6 border-t border-[var(--border-1)] bg-[var(--bg-0)] flex items-center justify-between text-[12px] md:text-[13px] text-[var(--text-tertiary)] shrink-0 z-20 transition-colors duration-300">
              <div className="hidden md:flex items-center gap-2">
                <Code size={16} className="text-[#0f62fe] animate-pulse" />
                <span className="font-medium tracking-tight">Kamboj Ventures FBA Shipments Manager</span>
              </div>
              
              {/* Ultra-Prominent Credits with High-Impact Animation */}
              <div 
                key={currentView} 
                className="flex-1 md:flex-none text-center md:text-right animate-slide-up-bounce"
              >
                <span className="opacity-60 text-[11px] uppercase tracking-[0.1em] font-bold mr-2">Engineered by</span>{' '}
                <span className="relative inline-block credit-underline-flashy">
                  <a 
                    href="https://github.com/SalesGuyInTech" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="animate-shine-bright font-extrabold text-[15px] transition-all hover:scale-110 inline-block px-1 text-[var(--text-primary)]"
                  >
                    GM
                  </a>
                  <span className="text-[var(--text-tertiary)] mx-1 text-[14px] font-light">&</span>
                  <a 
                    href="https://github.com/AveragedevRK/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="animate-shine-bright font-extrabold text-[15px] transition-all hover:scale-110 inline-block px-1 text-[var(--text-primary)]"
                  >
                    Rajab
                  </a>
                  <Sparkles className="inline-block ml-2 w-3 h-3 text-[#0f62fe] animate-pulse" />
                </span>
              </div>
           </footer>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => (
  <ThemeProvider>
    <AppContent />
  </ThemeProvider>
);

export default App;