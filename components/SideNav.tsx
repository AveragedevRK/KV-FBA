import React, { useState, useEffect, useRef } from 'react';
import { Portal } from '../App'; // Import Portal from App.tsx
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
  PieChart
} from 'lucide-react';

interface SideNavProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isMobile: boolean;
  onNavigate: (view: string) => void;
  currentView: string;
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
      className="fixed left-[60px] z-[var(--z-dropdown)] w-[220px] bg-[#262626] border border-[#393939] shadow-2xl animate-slide-in-right origin-left"
      style={{ top: `${top}px` }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="px-4 py-3 border-b border-[#393939] text-[11px] font-bold text-[#8d8d8d] tracking-wider uppercase bg-[#262626]">
        {title}
      </div>
      <div className="py-1 bg-[#262626]">
        {children}
      </div>
    </div>
  );
};

const SideNav: React.FC<SideNavProps> = ({ isOpen, setIsOpen, isMobile, onNavigate, currentView }) => {
  // In expanded mode, groups are always conceptually expanded, so `expandedGroups` is only relevant for collapsed mode flyouts.
  const [expandedGroups] = useState<string[]>(['inventory', 'shipments']); // This state is now mostly for the initial render logic of flyouts
  const [hoveredParent, setHoveredParent] = useState<string | null>(null);
  const [flyoutTop, setFlyoutTop] = useState<number>(0);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTop, setSettingsTop] = useState(0);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Derived state
  const isCollapsed = !isOpen && !isMobile;

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
          // Approximate height of the settings menu based on its content:
          // 4 items * ~40px height per item + top/bottom padding = 160 + 20 = ~180px
          const menuHeight = 180; 
          // Position top of menu such that its bottom aligns with the button's bottom, minus a small offset
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

  const handleSettingClick = (view: string) => {
      onNavigate(view);
      setIsSettingsOpen(false);
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[var(--z-modal-backdrop)] animate-fade-in-fast" 
          onClick={() => setIsOpen(false)} 
        />
      )}

      <aside 
        className={`
          fixed top-0 left-0 h-full z-[var(--z-modal)] bg-[#262626] border-r border-[#393939] transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] flex flex-col overflow-hidden
          ${isOpen ? 'w-[250px] translate-x-0' : 'w-[60px]'}
          ${isMobile && !isOpen ? '-translate-x-full w-[250px]' : ''}
        `}
      >
        {/* Header */}
        <div className="h-[48px] flex items-center justify-between px-4 border-b border-[#393939] shrink-0">
          <div className={`flex items-center gap-3 overflow-hidden whitespace-nowrap transition-all duration-300 ${isOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
            <div className="w-8 h-8 bg-[#0f62fe] flex items-center justify-center text-white font-bold text-sm shrink-0 animate-fade-in-fast">
              KV
            </div>
            <div className="flex flex-col justify-center">
              <span className="font-bold text-[#f4f4f4] text-[14px] leading-none">Inventory</span>
              <span className="text-[#8d8d8d] text-[10px] leading-none mt-[3px] font-medium tracking-wide">(Admin)</span>
            </div>
          </div>

          {!isMobile && (
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="p-1 hover:bg-[#393939] text-[#c6c6c6] mx-auto md:mx-0 transition-transform duration-300 active:scale-90"
            >
              {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
          )}
           {isMobile && (
             <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-[#393939] text-[#c6c6c6]">
                 <ChevronLeft size={16} />
             </button>
          )}
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-4">
          {NAV_ITEMS.map((item, index) => {
             const isActive = isGroupActive(item);
             // Children are always visually expanded in expanded mode
             // The expandedGroups state is primarily for *collapsed* mode flyout logic, not direct rendering.
             // If isOpen, children are visible. If collapsed, children are hidden unless in flyout.
             const showChildrenVisually = isOpen; 
             const Icon = item.icon;

             return (
               <div key={item.id} className="mb-2 animate-slide-in-right" style={{ animationDelay: `${index * 50}ms` }}>
                 {/* Parent Item */}
                 <button
                    onClick={() => {
                        if (item.view) { // If it's a navigatable item (parent or child)
                            onNavigate(item.view);
                            setHoveredParent(null); // Close any open flyout if navigating
                        }
                        // If it's a parent without a view (just a section header), do nothing on click in expanded mode.
                        // Hover for flyout in collapsed mode is separate.
                    }}
                    onMouseEnter={(e) => item.children && item.children.length > 0 ? handleParentMouseEnter(item.id, e) : undefined}
                    onMouseLeave={item.children && item.children.length > 0 ? handleParentMouseLeave : undefined}
                    className={`
                      w-full flex items-center h-[48px] px-4 transition-all duration-200 relative group
                      ${isActive ? 'border-l-4 border-[#0f62fe] bg-[#393939]' : 'border-l-4 border-transparent hover:bg-[#393939] hover:pl-5'}
                      ${isCollapsed ? 'justify-center px-0 hover:pl-0' : ''}
                    `}
                    title={isCollapsed ? item.label : ''}
                 >
                    <Icon 
                      size={20} 
                      className={`shrink-0 transition-colors duration-200 ${isActive ? 'text-[#f4f4f4]' : 'text-[#c6c6c6] group-hover:text-[#f4f4f4]'}`} 
                    />
                    
                    {/* Label (Expanded Mode) */}
                    <span className={`ml-3 whitespace-nowrap transition-all duration-200 ${isOpen ? 'opacity-100 translate-x-0 text-[#c6c6c6] group-hover:text-[#f4f4f4]' : 'opacity-0 -translate-x-4 w-0 overflow-hidden absolute'}`}>
                      {item.label}
                    </span>

                    {/* Removed Chevron: Parents are not collapsible in expanded mode, and flyouts handle their own chevrons if any */}
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
                              ${isChildActive ? 'text-[#f4f4f4] bg-[#393939] font-medium translate-x-1' : 'text-[#c6c6c6] hover:text-[#f4f4f4] hover:bg-[#353535] hover:pl-14'}
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
        <div className="border-t border-[#393939] shrink-0 bg-[#262626] animate-fade-in-fast">
           <div className="relative" ref={settingsRef}>
              <button 
                onClick={handleSettingsToggle}
                className={`w-full flex items-center h-[48px] px-4 hover:bg-[#393939] text-[#c6c6c6] hover:text-[#f4f4f4] transition-colors duration-200 ${isCollapsed ? 'justify-center px-0' : ''}`}
                title={isCollapsed ? "Settings" : ""}
              >
                 <Settings size={20} className="shrink-0 group-hover:rotate-45 transition-transform duration-300" />
                 <span className={`ml-3 whitespace-nowrap transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                    Settings
                 </span>
              </button>
           </div>
           
           <button 
              onClick={() => alert("Logged out")}
              className={`w-full flex items-center h-[48px] px-4 hover:bg-[#393939] text-[#c6c6c6] hover:text-[#f4f4f4] transition-colors duration-200 ${isCollapsed ? 'justify-center px-0' : ''}`}
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
      {isCollapsed && hoveredParent && NAV_ITEMS.find(i => i.id === hoveredParent)?.children?.length && (
         <Portal>
            <Flyout 
              title={NAV_ITEMS.find(i => i.id === hoveredParent)?.label || ''} 
              top={flyoutTop} 
              onMouseEnter={handleFlyoutMouseEnter}
              onMouseLeave={handleParentMouseLeave}
            >
               {NAV_ITEMS.find(i => i.id === hoveredParent)?.children?.map((child, idx) => {
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
                        ${isChildActive ? 'bg-[#393939] text-[#f4f4f4] border-l-4 border-[#0f62fe]' : 'text-[#c6c6c6] hover:bg-[#353535] hover:text-[#f4f4f4] border-l-4 border-transparent hover:pl-5'}
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
          {/* Backdrop to handle outside clicks better for Portals */}
          {/* Backdrop with a lower z-index than the menu itself */}
          <div 
            className="fixed inset-0 z-[calc(var(--z-dropdown) - 1)]" 
            onClick={() => setIsSettingsOpen(false)} 
          />
          
          <div 
            id="settings-dropdown-portal" // Add ID for click outside logic
            className="fixed z-[var(--z-dropdown)] w-[200px] bg-[#262626] border border-[#393939] shadow-xl animate-slide-up origin-bottom duration-200"
            style={{ 
               left: isOpen ? '250px' : '60px', 
               top: `${settingsTop}px` 
            }}
          >
              <div 
                  className="px-4 py-3 text-[#f4f4f4] hover:bg-[#393939] text-sm cursor-pointer border-b border-[#393939] transition-colors hover:pl-5 duration-200"
                  onClick={() => handleSettingClick('users')}
              >
                  Users
              </div>
              {['Configuration', 'Request Permissions', 'Switch Account', 'Theme'].map((item, idx) => (
                 <div 
                    key={item}
                    className="px-4 py-3 text-[#f4f4f4] hover:bg-[#393939] text-sm cursor-pointer border-b border-[#393939] last:border-0 transition-colors hover:pl-5 duration-200"
                 >
                    {item}
                 </div>
              ))}
          </div>
        </Portal>
      )}
    </>
  );
};

export default SideNav;