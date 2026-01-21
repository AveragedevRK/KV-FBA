import React, { useState, useRef, useEffect } from 'react';
import { Portal } from '../../App'; // Import Portal
import { Shipment, ShipmentStatus } from '../../types';
import { SortConfig } from '../../hooks/useShipments';
import { 
  MoreVertical, Package, ArrowDown, ArrowUp, 
  MapPin, Truck, Calendar, FileText, CheckCircle2, XCircle, Box, Eye, Search
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
        return <span className={`${baseClasses} bg-[var(--bg-2)] text-[var(--text-secondary)] border-[var(--border-2)]`}><FileText size={12} /> Draft</span>;
      case 'In Progress': 
        return <span className={`${baseClasses} bg-[#0043ce]/20 text-[#a6c8ff] border-[#0043ce]/40`}><div className="w-2 h-2 rounded-full border-2 border-current border-t-transparent animate-spin"/> In Progress</span>;
      case 'Shipped': 
        return <span className={`${baseClasses} bg-[#005d5d]/20 text-[#08bdba] border-[#005d5d]/40`}><Truck size={12} /> Shipped</span>;
      case 'Delivered': 
        return <span className={`${baseClasses} bg-[#24a148]/20 text-[#42be65] border-[#24a148]/40`}><CheckCircle2 size={12} /> Delivered</span>;
      case 'Cancelled': 
        return <span className={`${baseClasses} bg-[#da1e28]/20 text-[#ff8389] border-[#da1e28]/40`}><XCircle size={12} /> Cancelled</span>;
      default: 
        return <span className={`${baseClasses} bg-[var(--bg-2)] text-[var(--text-secondary)]`}>{status}</span>;
    }
  };

  const SortIcon = ({ columnKey }: { columnKey: keyof Shipment }) => {
    if (sortConfig.key !== columnKey) return <ArrowDown size={14} className="opacity-0 group-hover:opacity-40 transition-opacity duration-300 ml-1" />;
    return sortConfig.direction === 'asc' 
       ? <ArrowDown size={14} className="text-[var(--text-primary)] transition-transform duration-300 ml-1" /> 
       : <ArrowUp size={14} className="text-[var(--text-primary)] transition-transform duration-300 ml-1" />;
  };

  // Helper to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleMenuClick = (e: React.MouseEvent, shipmentId: string) => {
      e.stopPropagation();
      setActiveMenuId(activeMenuId === shipmentId ? null : shipmentId);
  }

  return (
    <div className="flex-1 px-4 md:px-6 pb-0 min-h-0 overflow-hidden">
        <div className="bg-[var(--bg-1)] border-x border-t border-[var(--border-1)] h-full flex flex-col animate-fade-in-fast">
        
            {/* DESKTOP TABLE VIEW */}
            <div className="hidden md:block overflow-x-auto flex-1">
                <div className="min-w-[900px]">
                    {/* Header */}
                    <div className="grid grid-cols-11 gap-4 p-4 border-b border-[var(--border-1)] text-[12px] font-semibold text-[var(--text-secondary)] items-center shrink-0 bg-[var(--bg-1)] z-10 sticky top-0">
                        <div className="col-span-3 pl-2 flex items-center cursor-pointer group hover:text-[var(--text-primary)] transition-colors" onClick={() => onSort('name')}>
                            SHIPMENT NAME <SortIcon columnKey="name" />
                        </div>
                        <div className="col-span-3 flex items-center cursor-pointer group hover:text-[var(--text-primary)] transition-colors" onClick={() => onSort('originWarehouse')}>
                            ORIGIN / DESTINATION <SortIcon columnKey="originWarehouse" />
                        </div>
                        <div className="col-span-1 flex items-center justify-end cursor-pointer group hover:text-[var(--text-primary)] transition-colors" onClick={() => onSort('totalItems')}>
                            ITEMS <SortIcon columnKey="totalItems" />
                        </div>
                        <div className="col-span-2 pl-4 flex items-center cursor-pointer group hover:text-[var(--text-primary)] transition-colors" onClick={() => onSort('status')}>
                            STATUS <SortIcon columnKey="status" />
                        </div>
                        <div className="col-span-2 flex items-center justify-end cursor-pointer group hover:text-[var(--text-primary)] transition-colors" onClick={() => onSort('createdDate')}>
                            CREATED <SortIcon columnKey="createdDate" />
                        </div>
                    </div>

                    {/* Rows */}
                    <div>
                        {shipments.length > 0 ? (
                            shipments.map((shipment, index) => (
                                <div 
                                    key={shipment.shipmentId}
                                    className="grid grid-cols-11 gap-4 p-4 border-b border-[var(--border-1)] items-center hover:bg-[var(--bg-2)] transition-colors duration-150 group animate-slide-up-fade relative"
                                    style={{ animationDelay: `${index * 30}ms` }}
                                >
                                    
                                    <div className="col-span-3 pl-2 pr-4">
                                        {/* Clickable Shipment Name */}
                                        <button
                                        onClick={() => onViewDetails(shipment)}
                                        className="font-medium text-[var(--text-primary)] text-[14px] truncate text-left w-full
                                                    hover:underline cursor-pointer transition-colors
                                                    hover:text-[#0f62fe]"
                                        title={`View details for ${shipment.name}`}
                                        >
                                        {shipment.name}
                                        </button>
                                        <div className="text-[12px] text-[var(--text-tertiary)] font-mono mt-0.5">{shipment.shipmentId}</div>
                                    </div>

                                    <div className="col-span-3 pr-4">
                                        <div className="flex items-center gap-1.5 text-[13px] text-[var(--text-primary)] truncate">
                                            <MapPin size={12} className="text-[var(--text-tertiary)]" /> {shipment.originWarehouse}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[12px] text-[var(--text-tertiary)] mt-1 truncate">
                                            <span className="text-[var(--text-secondary)]">→</span> {shipment.destination}
                                        </div>
                                    </div>

                                    <div className="col-span-1 text-right font-mono text-[13px] text-[var(--text-secondary)]">
                                        {shipment.totalItems}
                                    </div>

                                    <div className="col-span-2 pl-4">
                                        {getStatusBadge(shipment.status)}
                                    </div>

                                    <div className="col-span-2 flex justify-between items-center pl-4">
                                        <div className="text-right flex-1">
                                            <div className="text-[13px] text-[var(--text-secondary)]">{formatDate(shipment.createdDate).split(',')[0]}</div>
                                            <div className="text-[11px] text-[var(--text-tertiary)] mt-0.5">{formatDate(shipment.createdDate).split(',')[1]}</div>
                                        </div>
                                        
                                        {/* Actions Menu Trigger */}
                                        <div className="ml-4 relative">
                                            <button 
                                                ref={el => {
                                                if (el) menuButtonRefs.current.set(shipment.shipmentId, el);
                                                else menuButtonRefs.current.delete(shipment.shipmentId);
                                                }}
                                                className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-2)] rounded transition-colors"
                                                onClick={(e) => handleMenuClick(e, shipment.shipmentId)}
                                            >
                                                <MoreVertical size={16} />
                                            </button>
                                            
                                            {/* Overflow Menu */}
                                            {activeMenuId === shipment.shipmentId && (
                                                <Portal>
                                                    {/* Position the menu dynamically based on the button's coordinates */}
                                                    {/* Using `menuRef` for click outside logic */}
                                                    <div 
                                                        ref={menuRef}
                                                        className="absolute w-[180px] bg-[var(--bg-1)] border border-[var(--border-1)] rounded shadow-xl z-[var(--z-dropdown)] py-1 animate-drop-down origin-top-right"
                                                        onClick={(e) => e.stopPropagation()}
                                                        style={{
                                                            top: (menuButtonRefs.current.get(shipment.shipmentId)?.getBoundingClientRect().bottom || 0) + window.scrollY + 5, // 5px offset
                                                            left: (menuButtonRefs.current.get(shipment.shipmentId)?.getBoundingClientRect().right || 0) + window.scrollX - 180, // Align right edge of menu with button
                                                        }}
                                                    >
                                                        <button 
                                                            onClick={() => { setActiveMenuId(null); onViewDetails(shipment); }}
                                                            className="w-full text-left px-4 py-2.5 text-[13px] text-[var(--text-secondary)] hover:bg-[var(--bg-2)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-2"
                                                        >
                                                            <Eye size={14} /> View Details
                                                        </button>
                                                        
                                                        {/* Pack Shipment Option */}
                                                        {shipment.status !== 'Cancelled' && (
                                                            <button 
                                                                onClick={() => { setActiveMenuId(null); onPackShipment?.(shipment); }}
                                                                className="w-full text-left px-4 py-2.5 text-[13px] text-[var(--text-secondary)] hover:bg-[var(--bg-2)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-2"
                                                            >
                                                                <Box size={14} /> Pack Shipment
                                                            </button>
                                                        )}

                                                        <div className="h-[1px] bg-[var(--border-1)] my-1"></div>
                                                        <button className="w-full text-left px-4 py-2.5 text-[13px] text-[#ff8389] hover:bg-[#da1e28]/10 transition-colors">
                                                            Cancel Shipment
                                                        </button>
                                                    </div>
                                                </Portal>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-[var(--text-secondary)] animate-fade-in-fast">
                                <Search size={48} className="mb-4 opacity-20 animate-pulse" />
                                <p className="text-[16px] font-medium">No shipments match your filters</p>
                                <button onClick={onClearFilters} className="text-[#0f62fe] blue-text-readable text-[14px] mt-2 hover:underline transition-colors">
                                    Clear all filters
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MOBILE CARD VIEW (< 768px) */}
            <div className="md:hidden p-4 space-y-4 bg-[var(--bg-0)] h-full overflow-y-auto">
                {shipments.length > 0 ? (
                    shipments.map((shipment, index) => (
                        <div 
                            key={shipment.shipmentId}
                            className="bg-[var(--bg-1)] border border-[var(--border-1)] rounded-lg p-4 shadow-sm animate-slide-up-fade relative"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        {getStatusBadge(shipment.status)}
                                    </div>
                                    <h3 className="text-[var(--text-primary)] font-medium text-[15px] leading-snug">{shipment.name}</h3>
                                    <p className="text-[12px] text-[var(--text-tertiary)] font-mono mt-0.5">{shipment.shipmentId}</p>
                                </div>
                                <button 
                                    className="p-1 text-[var(--text-secondary)]"
                                    onClick={() => onViewDetails(shipment)} // View details on click
                                >
                                    <MoreVertical size={16} />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-y-3 gap-x-4 border-t border-[var(--border-1)] pt-3 mt-2 text-[13px]">
                                <div>
                                    <p className="text-[11px] text-[var(--text-tertiary)] uppercase mb-0.5">Destination</p>
                                    <p className="text-[var(--text-secondary)] truncate">{shipment.destination}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-[var(--text-tertiary)] uppercase mb-0.5">Carrier</p>
                                    <p className="text-[var(--text-secondary)] truncate">{shipment.carrier}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-[var(--text-tertiary)] uppercase mb-0.5">Items</p>
                                    <p className="text-[var(--text-primary)] font-mono">{shipment.totalItems}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-[var(--text-tertiary)] uppercase mb-0.5">Created</p>
                                    <p className="text-[var(--text-secondary)]">{formatDate(shipment.createdDate).split(',')[0]}</p>
                                </div>
                            </div>
                            {/* Mobile Actions Button */}
                            {shipment.status !== 'Cancelled' && (
                                <button 
                                    onClick={() => onPackShipment?.(shipment)}
                                    className="w-full mt-3 h-[36px] bg-[var(--bg-2)] hover:bg-[var(--bg-hover)] border border-[var(--border-1)] rounded text-[13px] text-[var(--text-primary)] font-medium flex items-center justify-center gap-2"
                                >
                                    <Box size={14} /> Pack Shipment
                                </button>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-[var(--text-secondary)] animate-fade-in-fast">
                        <Search size={48} className="mb-4 opacity-20 animate-pulse" />
                        <p className="text-[16px] font-medium">No shipments match your filters</p>
                        <button onClick={onClearFilters} className="text-[#0f62fe] blue-text-readable text-[14px] mt-2 hover:underline transition-colors">
                            Clear all filters
                        </button>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default ShipmentsTable;