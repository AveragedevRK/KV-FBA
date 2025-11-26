import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter, ChevronDown, FileText, Truck, CheckCircle2, XCircle } from 'lucide-react';
import { ShipmentStatus } from '../../types';

interface ShipmentsToolbarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusChange: (val: string) => void;
  onOpenFilters: () => void;
  filtersActive: boolean;
}

const ShipmentsToolbar: React.FC<ShipmentsToolbarProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  onOpenFilters,
  filtersActive,
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
    <div className="pb-4 shrink-0">
      <div className="bg-[#212121] border border-[#393939] rounded-lg p-2 flex flex-col lg:flex-row lg:items-center gap-3 min-h-[56px] transition-all duration-300 shadow-sm">
        
        {/* Divider */}
        <div className="hidden lg:block w-[1px] h-[32px] bg-[#393939]"></div>

          {/* Global Search */}
          <div className="relative flex-1 min-w-full lg:min-w-[240px] animate-fade-in-fast">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8d8d8d] w-4 h-4 transition-colors peer-focus:text-[#f4f4f4]" />
            <input
              type="text"
              placeholder="Search by name, ID, destination..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="peer w-full h-[40px] bg-[#2a2a2a] border border-[#393939] rounded-md text-[#f4f4f4] pl-10 pr-4 text-[14px] focus:outline-none focus:border-[#0f62fe] focus:ring-1 focus:ring-[#0f62fe]/20 placeholder-[#757575] transition-all duration-200"
            />
          </div>

          {/* Filters Group */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 no-scrollbar animate-fade-in-fast flex-nowrap" style={{ animationDelay: '50ms' }}>
            
            {/* Status Dropdown */}
            <div className="relative shrink-0" ref={dropdownRef}>
              <button 
                onClick={() => setActiveDropdown(activeDropdown === 'status' ? null : 'status')}
                className={`h-[40px] px-4 bg-[#2a2a2a] border border-[#393939] rounded-md hover:bg-[#333] hover:border-[#8d8d8d] text-[#f4f4f4] text-[14px] flex items-center gap-2 whitespace-nowrap transition-all duration-200 ${activeDropdown === 'status' ? 'bg-[#333] border-[#8d8d8d]' : ''}`}
              >
                {statusFilter === 'All Statuses' ? 'Status' : statusFilter}
                <ChevronDown size={14} className={`text-[#8d8d8d] transition-transform duration-300 ${activeDropdown === 'status' ? 'rotate-180' : ''}`} />
              </button>
              
              {activeDropdown === 'status' && (
                <div className="absolute top-full mt-2 left-0 w-[200px] bg-[#262626] border border-[#393939] rounded-md shadow-xl z-[var(--z-dropdown)] py-1 animate-drop-down origin-top-left">
                  {['All Statuses', 'Draft', 'In Progress', 'Shipped', 'Delivered', 'Cancelled'].map((status, idx) => (
                      <button
                        key={status}
                        onClick={() => {
                            onStatusChange(status);
                            setActiveDropdown(null);
                        }}
                        className="w-full text-left px-4 py-2.5 text-[14px] text-[#c6c6c6] hover:bg-[#333] hover:text-[#f4f4f4] flex items-center gap-2.5 transition-colors duration-200"
                        style={{ animationDelay: `${idx * 30}ms` }}
                      >
                          {status !== 'All Statuses' && <span className="text-[#8d8d8d]">{getStatusIcon(status)}</span>}
                          {status}
                      </button>
                  ))}
                </div>
              )}
            </div>

            {/* More Filters Button */}
            <button 
              onClick={onOpenFilters}
              className={`h-[40px] px-4 shrink-0 flex items-center gap-2 bg-[#2a2a2a] border border-[#393939] rounded-md hover:bg-[#333] hover:border-[#8d8d8d] text-[#c6c6c6] hover:text-[#f4f4f4] transition-all duration-200 relative ${filtersActive ? 'text-[#f4f4f4] border-[#8d8d8d] bg-[#333]' : ''}`}
            >
              <Filter size={16} />
              <span className="text-[14px]">Filters</span>
              {filtersActive && (
                  <span className="w-2 h-2 rounded-full bg-[#0f62fe] absolute top-2 right-2 animate-pulse"></span>
              )}
            </button>
          </div>
      </div>
    </div>
  );
};

export default ShipmentsToolbar;