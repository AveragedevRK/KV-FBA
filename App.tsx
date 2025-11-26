import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom'; // Import createPortal here for the shared Portal component
import SideNav from './components/SideNav';
import AddProductPage from './components/AddProductPage';
import ItemsPage from './components/ItemsPage';
import DashboardPage from './components/DashboardPage';
import CreateShipmentPage from './components/CreateShipmentPage';
import ManageShipmentsPage from './components/ManageShipmentsPage';
import UsersPage from './components/UsersPage';
import InventoryPage from './components/InventoryPage'; // Renamed import
import ShipmentsPage from './components/ShipmentsPage'; // Renamed import
import { ProductData } from './types';
import { Search, Bell, Menu } from 'lucide-react';

// Centralized Portal component for z-index management
export const Portal = ({ children }: { children?: React.ReactNode }) => {
  if (typeof document === 'undefined') return null;
  return createPortal(children, document.body);
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [isSideNavOpen, setIsSideNavOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
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
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSaveProduct = (data: ProductData) => {
    console.log("Product Saved:", data);
    // This onSave callback is for local state, the AddProductPage will now handle backend API calls.
  };

  const getBreadcrumbs = () => {
    switch (currentView) {
      case 'add-product':
        return ['Home', 'Inventory', 'Add Product'];
      case 'items':
        return ['Home', 'Inventory', 'Items'];
      case 'item-groups':
        return ['Home', 'Inventory', 'Item Groups'];
      case 'inventory': // Updated breadcrumb
        return ['Home', 'Inventory'];
      case 'inventory/products': // New breadcrumb for Products page
        return ['Home', 'Inventory', 'Products'];
      case 'create-shipment':
        return ['Home', 'Shipments', 'Create Shipment'];
      case 'manage-shipments':
        return ['Home', 'Shipments', 'Manage'];
      case 'shipments': // Updated breadcrumb
        return ['Home', 'Shipments'];
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
            onCancel={() => setCurrentView('inventory/products')} // Navigate to products list on cancel
            onGoToProducts={() => setCurrentView('inventory/products')} // Corrected navigation to Products list
          />
        );
      case 'items':
        return (
          <ItemsPage onNavigate={setCurrentView} />
        );
      case 'inventory': // Updated route
        return (
          <InventoryPage onNavigate={setCurrentView} />
        );
      case 'create-shipment':
        return (
          <CreateShipmentPage onNavigate={setCurrentView} />
        );
      case 'manage-shipments':
        return (
          <ManageShipmentsPage onNavigate={setCurrentView} />
        );
      case 'shipments': // Updated route
        return (
          <ShipmentsPage onNavigate={setCurrentView} />
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

  return (
    <div className="min-h-screen bg-[#161616] text-[#f4f4f4] flex">

      <SideNav
        isOpen={isSideNavOpen}
        setIsOpen={setIsSideNavOpen}
        isMobile={isMobile}
        onNavigate={setCurrentView}
        currentView={currentView}
      />

      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out
          ${isSideNavOpen && !isMobile ? 'ml-[250px]' : 'ml-[60px]'}
          ${isMobile ? 'ml-0' : ''}
        `}
      >
        {/* Top Header */}
        <header className="h-[48px] bg-[#161616] border-b border-[#393939] flex items-center justify-between px-4 sticky top-0 z-[var(--z-header)] shrink-0">
          <div className="flex items-center gap-4">
            {isMobile && (
              <button onClick={() => setIsSideNavOpen(true)} className="text-[#f4f4f4]">
                <Menu size={20} />
              </button>
            )}

            <div className="hidden md:flex text-[14px] text-[#c6c6c6] items-center animate-fade-in-fast">
              {getBreadcrumbs().map((crumb, index, arr) => (
                <React.Fragment key={index}>
                  <span
                    className={`transition-colors duration-200 ${index === arr.length - 1 ? 'text-[#f4f4f4]' : 'hover:text-[#f4f4f4] cursor-pointer'}`}
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
                className="bg-[#262626] border-b border-[#8d8d8d] text-[#f4f4f4] text-[14px] h-[32px] pl-8 pr-4 focus:outline-none focus:border-[#f4f4f4] w-[240px] transition-all focus:w-[300px]"
              />
              <Search className="w-4 h-4 text-[#c6c6c6] absolute left-2 top-2 transition-colors group-hover:text-[#f4f4f4]" />
            </div>

            <button className="text-[#c6c6c6] hover:text-[#f4f4f4] transition-transform hover:scale-110">
              <Bell size={20} />
            </button>
            <div className="w-[32px] h-[32px] bg-[#0f62fe] flex items-center justify-center text-white font-medium cursor-pointer hover:bg-[#0353e9] transition-colors">
              HS
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-hidden flex flex-col relative">
           <div key={currentView} className="flex-1 h-full flex flex-col animate-fade-in-fast">
              {renderContent()}
           </div>
        </main>
      </div>
    </div>
  );
};

export default App;
