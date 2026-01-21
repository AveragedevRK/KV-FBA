import React, { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import { FilterState } from '../../hooks/useItems';

interface ItemsFilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilters: FilterState;
  onApply: (filters: FilterState) => void;
  onClear: () => void;
}

const ItemsFilterPanel: React.FC<ItemsFilterPanelProps> = ({ isOpen, onClose, currentFilters, onApply, onClear }) => {
  const [tempFilters, setTempFilters] = useState<FilterState>(currentFilters);

  useEffect(() => {
    if (isOpen) {
      setTempFilters(currentFilters);
    }
  }, [isOpen, currentFilters]);

  const isPriceInvalid = useMemo(() => {
    const min = parseFloat(tempFilters.priceRange.min);
    const max = parseFloat(tempFilters.priceRange.max);
    return !isNaN(min) && !isNaN(max) && max < min;
  }, [tempFilters.priceRange]);

  const isStockInvalid = useMemo(() => {
    const min = parseFloat(tempFilters.stockRange.min);
    const max = parseFloat(tempFilters.stockRange.max);
    return !isNaN(min) && !isNaN(max) && max < min;
  }, [tempFilters.stockRange]);

  const canApplyFilters = !isPriceInvalid && !isStockInvalid;

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-[var(--overlay)] z-[var(--z-modal-backdrop)] backdrop-blur-sm animate-fade-in-fast" onClick={onClose} />
      <div 
        className="fixed right-0 w-[320px] md:w-[400px] bg-[var(--bg-1)] border-l border-[var(--border-1)] shadow-2xl z-[var(--z-modal)] flex flex-col animate-slide-in-right"
        style={{ top: '48px', height: 'calc(100vh - 96px)' }}
      >
        
        <div className="px-6 py-4 border-b border-[var(--border-1)] flex justify-between items-center">
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Filters</h2>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-transform hover:rotate-90 duration-300">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Category */}
            <div className="opacity-0 animate-slide-up-fade" style={{ animationDelay: '50ms' }}>
                <label className="block text-[12px] text-[var(--text-secondary)] mb-2 uppercase tracking-wide">Category</label>
                <div className="space-y-2">
                    {['Electronics', 'Accessories', 'Furniture', 'Office Supplies'].map(cat => (
                        <label key={cat} className="flex items-center gap-2 text-[14px] text-[var(--text-primary)] cursor-pointer hover:opacity-80 transition-opacity">
                            <input 
                                type="checkbox" 
                                checked={tempFilters.categories.includes(cat)}
                                onChange={() => {
                                    const newCats = tempFilters.categories.includes(cat)
                                        ? tempFilters.categories.filter(c => c !== cat)
                                        : [...tempFilters.categories, cat];
                                    setTempFilters(prev => ({ ...prev, categories: newCats }));
                                }}
                                className="accent-[#0f62fe]"
                            />
                            {cat}
                        </label>
                    ))}
                </div>
            </div>
            
            <div className="h-[1px] bg-[var(--border-1)]"></div>

            {/* Warehouse */}
             <div className="opacity-0 animate-slide-up-fade" style={{ animationDelay: '100ms' }}>
                <label className="block text-[12px] text-[var(--text-secondary)] mb-2 uppercase tracking-wide">Warehouse / Location</label>
                <select 
                    value={tempFilters.warehouse}
                    onChange={(e) => setTempFilters(prev => ({ ...prev, warehouse: e.target.value }))}
                    className="w-full h-[40px] bg-[var(--bg-2)] border-b border-[var(--border-2)] text-[var(--text-primary)] px-3 text-[14px] focus:outline-none transition-colors focus:border-[var(--text-primary)]"
                >
                    <option value="">All Warehouses</option>
                    <option value="Main">Main Warehouse</option>
                    <option value="Dallas">Dallas Branch</option>
                    <option value="Europe">Europe Hub</option>
                </select>
            </div>

            <div className="h-[1px] bg-[var(--border-1)]"></div>

            {/* Price Range */}
            <div className="opacity-0 animate-slide-up-fade" style={{ animationDelay: '150ms' }}>
                <label className="block text-[12px] text-[var(--text-secondary)] mb-2 uppercase tracking-wide">Price Range ($)</label>
                <div className="flex items-center gap-3">
                    <div className="flex-1">
                        <input 
                            type="number" 
                            placeholder="Min"
                            value={tempFilters.priceRange.min}
                            onChange={(e) => setTempFilters(prev => ({ ...prev, priceRange: { ...prev.priceRange, min: e.target.value } }))}
                            className={`w-full h-[40px] bg-[var(--bg-2)] border-b px-3 text-[var(--text-primary)] text-[14px] focus:outline-none transition-colors ${isPriceInvalid ? 'border-[#fa4d56]' : 'border-[var(--border-2)] focus:border-[var(--text-primary)]'}`}
                        />
                    </div>
                    <span className="text-[var(--text-tertiary)]">-</span>
                     <div className="flex-1">
                        <input 
                            type="number" 
                            placeholder="Max"
                            value={tempFilters.priceRange.max}
                            onChange={(e) => setTempFilters(prev => ({ ...prev, priceRange: { ...prev.priceRange, max: e.target.value } }))}
                            className={`w-full h-[40px] bg-[var(--bg-2)] border-b px-3 text-[var(--text-primary)] text-[14px] focus:outline-none transition-colors ${isPriceInvalid ? 'border-[#fa4d56]' : 'border-[var(--border-2)] focus:border-[var(--text-primary)]'}`}
                        />
                    </div>
                </div>
                {isPriceInvalid && <p className="text-[#fa4d56] text-[12px] mt-1 animate-fade-in-fast">Max price must be greater than min.</p>}
            </div>

            <div className="h-[1px] bg-[var(--border-1)]"></div>

             {/* Stock Level */}
             <div className="opacity-0 animate-slide-up-fade" style={{ animationDelay: '200ms' }}>
                <label className="block text-[12px] text-[var(--text-secondary)] mb-2 uppercase tracking-wide">Stock Quantity</label>
                <div className="flex items-center gap-3">
                    <div className="flex-1">
                        <input 
                            type="number" 
                            placeholder="Min"
                            value={tempFilters.stockRange.min}
                            onChange={(e) => setTempFilters(prev => ({ ...prev, stockRange: { ...prev.stockRange, min: e.target.value } }))}
                            className={`w-full h-[40px] bg-[var(--bg-2)] border-b px-3 text-[var(--text-primary)] text-[14px] focus:outline-none transition-colors ${isStockInvalid ? 'border-[#fa4d56]' : 'border-[var(--border-2)] focus:border-[var(--text-primary)]'}`}
                        />
                    </div>
                    <span className="text-[var(--text-tertiary)]">-</span>
                     <div className="flex-1">
                        <input 
                            type="number" 
                            placeholder="Max"
                            value={tempFilters.stockRange.max}
                            onChange={(e) => setTempFilters(prev => ({ ...prev, stockRange: { ...prev.stockRange, max: e.target.value } }))}
                            className={`w-full h-[40px] bg-[var(--bg-2)] border-b px-3 text-[var(--text-primary)] text-[14px] focus:outline-none transition-colors ${isStockInvalid ? 'border-[#fa4d56]' : 'border-[var(--border-2)] focus:border-[var(--text-primary)]'}`}
                        />
                    </div>
                </div>
                 {isStockInvalid && <p className="text-[#fa4d56] text-[12px] mt-1 animate-fade-in-fast">Max stock must be greater than min.</p>}
            </div>
        </div>

        <div className="p-6 border-t border-[var(--border-1)] flex gap-4 bg-[var(--bg-1)]">
            <button 
                onClick={onClear}
                className="flex-1 h-[48px] bg-[var(--bg-2)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] font-medium text-[14px] transition-colors hover:scale-[1.02] active:scale-[0.98] duration-150"
            >
                Clear All
            </button>
            <button 
                onClick={() => { onApply(tempFilters); onClose(); }}
                disabled={!canApplyFilters}
                className={`flex-1 h-[48px] font-medium text-[14px] transition-all hover:scale-[1.02] active:scale-[0.98] duration-150 ${canApplyFilters ? 'bg-[#0f62fe] text-white hover:bg-[#0353e9]' : 'bg-[var(--bg-3)] text-[var(--text-secondary)] cursor-not-allowed'}`}
            >
                Apply Filters
            </button>
        </div>
      </div>
    </>
  );
};

export default ItemsFilterPanel;