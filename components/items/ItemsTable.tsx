
import React from 'react';
import { InventoryItem } from '../../types';
import { SortConfig } from '../../hooks/useItems';
import { 
  MoreVertical, Image as ImageIcon, AlertTriangle, Search, 
  ArrowDown, ArrowUp, ExternalLink // Import ExternalLink for Amazon link
} from 'lucide-react';

interface ItemsTableProps {
  items: InventoryItem[];
  sortConfig: SortConfig;
  onSort: (key: keyof InventoryItem) => void;
  onClearFilters: () => void;
}

const ItemsTable: React.FC<ItemsTableProps> = ({
  items,
  sortConfig,
  onSort,
  onClearFilters,
}) => {

  // Removed getStatusDisplay as it's no longer used in the table body

  const SortIcon = ({ columnKey }: { columnKey: keyof InventoryItem }) => {
    if (sortConfig.key !== columnKey) return <ArrowDown size={14} className="opacity-0 group-hover:opacity-40 transition-opacity duration-300" />;
    return sortConfig.direction === 'asc' 
       ? <ArrowDown size={14} className="text-[#f4f4f4] transition-transform duration-300" /> 
       : <ArrowUp size={14} className="text-[#f4f4f4] transition-transform duration-300" />;
  };

  return (
    <div className="flex-1 px-4 md:px-6 pb-0 min-h-0 overflow-hidden">
        <div className="bg-[#262626] border-x border-t border-[#393939] h-full flex flex-col animate-fade-in-fast">
            
            {/* Header with Scroll Wrapper */}
            <div className="overflow-x-auto flex-1">
                <div className="min-w-[800px]">
                    {/* Table Header */}
                    <div className="grid grid-cols-11 gap-4 p-4 border-b border-[#393939] text-[12px] font-semibold text-[#c6c6c6] items-center shrink-0 bg-[#262626] z-10 sticky top-0">
                    <div className="col-span-1 flex justify-center">IMAGE</div>
                    <div className="col-span-4 pl-2 cursor-pointer group flex items-center gap-1 hover:text-[#f4f4f4] transition-colors" onClick={() => onSort('sku')}>
                        SKU / ITEM
                        <SortIcon columnKey="sku" />
                    </div>
                    {/* Replaced CATEGORY with DIMENSIONS */}
                    <div className="col-span-3 flex items-center cursor-pointer group hover:text-[#f4f4f4] gap-1 transition-colors">
                        DIMENSIONS
                        {/* No direct sort for combined dimensions */}
                    </div>
                    {/* Replaced ON HAND with WEIGHT */}
                    <div className="col-span-1 flex items-center justify-end cursor-pointer group hover:text-[#f4f4f4] gap-1 transition-colors">
                        WEIGHT
                        {/* No direct sort for combined weight */}
                    </div>
                    {/* Replaced STATUS with Amazon Link */}
                    <div className="col-span-2 flex items-center justify-end">
                        AMAZON
                    </div>
                    </div>

                    {/* Table Body */}
                    <div>
                        {items.length > 0 ? (
                            items.map((item, index) => (
                                <div 
                                    key={item.id} 
                                    className="grid grid-cols-11 gap-4 p-4 border-b border-[#393939] items-center hover:bg-[#333333] transition-all duration-200 group text-[14px] text-[#f4f4f4] opacity-0 animate-slide-up-fade"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <div className="col-span-1 flex justify-center">
                                        {(item as any).imageUrl ? (
                                            <img src={(item as any).imageUrl} alt={item.name} className="w-10 h-10 object-cover" />
                                        ) : (
                                            <div className="w-10 h-10 bg-[#393939] flex items-center justify-center text-[#8d8d8d] transition-transform duration-300 group-hover:scale-110 group-hover:bg-[#4c4c4c] group-hover:text-[#f4f4f4]">
                                                <ImageIcon size={16} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="col-span-4 pl-2 flex flex-col justify-center">
                                        <span className="font-medium text-[#f4f4f4] group-hover:text-[#0f62fe] transition-colors">{item.sku}</span>
                                        <span className="text-[12px] text-[#8d8d8d] truncate" title={item.name}>{item.name}</span>
                                    </div>

                                    {/* DIMENSIONS Column */}
                                    <div className="col-span-3 flex items-center text-[#c6c6c6]">
                                        {(item as any).productDimensions?.length && (item as any).productDimensions?.width && (item as any).productDimensions?.height && (item as any).productDimensions?.unit
                                            ? `${(item as any).productDimensions.length} x ${(item as any).productDimensions.width} x ${(item as any).productDimensions.height} ${(item as any).productDimensions.unit}`
                                            : "N/A"}
                                    </div>

                                    {/* WEIGHT Column */}
                                    <div className="col-span-1 flex items-center justify-end font-mono">
                                        {(item as any).productWeight && (item as any).weightUnit
                                            ? `${(item as any).productWeight} ${(item as any).weightUnit}`
                                            : "N/A"}
                                    </div>

                                    {/* Amazon Link Column */}
                                    <div className="col-span-2 flex items-center justify-end">
                                        {(item as any).asin ? (
                                            <a
                                              href={`https://amazon.com/dp/${(item as any).asin}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="p-1 hover:bg-[#4c4c4c] text-[#c6c6c6] hover:text-white transition-colors"
                                              title="View on Amazon"
                                            >
                                              <ExternalLink size={16} />
                                            </a>
                                        ) : null}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-[#c6c6c6] animate-fade-in-fast">
                                <Search size={48} className="mb-4 opacity-20 animate-pulse" />
                                <p className="text-[16px] font-medium">No items match your filters</p>
                                <button onClick={onClearFilters} className="text-[#0f62fe] blue-text-readable text-[14px] mt-2 hover:underline transition-colors">
                                    Clear all filters
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default ItemsTable;
