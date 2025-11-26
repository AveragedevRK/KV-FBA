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
      <div className="fixed inset-0 bg-[#161616]/60 z-[var(--z-modal-backdrop)] backdrop-blur-sm animate-fade-in-fast" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-[320px] md:w-[400px] bg-[#262626] border-l border-[#393939] shadow-2xl z-[var(--z-modal)] flex flex-col animate-slide-in-right">
        
        <div className="px-6 py-4 border-b border-[#393939] flex justify-between items-center">
          <h2 className="text-[18px] font-semibold text-[#f4f4f4]">Filters</h2>
          <button onClick={onClose} className="text-[#c6c6c6] hover:text-[#f4f4f4] transition-transform hover:rotate-90 duration-300">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Category */}
            <div className="opacity-0 animate-slide-up-fade" style={{ animationDelay: '50ms' }}>
                <label className="block text-[12px] text-[#c6c6c6] mb-2 uppercase tracking-wide">Category</label>
                <div className="space-y-2">
                    {['Electronics', 'Accessories', 'Furniture', 'Office Supplies'].map(cat => (
                        <label key={cat} className="flex items-center gap-2 text-[14px] text-[#f4f4f4] cursor-pointer hover:opacity-80 transition-opacity">
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
            
            <div className="h-[1px] bg-[#393939]"></div>

            {/* Warehouse */}
             <div className="opacity-0 animate-slide-up-fade" style={{ animationDelay: '100ms' }}>
                <label className="block text-[12px] text-[#c6c6c6] mb-2 uppercase tracking-wide">Warehouse / Location</label>
                <select 
                    value={tempFilters.warehouse}
                    onChange={(e) => setTempFilters(prev => ({ ...prev, warehouse: e.target.value }))}
                    className="w-full h-[40px] bg-[#393939] border-b border-[#8d8d8d] text-[#f4f4f4] px-3 text-[14px] focus:outline-none transition-colors focus:border-white"
                >
                    <option value="">All Warehouses</option>
                    <option value="Main">Main Warehouse</option>
                    <option value="Dallas">Dallas Branch</option>
                    <option value="Europe">Europe Hub</option>
                </select>
            </div>

            <div className="h-[1px] bg-[#393939]"></div>

            {/* Price Range */}
            <div className="opacity-0 animate-slide-up-fade" style={{ animationDelay: '150ms' }}>
                <label className="block text-[12px] text-[#c6c6c6] mb-2 uppercase tracking-wide">Price Range ($)</label>
                <div className="flex items-center gap-3">
                    <div className="flex-1">
                        <input 
                            type="number" 
                            placeholder="Min"
                            value={tempFilters.priceRange.min}
                            onChange={(e) => setTempFilters(prev => ({ ...prev, priceRange: { ...prev.priceRange, min: e.target.value } }))}
                            className={`w-full h-[40px] bg-[#393939] border-b px-3 text-[#f4f4f4] text-[14px] focus:outline-none transition-colors ${isPriceInvalid ? 'border-[#fa4d56]' : 'border-[#8d8d8d] focus:border-white'}`}
                        />
                    </div>
                    <span className="text-[#8d8d8d]">-</span>
                     <div className="flex-1">
                        <input 
                            type="number" 
                            placeholder="Max"
                            value={tempFilters.priceRange.max}
                            onChange={(e) => setTempFilters(prev => ({ ...prev, priceRange: { ...prev.priceRange, max: e.target.value } }))}
                            className={`w-full h-[40px] bg-[#393939] border-b px-3 text-[#f4f4f4] text-[14px] focus:outline-none transition-colors ${isPriceInvalid ? 'border-[#fa4d56]' : 'border-[#8d8d8d] focus:border-white'}`}
                        />
                    </div>
                </div>
                {isPriceInvalid && <p className="text-[#fa4d56] text-[12px] mt-1 animate-fade-in-fast">Max price must be greater than min.</p>}
            </div>

            <div className="h-[1px] bg-[#393939]"></div>

             {/* Stock Level */}
             <div className="opacity-0 animate-slide-up-fade" style={{ animationDelay: '200ms' }}>
                <label className="block text-[12px] text-[#c6c6c6] mb-2 uppercase tracking-wide">Stock Quantity</label>
                <div className="flex items-center gap-3">
                    <div className="flex-1">
                        <input 
                            type="number" 
                            placeholder="Min"
                            value={tempFilters.stockRange.min}
                            onChange={(e) => setTempFilters(prev => ({ ...prev, stockRange: { ...prev.stockRange, min: e.target.value } }))}
                            className={`w-full h-[40px] bg-[#393939] border-b px-3 text-[#f4f4f4] text-[14px] focus:outline-none transition-colors ${isStockInvalid ? 'border-[#fa4d56]' : 'border-[#8d8d8d] focus:border-white'}`}
                        />
                    </div>
                    <span className="text-[#8d8d8d]">-</span>
                     <div className="flex-1">
                        <input 
                            type="number" 
                            placeholder="Max"
                            value={tempFilters.stockRange.max}
                            onChange={(e) => setTempFilters(prev => ({ ...prev, stockRange: { ...prev.stockRange, max: e.target.value } }))}
                            className={`w-full h-[40px] bg-[#393939] border-b px-3 text-[#f4f4f4] text-[14px] focus:outline-none transition-colors ${isStockInvalid ? 'border-[#fa4d56]' : 'border-[#8d8d8d] focus:border-white'}`}
                        />
                    </div>
                </div>
                 {isStockInvalid && <p className="text-[#fa4d56] text-[12px] mt-1 animate-fade-in-fast">Max stock must be greater than min.</p>}
            </div>
        </div>

        <div className="p-6 border-t border-[#393939] flex gap-4 bg-[#262626]">
            <button 
                onClick={onClear}
                className="flex-1 h-[48px] bg-[#393939] text-[#f4f4f4] hover:bg-[#4c4c4c] font-medium text-[14px] transition-colors hover:scale-[1.02] active:scale-[0.98] duration-150"
            >
                Clear All
            </button>
            <button 
                onClick={() => { onApply(tempFilters); onClose(); }}
                disabled={!canApplyFilters}
                className={`flex-1 h-[48px] font-medium text-[14px] transition-all hover:scale-[1.02] active:scale-[0.98] duration-150 ${canApplyFilters ? 'bg-[#0f62fe] text-white hover:bg-[#0353e9]' : 'bg-[#525252] text-[#c6c6c6] cursor-not-allowed'}`}
            >
                Apply Filters
            </button>
        </div>
      </div>
    </>
  );
};

export default ItemsFilterPanel;