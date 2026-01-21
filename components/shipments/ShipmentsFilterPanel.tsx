import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { ShipmentFilterState, INITIAL_SHIPMENT_FILTERS } from '../../hooks/useShipments';

interface ShipmentsFilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilters: ShipmentFilterState;
  onApply: (filters: ShipmentFilterState) => void;
  onClear: () => void;
}

const ShipmentsFilterPanel: React.FC<ShipmentsFilterPanelProps> = ({ isOpen, onClose, currentFilters, onApply, onClear }) => {
  const [tempFilters, setTempFilters] = useState<ShipmentFilterState>(currentFilters);

  useEffect(() => {
    if (isOpen) {
      setTempFilters(currentFilters);
    }
  }, [isOpen, currentFilters]);

  if (!isOpen) return null;

  const selectStyle = "w-full h-[40px] bg-[var(--bg-2)] border-b border-[var(--border-2)] text-[var(--text-primary)] px-3 text-[14px] focus:outline-none transition-colors focus:border-[var(--text-primary)] appearance-none";
  const labelStyle = "block text-[12px] text-[var(--text-secondary)] mb-2 uppercase tracking-wide";

  return (
    <>
      <div className="fixed inset-0 bg-[var(--overlay)] z-[var(--z-modal-backdrop)] backdrop-blur-sm animate-fade-in-fast" onClick={onClose} />
      <div 
        className="fixed right-0 w-[320px] md:w-[400px] bg-[var(--bg-1)] border-l border-[var(--border-1)] shadow-2xl z-[var(--z-modal)] flex flex-col animate-slide-in-right"
        style={{ top: '48px', height: 'calc(100vh - 96px)' }}
      >
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border-1)] flex justify-between items-center">
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Filter Shipments</h2>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-transform hover:rotate-90 duration-300">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Warehouse */}
            <div className="opacity-0 animate-slide-up-fade" style={{ animationDelay: '50ms' }}>
                <label className={labelStyle}>Origin Warehouse</label>
                <select 
                    value={tempFilters.originWarehouse}
                    onChange={(e) => setTempFilters(prev => ({ ...prev, originWarehouse: e.target.value }))}
                    className={selectStyle}
                >
                    <option value="">All Warehouses</option>
                    <option value="Main Warehouse">Main Warehouse</option>
                    <option value="Dallas Branch">Dallas Branch</option>
                    <option value="Europe Hub">Europe Hub</option>
                </select>
            </div>
            
            <div className="h-[1px] bg-[var(--border-1)]"></div>

            {/* Carrier */}
             <div className="opacity-0 animate-slide-up-fade" style={{ animationDelay: '100ms' }}>
                <label className={labelStyle}>Carrier</label>
                <select 
                    value={tempFilters.carrier}
                    onChange={(e) => setTempFilters(prev => ({ ...prev, carrier: e.target.value }))}
                    className={selectStyle}
                >
                    <option value="">All Carriers</option>
                    <option value="UPS">UPS</option>
                    <option value="FedEx">FedEx</option>
                    <option value="DHL">DHL</option>
                    <option value="USPS">USPS</option>
                    <option value="Maersk">Maersk</option>
                </select>
            </div>

            <div className="h-[1px] bg-[var(--border-1)]"></div>

            {/* Date Range */}
            <div className="opacity-0 animate-slide-up-fade" style={{ animationDelay: '150ms' }}>
                <label className={labelStyle}>Date Range</label>
                <div className="space-y-2">
                    {['Today', 'Last 7 Days', 'Last 30 Days'].map(range => (
                        <label key={range} className="flex items-center gap-2 text-[14px] text-[var(--text-primary)] cursor-pointer hover:opacity-80 transition-opacity">
                            <input 
                                type="radio"
                                name="dateRange" 
                                checked={tempFilters.dateRange === range}
                                onChange={() => setTempFilters(prev => ({ ...prev, dateRange: range }))}
                                className="accent-[#0f62fe]"
                            />
                            {range}
                        </label>
                    ))}
                    <label className="flex items-center gap-2 text-[14px] text-[var(--text-primary)] cursor-pointer hover:opacity-80 transition-opacity">
                            <input 
                                type="radio"
                                name="dateRange" 
                                checked={tempFilters.dateRange === ''}
                                onChange={() => setTempFilters(prev => ({ ...prev, dateRange: '' }))}
                                className="accent-[#0f62fe]"
                            />
                            All Time
                    </label>
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--border-1)] flex gap-4 bg-[var(--bg-1)]">
            <button 
                onClick={() => {
                    setTempFilters(INITIAL_SHIPMENT_FILTERS);
                    onClear();
                }}
                className="flex-1 h-[48px] bg-[var(--bg-2)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] font-medium text-[14px] transition-colors hover:scale-[1.02] active:scale-[0.98] duration-150"
            >
                Clear All
            </button>
            <button 
                onClick={() => { onApply(tempFilters); onClose(); }}
                className="flex-1 h-[48px] bg-[#0f62fe] text-white hover:bg-[#0353e9] font-medium text-[14px] transition-all hover:scale-[1.02] active:scale-[0.98] duration-150"
            >
                Apply Filters
            </button>
        </div>
      </div>
    </>
  );
};

export default ShipmentsFilterPanel;