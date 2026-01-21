import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Portal } from '../App'; // Import Portal from App.tsx
import { useTheme } from '../contexts/ThemeContext';
import { 
  Package, 
  Truck, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight, 
  LayoutDashboard,
  Layers,
  Box,
  PlusCircle,
  ArrowDownToLine,
  LucideIcon,
  PieChart,
  Code,
  Moon,
  Sun
} from 'lucide-react';

interface SideNavProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isMobile: boolean;
  onNavigate: (view: string) => void;
  currentView: string;
  userRole: string; // New prop for role
  onLogout: () => void; // New prop for logout handler
}

// --- Configuration ---

interface NavItemConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  view?: string;
  isAction?: boolean;
  children?: NavItemConfig[];
}

const NAV_ITEMS: NavItemConfig[] = [
  { 
    id: 'dashboard', 
    label: 'Dashboard', 
    icon: LayoutDashboard, 
    view: 'dashboard' 
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: Package,
    view: 'inventory', // Parent navigates directly to Inventory page
    children: [
      // Removed 'inventory-overview' child
      { id: 'add-product', label: 'Add Product', icon: PlusCircle, view: 'add-product', isAction: true },
      { id: 'items', label: 'Items', icon: Box, view: 'items' },
      { id: 'item-groups', label: 'Item Groups', icon: Layers, view: 'item-groups' }
    ]
  },
  {
    id: 'shipments',
    label: 'Shipments',
    icon: Truck,
    view: 'shipments', // Parent navigates directly to Shipments page
    children: [
      // Removed 'shipments-overview' child
      { id: 'create-shipment', label: 'Create Shipment', icon: PlusCircle, view: 'create-shipment', isAction: true },
      { id: 'manage-shipments', label: 'Manage', icon: ArrowDownToLine, view: 'manage-shipments' }
    ]
  }
];

// --- Components ---


interface FlyoutProps {
  title: string;
  children: React.ReactNode;
  top: number;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const Flyout: React.FC<FlyoutProps> = ({ title, children, top, onMouseEnter, onMouseLeave }) => {
  // Position fixed to the right of the 60px collapsed rail
  return (
    <div 
      className="fixed left-[60px] z-[var(--z-dropdown)] w-[220px] bg-[var(--bg-1)] border border-[var(--border-1)] shadow-2xl animate-slide-in-right origin-left"
      style={{ top: `${top}px` }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="px-4 py-3 border-b border-[var(--border-1)] text-[11px] font-bold text-[var(--text-tertiary)] tracking-wider uppercase bg-[var(--bg-1)]">
        {title}
      </div>
      <div className="py-1 bg-[var(--bg-1)]">
        {children}
      </div>
    </div>
  );
};

const SideNav: React.FC<SideNavProps> = ({ isOpen, setIsOpen, isMobile, onNavigate, currentView, userRole, onLogout }) => {
  const { theme, toggleTheme } = useTheme();
  const [expandedGroups] = useState<string[]>(['inventory', 'shipments']); 
  const [hoveredParent, setHoveredParent] = useState<string | null>(null);
  const [flyoutTop, setFlyoutTop] = useState<number>(0);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTop, setSettingsTop] = useState(0);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Derived state
  const isCollapsed = !isOpen && !isMobile;

  // Filter NAV_ITEMS based on user role
  const filteredNavItems = useMemo(() => {
    return NAV_ITEMS.map(item => {
      if (item.children) {
        return {
          ...item,
          children: item.children.filter(child => {
            // Hide 'create-shipment' for Staff users
            if (child.id === 'create-shipment' && userRole.includes('Staff')) {
              return false;
            }
            return true;
          })
        };
      }
      return item;
    });
  }, [userRole]);

  // Close settings on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // If modal is open, prevent closing if click is inside modal or settings button
      if (isSettingsOpen && settingsRef.current && settingsRef.current.contains(event.target as Node)) {
        return; 
      }
      const settingsDropdown = document.getElementById('settings-dropdown-portal');
      if (settingsDropdown && settingsDropdown.contains(event.target as Node)) {
        return;
      }
      setIsSettingsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSettingsOpen]);

  // --- Hover Logic for Flyouts (Collapsed Mode Only) ---
  const handleParentMouseEnter = (id: string, e: React.MouseEvent) => {
    if (!isCollapsed) return;
    
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    
    const rect = e.currentTarget.getBoundingClientRect();
    setFlyoutTop(rect.top);
    setHoveredParent(id);
  };

  const handleParentMouseLeave = () => {
    if (!isCollapsed) return;
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredParent(null);
    }, 150); // Small delay to allow moving mouse to flyout
  };

  const handleFlyoutMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
  };

  const handleSettingsToggle = (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent immediate closing due to document click listener
      if (settingsRef.current) {
          const rect = settingsRef.current.getBoundingClientRect();
          const menuHeight = 180; 
          setSettingsTop(rect.bottom - menuHeight); 
      }
      setIsSettingsOpen(!isSettingsOpen);
  }

  // --- Helper: Check if a group is active ---
  const isGroupActive = (group: NavItemConfig) => {
    if (group.view === currentView) return true;
    if (group.children) {
      return group.children.some(child => child.view === currentView);
    }
    return false;
  };

  const handleSettingClick = (action: string) => {
      if (action === 'Theme') {
        toggleTheme();
        // Keep settings open to see change? Or close. Let's close.
        setIsSettingsOpen(false);
      } else if (action === 'users') {
        onNavigate('users');
        setIsSettingsOpen(false);
      } else {
        // Placeholder for other actions
        setIsSettingsOpen(false);
      }
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-[var(--overlay)] backdrop-blur-sm z-[var(--z-modal-backdrop)] animate-fade-in-fast" 
          onClick={() => setIsOpen(false)} 
        />
      )}

      <aside 
        className={`
          fixed top-0 left-0 h-full z-[var(--z-modal)] bg-[var(--bg-1)] border-r border-[var(--border-1)] transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] flex flex-col overflow-hidden
          ${isOpen ? 'w-[250px] translate-x-0' : 'w-[60px]'}
          ${isMobile && !isOpen ? '-translate-x-full w-[250px]' : ''}
        `}
      >
        {/* Header */}
        <div className="h-[48px] flex items-center justify-between px-4 border-b border-[var(--border-1)] shrink-0 transition-colors">
          <div className={`flex items-center gap-3 overflow-hidden whitespace-nowrap transition-all duration-300 ${isOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
            <div className="w-8 h-8 bg-[#0f62fe] flex items-center justify-center text-white font-bold text-sm shrink-0 animate-fade-in-fast">
              KV
            </div>
            <div className="flex flex-col justify-center">
              <span className="font-bold text-[var(--text-primary)] text-[14px] leading-none">FBA Manager</span>
              <span className="text-[var(--text-tertiary)] text-[10px] leading-none mt-[3px] font-medium tracking-wide">{userRole}</span>
            </div>
          </div>

          {!isMobile && (
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="p-1 hover:bg-[var(--bg-2)] text-[var(--text-secondary)] mx-auto md:mx-0 transition-transform duration-300 active:scale-90"
            >
              {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
          )}
           {isMobile && (
             <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-[var(--bg-2)] text-[var(--text-secondary)]">
                 <ChevronLeft size={16} />
             </button>
          )}
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-4">
          {filteredNavItems.map((item, index) => {
             const isActive = isGroupActive(item);
             const showChildrenVisually = isOpen; 
             const Icon = item.icon;

             return (
               <div key={item.id} className="mb-2 animate-slide-in-right" style={{ animationDelay: `${index * 50}ms` }}>
                 {/* Parent Item */}
                 <button
                    onClick={() => {
                        if (item.view) { 
                            onNavigate(item.view);
                            setHoveredParent(null); 
                        }
                    }}
                    onMouseEnter={(e) => item.children && item.children.length > 0 ? handleParentMouseEnter(item.id, e) : undefined}
                    onMouseLeave={item.children && item.children.length > 0 ? handleParentMouseLeave : undefined}
                    className={`
                      w-full flex items-center h-[48px] px-4 transition-all duration-200 relative group
                      ${isActive ? 'border-l-4 border-[#0f62fe] bg-[var(--bg-2)]' : 'border-l-4 border-transparent hover:bg-[var(--bg-2)] hover:pl-5'}
                      ${isCollapsed ? 'justify-center px-0 hover:pl-0' : ''}
                    `}
                    title={isCollapsed ? item.label : ''}
                 >
                    <Icon 
                      size={20} 
                      className={`shrink-0 transition-colors duration-200 ${isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`} 
                    />
                    
                    {/* Label (Expanded Mode) */}
                    <span className={`ml-3 whitespace-nowrap transition-all duration-200 ${isOpen ? 'opacity-100 translate-x-0 text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]' : 'opacity-0 -translate-x-4 w-0 overflow-hidden absolute'}`}>
                      {item.label}
                    </span>
                 </button>

                 {/* Children (Always Visible in Expanded Mode; Hidden by default in Collapsed Mode, shown in Flyout) */}
                 {item.children && item.children.length > 0 && (
                   <div 
                        className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.2,0,0.38,0.9)]
                            ${showChildrenVisually ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}
                        `}
                   >
                      {item.children.map((child, childIdx) => {
                        const isChildActive = child.view === currentView;
                        const ChildIcon = child.icon;
                        return (
                          <button
                            key={child.id}
                            onClick={() => onNavigate(child.view!)}
                            className={`
                              w-full flex items-center h-[40px] pl-12 pr-4 transition-all duration-200
                              ${isChildActive ? 'text-[var(--text-primary)] bg-[var(--bg-2)] font-medium translate-x-1' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] hover:pl-14'}
                            `}
                            style={{ transitionDelay: `${childIdx * 30}ms` }}
                          >
                             <ChildIcon size={16} className={`mr-3 ${child.isAction ? 'text-[#0f62fe]' : ''}`} />
                             <span className="text-[14px]">{child.label}</span>
                          </button>
                        );
                      })}
                   </div>
                 )}
               </div>
             );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--border-1)] shrink-0 bg-[var(--bg-1)] animate-fade-in-fast transition-colors">
           {/* SideNav Credits Mention (Expanded Only) */}
           {isOpen && (
             <div className="px-4 py-3 text-[11px] text-[var(--text-tertiary)] border-b border-[var(--border-1)] transition-opacity duration-300">
               <div className="flex items-center gap-1.5 opacity-60">
                 <Code size={12} />
                 <span>By GM & Rajab</span>
               </div>
             </div>
           )}

           <div className="relative" ref={settingsRef}>
              <button 
                onClick={handleSettingsToggle}
                className={`w-full flex items-center h-[48px] px-4 hover:bg-[var(--bg-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-200 ${isCollapsed ? 'justify-center px-0' : ''}`}
                title={isCollapsed ? "Settings" : ""}
              >
                 <Settings size={20} className="shrink-0 group-hover:rotate-45 transition-transform duration-300" />
                 <span className={`ml-3 whitespace-nowrap transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                    Settings
                 </span>
              </button>
           </div>
           
           <button 
              onClick={onLogout}
              className={`w-full flex items-center h-[48px] px-4 hover:bg-[var(--bg-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-200 ${isCollapsed ? 'justify-center px-0' : ''}`}
              title={isCollapsed ? "Log Out" : ""}
           >
              <LogOut size={20} className="shrink-0" />
              <span className={`ml-3 whitespace-nowrap transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                Log Out
              </span>
           </button>
        </div>
      </aside>

      {/* PORTALS for Flyouts & Menus (Outside overflow-hidden container) */}
      
      {/* Navigation Flyout (Collapsed Mode) */}
      {isCollapsed && hoveredParent && filteredNavItems.find(i => i.id === hoveredParent)?.children?.length && (
         <Portal>
            <Flyout 
              title={filteredNavItems.find(i => i.id === hoveredParent)?.label || ''} 
              top={flyoutTop} 
              onMouseEnter={handleFlyoutMouseEnter}
              onMouseLeave={handleParentMouseLeave}
            >
               {filteredNavItems.find(i => i.id === hoveredParent)?.children?.map((child, idx) => {
                 const isChildActive = child.view === currentView;
                 const ChildIcon = child.icon;
                 return (
                    <button
                      key={child.id}
                      onClick={() => {
                        onNavigate(child.view!);
                        setHoveredParent(null);
                      }}
                      className={`
                        w-full text-left px-4 py-2.5 text-[14px] flex items-center gap-2 transition-all duration-200
                        ${isChildActive ? 'bg-[var(--bg-2)] text-[var(--text-primary)] border-l-4 border-[#0f62fe]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] border-l-4 border-transparent hover:pl-5'}
                        opacity-0 animate-slide-in-right
                      `}
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                       <ChildIcon size={16} className={`mr-3 ${child.isAction ? 'text-[#0f62fe]' : ''}`} />
                       <span className="text-[14px]">{child.label}</span>
                    </button>
                 )
               })}
            </Flyout>
         </Portal>
      )}

      {/* Settings Dropdown */}
      {isSettingsOpen && (
        <Portal>
          <div 
            className="fixed inset-0 z-[calc(var(--z-dropdown) - 1)]" 
            onClick={() => setIsSettingsOpen(false)} 
          />
          
          <div 
            id="settings-dropdown-portal" // Add ID for click outside logic
            className="fixed z-[var(--z-dropdown)] w-[200px] bg-[var(--bg-1)] border border-[var(--border-1)] shadow-xl animate-slide-up origin-bottom duration-200"
            style={{ 
               left: isOpen ? '250px' : '60px', 
               top: `${settingsTop}px` 
            }}
          >
              <div 
                  className="px-4 py-3 text-[var(--text-primary)] hover:bg-[var(--bg-2)] text-sm cursor-pointer border-b border-[var(--border-1)] transition-colors hover:pl-5 duration-200"
                  onClick={() => handleSettingClick('users')}
              >
                  Users
              </div>
              
              {/* Configuration Placeholder */}
              <div className="px-4 py-3 text-[var(--text-primary)] hover:bg-[var(--bg-2)] text-sm cursor-pointer border-b border-[var(--border-1)] transition-colors hover:pl-5 duration-200">
                  Configuration
              </div>
              
              {/* Theme Toggle */}
              <div 
                 className="px-4 py-3 text-[var(--text-primary)] hover:bg-[var(--bg-2)] text-sm cursor-pointer border-b border-[var(--border-1)] transition-colors hover:pl-5 duration-200 flex items-center justify-between"
                 onClick={() => handleSettingClick('Theme')}
              >
                 <span>Toggle Theme</span>
                 <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                    {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
                    <span className="text-[10px] uppercase">{theme}</span>
                 </div>
              </div>

               <div className="px-4 py-3 text-[var(--text-primary)] hover:bg-[var(--bg-2)] text-sm cursor-pointer border-b border-[var(--border-1)] last:border-0 transition-colors hover:pl-5 duration-200">
                  Switch Account
               </div>
          </div>
        </Portal>
      )}
    </>
  );
};

export default SideNav;