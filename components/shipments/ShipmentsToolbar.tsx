import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter, ChevronDown, FileText, Truck, CheckCircle2, XCircle, RotateCcw, Loader2 } from 'lucide-react';
import { ShipmentStatus } from '../../types';
import { Portal } from '../../App';

interface ShipmentsToolbarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusChange: (val: string) => void;
  onOpenFilters: () => void;
  filtersActive: boolean;
  onRefresh: () => void;
  isLoading: boolean;
  isSticky?: boolean;
}

const ShipmentsToolbar: React.FC<ShipmentsToolbarProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  onOpenFilters,
  filtersActive,
  onRefresh,
  isLoading,
  isSticky = false,
}) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLButtonElement>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is outside both button and portal menu
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        dropdownMenuRef.current &&
        !dropdownMenuRef.current.contains(event.target as Node)
      ) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getStatusIcon = (status: string) => {
    switch(status as ShipmentStatus) {
        case 'Draft': return <FileText size={14} />;
        case 'In Progress': return <div className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />;
        case 'Shipped': return <Truck size={14} />;
        case 'Delivered': return <CheckCircle2 size={14} />;
        case 'Cancelled': return <XCircle size={14} />;
        default: return null;
    }
  }

  return (
    <div className={`transition-all duration-300 ${isSticky ? 'pb-0' : 'pb-4'} shrink-0`}>
      <div className={`
        flex flex-col lg:flex-row lg:items-center gap-3 transition-all duration-300 ease-in-out
        ${isSticky 
            ? 'bg-transparent p-0 min-h-[48px]' 
            : 'bg-[var(--bg-1)] border border-[var(--border-1)] rounded-lg p-2 min-h-[56px] shadow-sm'}
      `}>
        
        {/* Divider */}
        <div className={`hidden lg:block w-[1px] h-[32px] bg-[var(--border-1)] transition-opacity duration-300 ${isSticky ? 'opacity-0 w-0' : 'opacity-100'}`}></div>

          {/* Global Search */}
          <div className="relative flex-1 min-w-full lg:min-w-[240px] animate-fade-in-fast">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] w-4 h-4 transition-colors peer-focus:text-[var(--text-primary)]" />
            <input
              type="text"
              placeholder="Search by name, ID, destination..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="peer w-full h-[40px] bg-[var(--bg-2)] border border-[var(--border-1)] rounded-md text-[var(--text-primary)] pl-10 pr-4 text-[14px] focus:outline-none focus:border-[#0f62fe] focus:ring-1 focus:ring-[#0f62fe]/20 placeholder-[var(--text-tertiary)] transition-all duration-200"
            />
          </div>

          {/* Filters Group */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 no-scrollbar animate-fade-in-fast flex-nowrap" style={{ animationDelay: '50ms' }}>
            
            {/* Status Dropdown */}
            <button 
                ref={dropdownRef}
                onClick={() => setActiveDropdown(activeDropdown === 'status' ? null : 'status')}
                className={`shrink-0 h-[40px] px-4 bg-[var(--bg-2)] border border-[var(--border-1)] rounded-md hover:bg-[var(--bg-hover)] hover:border-[var(--border-2)] text-[var(--text-primary)] text-[14px] flex items-center gap-2 whitespace-nowrap transition-all duration-200 ${activeDropdown === 'status' ? 'bg-[var(--bg-hover)] border-[var(--border-2)]' : ''}`}
            >
                {statusFilter === 'All Statuses' ? 'Status' : statusFilter}
                <ChevronDown size={14} className={`text-[var(--text-tertiary)] transition-transform duration-300 ${activeDropdown === 'status' ? 'rotate-180' : ''}`} />
            </button>
              
            {activeDropdown === 'status' && (
                <Portal>
                    <div 
                        ref={dropdownMenuRef}
                        className="absolute w-[200px] bg-[var(--bg-1)] border border-[var(--border-1)] rounded-md shadow-xl z-[var(--z-dropdown)] py-1 animate-drop-down origin-top-left"
                        style={{
                            top: (dropdownRef.current?.getBoundingClientRect().bottom || 0) + window.scrollY + 4,
                            left: (dropdownRef.current?.getBoundingClientRect().left || 0) + window.scrollX,
                        }}
                    >
                        {['All Statuses', 'Draft', 'In Progress', 'Shipped', 'Delivered', 'Cancelled'].map((status, idx) => (
                            <button
                                key={status}
                                onClick={() => {
                                    onStatusChange(status);
                                    setActiveDropdown(null);
                                }}
                                className="w-full text-left px-4 py-2.5 text-[14px] text-[var(--text-secondary)] hover:bg-[var(--bg-2)] hover:text-[var(--text-primary)] flex items-center gap-2.5 transition-colors duration-200"
                                style={{ animationDelay: `${idx * 30}ms` }}
                            >
                                {status !== 'All Statuses' && <span className="text-[var(--text-tertiary)]">{getStatusIcon(status)}</span>}
                                {status}
                            </button>
                        ))}
                    </div>
                </Portal>
            )}

            {/* More Filters Button */}
            <button 
              onClick={onOpenFilters}
              className={`h-[40px] px-4 shrink-0 flex items-center gap-2 bg-[var(--bg-2)] border border-[var(--border-1)] rounded-md hover:bg-[var(--bg-hover)] hover:border-[var(--border-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-200 relative ${filtersActive ? 'text-[var(--text-primary)] border-[var(--border-2)] bg-[var(--bg-hover)]' : ''}`}
            >
              <Filter size={16} />
              <span className="text-[14px]">Filters</span>
              {filtersActive && (
                  <span className="w-2 h-2 rounded-full bg-[#0f62fe] absolute top-2 right-2 animate-pulse"></span>
              )}
            </button>

            {/* Refresh Button */}
            <button 
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className={`h-[40px] w-[40px] shrink-0 flex items-center justify-center bg-[var(--bg-2)] border border-[var(--border-1)] rounded-md hover:bg-[var(--bg-hover)] hover:border-[var(--border-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-200 relative
                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              title="Refresh Shipments"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <RotateCcw size={18} />}
            </button>

          </div>
      </div>
    </div>
  );
};

export default ShipmentsToolbar;