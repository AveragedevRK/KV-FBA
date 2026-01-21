import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter, LayoutList, Grid, ChevronDown, AlertTriangle, RotateCcw, Loader2 } from 'lucide-react';
import { Portal } from '../../App';

interface ItemsToolbarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusChange: (val: string) => void;
  onOpenFilters: () => void;
  filtersActive: boolean;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  viewMode: 'list' | 'card';
  onViewModeChange: (mode: 'list' | 'card') => void;
  onRefresh: () => void;
  isLoading: boolean;
  isSticky?: boolean;
}

const ItemsToolbar: React.FC<ItemsToolbarProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  onOpenFilters,
  filtersActive,
  onClearFilters,
  hasActiveFilters,
  viewMode,
  onViewModeChange,
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
    switch(status) {
        case 'Low Stock': return <AlertTriangle size={12} />;
        default: return null;
    }
  }

  return (
    <div className={`transition-all duration-300 ${isSticky ? 'pb-0' : 'pb-4'} shrink-0`}>
      <div className={`
        flex flex-col lg:flex-row lg:items-center gap-3 transition-all duration-300 ease-in-out
        ${isSticky 
            ? 'bg-transparent p-0 min-h-[48px]' 
            : 'bg-[var(--bg-1)] p-2 min-h-[56px]'}
      `}>
        
        {/* Global Search */}
        <div className="relative flex-1 min-w-full lg:min-w-[200px] animate-fade-in-fast">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] w-4 h-4 transition-colors peer-focus:text-[var(--text-primary)]" />
          <input
            type="text"
            placeholder="Search by name, SKU, tag, supplier..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="peer w-full h-[40px] bg-[var(--bg-2)] text-[var(--text-primary)] pl-10 pr-4 text-[14px] focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)] placeholder-[var(--text-tertiary)] transition-all duration-200"
          />
        </div>

        {/* Actions Row - Horizontal Scroll on Mobile */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 no-scrollbar animate-fade-in-fast" style={{ animationDelay: '100ms' }}>
          
          {/* Status Quick Filter */}
          <button 
            ref={dropdownRef}
            onClick={() => setActiveDropdown(activeDropdown === 'status' ? null : 'status')}
            className={`shrink-0 h-[40px] px-4 bg-[var(--bg-2)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] text-[14px] flex items-center gap-2 whitespace-nowrap transition-colors duration-200 ${activeDropdown === 'status' ? 'bg-[var(--bg-hover)]' : ''}`}
          >
            {statusFilter === 'All Statuses' ? 'Status' : statusFilter}
            <ChevronDown size={14} className={`transition-transform duration-300 ${activeDropdown === 'status' ? 'rotate-180' : ''}`} />
          </button>
          
          {activeDropdown === 'status' && (
            <Portal>
                <div 
                    ref={dropdownMenuRef}
                    className="absolute w-[180px] bg-[var(--bg-1)] border border-[var(--border-1)] shadow-xl z-[var(--z-dropdown)] py-1 animate-drop-down origin-top"
                    style={{
                        top: (dropdownRef.current?.getBoundingClientRect().bottom || 0) + window.scrollY + 4,
                        left: (dropdownRef.current?.getBoundingClientRect().left || 0) + window.scrollX,
                    }}
                >
                    {['All Statuses', 'In Stock', 'Low Stock', 'Out of Stock', 'Discontinued'].map((status, idx) => (
                        <button
                            key={status}
                            onClick={() => {
                                onStatusChange(status);
                                setActiveDropdown(null);
                            }}
                            className="w-full text-left px-4 py-2 text-[14px] text-[var(--text-secondary)] hover:bg-[var(--bg-2)] hover:text-[var(--text-primary)] flex items-center gap-2 transition-colors duration-200 hover:pl-5"
                            style={{ animationDelay: `${idx * 30}ms` }}
                        >
                            {status !== 'All Statuses' && getStatusIcon(status)}
                            {status}
                        </button>
                    ))}
                </div>
            </Portal>
          )}

          {/* Filters Button */}
          <button 
            onClick={onOpenFilters}
            className="h-[40px] w-[40px] shrink-0 flex items-center justify-center bg-[var(--bg-2)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] transition-all duration-200 hover:scale-105 active:scale-95 relative"
            title="Filters"
          >
            <Filter size={18} />
            {filtersActive && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-[#0f62fe] animate-pulse"></div>
            )}
          </button>

          {/* View Toggle */}
          <div className="flex bg-[var(--bg-2)] p-1 h-[40px] items-center gap-1 shrink-0">
              <button 
                onClick={() => onViewModeChange('list')}
                className={`p-1.5 transition-all duration-200 ${viewMode === 'list' ? 'bg-[var(--bg-hover)] text-[var(--text-primary)] shadow-sm scale-105' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                title="List View"
              >
                <LayoutList size={16} />
              </button>
              <button 
                onClick={() => onViewModeChange('card')}
                className={`p-1.5 transition-all duration-200 ${viewMode === 'card' ? 'bg-[var(--bg-hover)] text-[var(--text-primary)] shadow-sm scale-105' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                title="Card View"
              >
                <Grid size={16} />
              </button>
          </div>

          {/* Refresh Button */}
          <button 
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className={`h-[40px] w-[40px] shrink-0 flex items-center justify-center bg-[var(--bg-2)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] transition-all duration-200 hover:scale-105 active:scale-95 relative
              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            title="Refresh"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <RotateCcw size={18} />}
          </button>

        </div>
      </div>
      
      {/* Active Filters Chips */}
      {hasActiveFilters && (
          <div className={`flex flex-wrap gap-2 animate-slide-up-fade ${isSticky ? 'mt-0' : 'mt-3'}`}>
              {statusFilter !== 'All Statuses' && (
                  <div className="h-[24px] px-2 bg-[var(--bg-2)] text-[var(--text-secondary)] text-[12px] flex items-center gap-1 hover:bg-[var(--bg-hover)] transition-colors cursor-default">
                      Status: {statusFilter}
                      <button onClick={() => onStatusChange('All Statuses')} className="hover:text-[var(--text-primary)]">X</button>
                  </div>
              )}
               {filtersActive && (
                   <div className="h-[24px] px-2 bg-[var(--bg-2)] text-[var(--text-secondary)] text-[12px] flex items-center gap-1 hover:bg-[var(--bg-hover)] transition-colors cursor-default">
                       Advanced Filters Active
                       <button onClick={onClearFilters} className="hover:text-[var(--text-primary)]">X</button>
                   </div>
               )}
               <button onClick={onClearFilters} className="text-[12px] text-[#0f62fe] blue-text-readable hover:underline transition-colors">Clear all</button>
          </div>
      )}
    </div>
  );
};

export default ItemsToolbar;