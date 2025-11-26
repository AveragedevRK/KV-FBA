
import React, { useState, useRef, useEffect } from 'react';
import { Portal } from '../../App'; // Import Portal
import { Shipment, ShipmentStatus } from '../../types';
import { SortConfig } from '../../hooks/useShipments';
import { 
  MoreVertical, Package, ArrowDown, ArrowUp, 
  MapPin, Truck, Calendar, FileText, CheckCircle2, XCircle, Box, Eye
} from 'lucide-react';

interface ShipmentsTableProps {
  shipments: Shipment[];
  sortConfig: SortConfig;
  onSort: (key: keyof Shipment) => void;
  onClearFilters: () => void;
  onPackShipment?: (shipment: Shipment) => void;
  onViewDetails: (shipment: Shipment) => void; // Added for viewing details
}

const ShipmentsTable: React.FC<ShipmentsTableProps> = ({
  shipments,
  sortConfig,
  onSort,
  onClearFilters,
  onPackShipment,
  onViewDetails
}) => {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map()); // Store refs for each button

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getStatusBadge = (status: ShipmentStatus) => {
    const baseClasses = "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-medium border";
    switch (status) {
      case 'Draft': 
        return <span className={`${baseClasses} bg-[#393939] text-[#c6c6c6] border-[#525252]`}><FileText size={12} /> Draft</span>;
      case 'In Progress': 
        return <span className={`${baseClasses} bg-[#0043ce]/20 text-[#a6c8ff] border-[#0043ce]/40`}><div className="w-2 h-2 rounded-full border-2 border-current border-t-transparent animate-spin"/> In Progress</span>;
      case 'Shipped': 
        return <span className={`${baseClasses} bg-[#005d5d]/20 text-[#08bdba] border-[#005d5d]/40`}><Truck size={12} /> Shipped</span>;
      case 'Delivered': 
        return <span className={`${baseClasses} bg-[#24a148]/20 text-[#42be65] border-[#24a148]/40`}><CheckCircle2 size={12} /> Delivered</span>;
      case 'Cancelled': 
        return <span className={`${baseClasses} bg-[#da1e28]/20 text-[#ff8389] border-[#da1e28]/40`}><XCircle size={12} /> Cancelled</span>;
      default: 
        return <span className={`${baseClasses} bg-[#393939] text-[#c6c6c6]`}>{status}</span>;
    }
  };

  const SortIcon = ({ columnKey }: { columnKey: keyof Shipment }) => {
    if (sortConfig.key !== columnKey) return <ArrowDown size={14} className="opacity-0 group-hover:opacity-40 transition-opacity duration-300 ml-1" />;
    return sortConfig.direction === 'asc' 
       ? <ArrowDown size={14} className="text-[#f4f4f4] transition-transform duration-300 ml-1" /> 
       : <ArrowUp size={14} className="text-[#f4f4f4] transition-transform duration-300 ml-1" />;
  };

  // Helper to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleMenuClick = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setActiveMenuId(activeMenuId === id ? null : id);
  }

  // If empty state
  if (shipments.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 bg-[#212121] border border-[#393939] rounded-lg shadow-sm animate-fade-in-fast">
            <div className="w-16 h-16 bg-[#2a2a2a] rounded-full flex items-center justify-center mb-4 border border-[#333]">
                <Package size={28} className="text-[#525252]" />
            </div>
            <h3 className="text-[16px] font-semibold text-[#f4f4f4] mb-1">No shipments found</h3>
            <p className="text-[14px] text-[#8d8d8d] mb-6">Try adjusting your search or filters.</p>
            <button onClick={onClearFilters} className="text-[#0f62fe] blue-text-readable text-[14px] font-medium hover:underline">
                Clear all filters
            </button>
        </div>
      );
  }

  return (
    <div className="flex-1 min-h-0 overflow-hidden rounded-lg border border-[#393939] shadow-sm bg-[#212121]">
        
        {/* DESKTOP TABLE VIEW */}
        <div className="hidden md:block overflow-x-auto h-full">
            <div className="min-w-[900px]">
                {/* Header */}
                <div className="grid grid-cols-11 gap-4 px-6 py-3 border-b border-[#393939] bg-[#2a2a2a] text-[11px] font-bold text-[#8d8d8d] uppercase tracking-wider sticky top-0 z-10">
                    <div className="col-span-3 flex items-center cursor-pointer group hover:text-[#f4f4f4] transition-colors" onClick={() => onSort('name')}>
                        Shipment Name <SortIcon columnKey="name" />
                    </div>
                    <div className="col-span-3 flex items-center cursor-pointer group hover:text-[#f4f4f4] transition-colors" onClick={() => onSort('originWarehouse')}>
                        Origin / Destination <SortIcon columnKey="originWarehouse" />
                    </div>
                    <div className="col-span-1 flex items-center justify-end cursor-pointer group hover:text-[#f4f4f4] transition-colors" onClick={() => onSort('totalItems')}>
                        Items <SortIcon columnKey="totalItems" />
                    </div>
                    <div className="col-span-2 pl-4 flex items-center cursor-pointer group hover:text-[#f4f4f4] transition-colors" onClick={() => onSort('status')}>
                        Status <SortIcon columnKey="status" />
                    </div>
                    <div className="col-span-2 flex items-center justify-end cursor-pointer group hover:text-[#f4f4f4] transition-colors" onClick={() => onSort('createdDate')}>
                        Created <SortIcon columnKey="createdDate" />
                    </div>
                </div>

                {/* Rows */}
                <div className="divide-y divide-[#333] relative">
                    {shipments.map((shipment, index) => (
                        <div 
                            key={shipment.id}
                            className="grid grid-cols-11 gap-4 px-6 py-4 items-center hover:bg-[#2a2a2a] transition-colors duration-150 group animate-slide-up-fade relative"
                            style={{ animationDelay: `${index * 30}ms` }}
                        >
                            
                            <div className="col-span-3 pr-4">
                                <div className="font-medium text-[#f4f4f4] text-[14px] truncate" title={shipment.name}>{shipment.name}</div>
                                <div className="text-[12px] text-[#8d8d8d] font-mono mt-0.5">{shipment.shipmentId}</div>
                            </div>

                            <div className="col-span-3 pr-4">
                                <div className="flex items-center gap-1.5 text-[13px] text-[#e0e0e0] truncate">
                                    <MapPin size={12} className="text-[#8d8d8d]" /> {shipment.originWarehouse}
                                </div>
                                <div className="flex items-center gap-1.5 text-[12px] text-[#8d8d8d] mt-1 truncate">
                                    <span className="text-[#525252]">→</span> {shipment.destination}
                                </div>
                            </div>

                            <div className="col-span-1 text-right font-mono text-[13px] text-[#c6c6c6]">
                                {shipment.totalItems}
                            </div>

                            <div className="col-span-2 pl-4">
                                {getStatusBadge(shipment.status)}
                            </div>

                            <div className="col-span-2 flex justify-between items-center pl-4">
                                <div className="text-right flex-1">
                                    <div className="text-[13px] text-[#c6c6c6]">{formatDate(shipment.createdDate).split(',')[0]}</div>
                                    <div className="text-[11px] text-[#757575] mt-0.5">{formatDate(shipment.createdDate).split(',')[1]}</div>
                                </div>
                                
                                {/* Actions Menu Trigger */}
                                <div className="ml-4 relative">
                                    <button 
                                        ref={el => {
                                          if (el) menuButtonRefs.current.set(shipment.id, el);
                                          else menuButtonRefs.current.delete(shipment.id);
                                        }}
                                        className="p-1.5 text-[#c6c6c6] hover:text-[#f4f4f4] hover:bg-[#393939] rounded transition-colors"
                                        onClick={(e) => handleMenuClick(e, shipment.id)}
                                    >
                                        <MoreVertical size={16} />
                                    </button>
                                    
                                    {/* Overflow Menu */}
                                    {activeMenuId === shipment.id && (
                                        <Portal>
                                            {/* Position the menu dynamically based on the button's coordinates */}
                                            {/* Using `menuRef` for click outside logic */}
                                            <div 
                                                ref={menuRef}
                                                className="absolute w-[180px] bg-[#262626] border border-[#393939] rounded shadow-xl z-[var(--z-dropdown)] py-1 animate-drop-down origin-top-right"
                                                onClick={(e) => e.stopPropagation()}
                                                style={{
                                                    top: (menuButtonRefs.current.get(shipment.id)?.getBoundingClientRect().bottom || 0) + window.scrollY + 5, // 5px offset
                                                    left: (menuButtonRefs.current.get(shipment.id)?.getBoundingClientRect().right || 0) + window.scrollX - 180, // Align right edge of menu with button
                                                }}
                                            >
                                                <button 
                                                    onClick={() => { setActiveMenuId(null); onViewDetails(shipment); }}
                                                    className="w-full text-left px-4 py-2.5 text-[13px] text-[#c6c6c6] hover:bg-[#393939] hover:text-[#f4f4f4] transition-colors flex items-center gap-2"
                                                >
                                                    <Eye size={14} /> View Details
                                                </button>
                                                
                                                {/* Pack Shipment Option */}
                                                {shipment.status !== 'Cancelled' && (
                                                    <button 
                                                        onClick={() => { setActiveMenuId(null); onPackShipment?.(shipment); }}
                                                        className="w-full text-left px-4 py-2.5 text-[13px] text-[#c6c6c6] hover:bg-[#393939] hover:text-[#f4f4f4] transition-colors flex items-center gap-2"
                                                    >
                                                        <Box size={14} /> Pack Shipment
                                                    </button>
                                                )}

                                                <div className="h-[1px] bg-[#393939] my-1"></div>
                                                <button className="w-full text-left px-4 py-2.5 text-[13px] text-[#ff8389] hover:bg-[#da1e28]/10 transition-colors">
                                                    Cancel Shipment
                                                </button>
                                            </div>
                                        </Portal>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* MOBILE CARD VIEW (< 768px) */}
        <div className="md:hidden p-4 space-y-4 bg-[#161616]">
            {shipments.map((shipment, index) => (
                <div 
                    key={shipment.id}
                    className="bg-[#212121] border border-[#393939] rounded-lg p-4 shadow-sm animate-slide-up-fade relative"
                    style={{ animationDelay: `${index * 50}ms` }}
                >
                    <div className="flex justify-between items-start mb-3">
                        <div>
                             <div className="flex items-center gap-2 mb-1">
                                {getStatusBadge(shipment.status)}
                             </div>
                             <h3 className="text-[#f4f4f4] font-medium text-[15px] leading-snug">{shipment.name}</h3>
                             <p className="text-[12px] text-[#8d8d8d] font-mono mt-0.5">{shipment.shipmentId}</p>
                        </div>
                        <button 
                            className="p-1 text-[#c6c6c6]"
                            onClick={() => onViewDetails(shipment)} // View details on click
                        >
                            <MoreVertical size={16} />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 border-t border-[#333] pt-3 mt-2 text-[13px]">
                        <div>
                            <p className="text-[11px] text-[#757575] uppercase mb-0.5">Destination</p>
                            <p className="text-[#c6c6c6] truncate">{shipment.destination}</p>
                        </div>
                        <div>
                            <p className="text-[11px] text-[#757575] uppercase mb-0.5">Carrier</p>
                            <p className="text-[#c6c6c6] truncate">{shipment.carrier}</p>
                        </div>
                         <div>
                            <p className="text-[11px] text-[#757575] uppercase mb-0.5">Items</p>
                            <p className="text-[#f4f4f4] font-mono">{shipment.totalItems}</p>
                        </div>
                        <div>
                            <p className="text-[11px] text-[#757575] uppercase mb-0.5">Created</p>
                            <p className="text-[#c6c6c6]">{formatDate(shipment.createdDate).split(',')[0]}</p>
                        </div>
                    </div>
                    {/* Mobile Actions Button */}
                    {shipment.status !== 'Cancelled' && (
                        <button 
                            onClick={() => onPackShipment?.(shipment)}
                            className="w-full mt-3 h-[36px] bg-[#2a2a2a] hover:bg-[#333] border border-[#393939] rounded text-[13px] text-[#f4f4f4] font-medium flex items-center justify-center gap-2"
                        >
                            <Box size={14} /> Pack Shipment
                        </button>
                    )}
                </div>
            ))}
        </div>
    </div>
  );
};

export default ShipmentsTable;