import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter, LayoutList, Grid, ChevronDown, AlertTriangle } from 'lucide-react';

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
  onViewModeChange
}) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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
    <div className="px-4 md:px-6 pb-4 shrink-0">
      <div className="bg-[#262626] p-2 flex flex-col lg:flex-row lg:items-center gap-3 h-auto lg:h-[56px] transition-all duration-300 ease-in-out">
        
        {/* Global Search */}
        <div className="relative flex-1 min-w-full lg:min-w-[200px] animate-fade-in-fast">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c6c6c6] w-4 h-4 transition-colors peer-focus:text-[#f4f4f4]" />
          <input
            type="text"
            placeholder="Search by name, SKU, tag, supplier..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="peer w-full h-[40px] bg-[#393939] text-[#f4f4f4] pl-10 pr-4 text-[14px] focus:outline-none focus:ring-1 focus:ring-[#f4f4f4] placeholder-[#8d8d8d] transition-all duration-200"
          />
        </div>

        {/* Actions Row - Horizontal Scroll on Mobile */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 no-scrollbar animate-fade-in-fast" style={{ animationDelay: '100ms' }}>
          
          {/* Status Quick Filter */}
          <div className="relative shrink-0" ref={dropdownRef}>
            <button 
              onClick={() => setActiveDropdown(activeDropdown === 'status' ? null : 'status')}
              className={`h-[40px] px-4 bg-[#393939] hover:bg-[#4c4c4c] text-[#f4f4f4] text-[14px] flex items-center gap-2 whitespace-nowrap transition-colors duration-200 ${activeDropdown === 'status' ? 'bg-[#4c4c4c]' : ''}`}
            >
              {statusFilter === 'All Statuses' ? 'Status' : statusFilter}
              <ChevronDown size={14} className={`transition-transform duration-300 ${activeDropdown === 'status' ? 'rotate-180' : ''}`} />
            </button>
            
            {activeDropdown === 'status' && (
              <div className="absolute top-full mt-1 left-0 w-[180px] bg-[#262626] border border-[#393939] shadow-xl z-[var(--z-dropdown)] py-1 animate-drop-down origin-top">
                {['All Statuses', 'In Stock', 'Low Stock', 'Out of Stock', 'Discontinued'].map((status, idx) => (
                    <button
                      key={status}
                      onClick={() => {
                          onStatusChange(status);
                          setActiveDropdown(null);
                      }}
                      className="w-full text-left px-4 py-2 text-[14px] text-[#c6c6c6] hover:bg-[#393939] hover:text-[#f4f4f4] flex items-center gap-2 transition-colors duration-200 hover:pl-5"
                      style={{ animationDelay: `${idx * 30}ms` }}
                    >
                        {status !== 'All Statuses' && getStatusIcon(status)}
                        {status}
                    </button>
                ))}
              </div>
            )}
          </div>

          {/* Filters Button */}
          <button 
            onClick={onOpenFilters}
            className="h-[40px] w-[40px] shrink-0 flex items-center justify-center bg-[#393939] hover:bg-[#4c4c4c] text-[#f4f4f4] transition-all duration-200 hover:scale-105 active:scale-95 relative"
            title="Filters"
          >
            <Filter size={18} />
            {filtersActive && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-[#0f62fe] animate-pulse"></div>
            )}
          </button>

          {/* View Toggle */}
          <div className="flex bg-[#393939] p-1 h-[40px] items-center gap-1 shrink-0">
              <button 
                onClick={() => onViewModeChange('list')}
                className={`p-1.5 transition-all duration-200 ${viewMode === 'list' ? 'bg-[#4c4c4c] text-[#f4f4f4] shadow-sm scale-105' : 'text-[#c6c6c6] hover:text-[#f4f4f4]'}`}
                title="List View"
              >
                <LayoutList size={16} />
              </button>
              <button 
                onClick={() => onViewModeChange('card')}
                className={`p-1.5 transition-all duration-200 ${viewMode === 'card' ? 'bg-[#4c4c4c] text-[#f4f4f4] shadow-sm scale-105' : 'text-[#c6c6c6] hover:text-[#f4f4f4]'}`}
                title="Card View"
              >
                <Grid size={16} />
              </button>
          </div>
        </div>
      </div>
      
      {/* Active Filters Chips */}
      {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-3 animate-slide-up-fade">
              {statusFilter !== 'All Statuses' && (
                  <div className="h-[24px] px-2 bg-[#393939] text-[#c6c6c6] text-[12px] flex items-center gap-1 hover:bg-[#4c4c4c] transition-colors cursor-default">
                      Status: {statusFilter}
                      <button onClick={() => onStatusChange('All Statuses')} className="hover:text-white">X</button>
                  </div>
              )}
               {filtersActive && (
                   <div className="h-[24px] px-2 bg-[#393939] text-[#c6c6c6] text-[12px] flex items-center gap-1 hover:bg-[#4c4c4c] transition-colors cursor-default">
                       Advanced Filters Active
                       <button onClick={onClearFilters} className="hover:text-white">X</button>
                   </div>
               )}
               <button onClick={onClearFilters} className="text-[12px] text-[#0f62fe] blue-text-readable hover:underline transition-colors">Clear all</button>
          </div>
      )}
    </div>
  );
};

export default ItemsToolbar;