import React from 'react';
import { InventoryItem } from '../../types';
import { Image as ImageIcon, AlertTriangle, Search, MoreVertical } from 'lucide-react';

interface ItemsCardGridProps {
  items: InventoryItem[];
  onClearFilters: () => void;
}

const ItemsCardGrid: React.FC<ItemsCardGridProps> = ({ items, onClearFilters }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Low Stock': return 'text-[#f4c430]';
      case 'Out of Stock': return 'text-[#fa4d56]';
      case 'Discontinued': return 'text-[#8d8d8d]';
      case 'In Stock': return 'text-[#42be65]';
      default: return 'text-[#c6c6c6]';
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex-1 px-6 pb-6 min-h-0 overflow-hidden animate-fade-in-fast">
        <div className="bg-[#262626] border border-[#393939] h-full flex flex-col items-center justify-center text-[#c6c6c6]">
          <Search size={48} className="mb-4 opacity-20 animate-pulse" />
          <p className="text-[16px] font-medium">No items match your filters</p>
          <button onClick={onClearFilters} className="text-[#0f62fe] blue-text-readable text-[14px] mt-2 hover:underline">
            Clear all filters
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 px-6 pb-6 min-h-0 overflow-y-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {items.map((item, index) => (
          <div 
            key={item.id} 
            className="bg-[#262626] border border-[#393939] overflow-hidden hover:border-[#8d8d8d] hover:shadow-lg transition-all duration-300 group flex flex-col opacity-0 animate-slide-up-fade"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            
            {/* Image Area - Top & Centered */}
            <div className="w-full aspect-[4/3] bg-[#393939] relative border-b border-[#393939] flex items-center justify-center overflow-hidden">
                {/* Placeholder for real image, using Icon for now */}
                <div className="transition-transform duration-500 group-hover:scale-110">
                    <ImageIcon size={64} strokeWidth={1} className="text-[#525252] group-hover:text-[#666666] transition-colors" />
                </div>
                
                {/* Actions Overlay */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                    <button className="p-2 bg-[#161616]/80 hover:bg-[#0f62fe] text-[#f4f4f4] transition-colors backdrop-blur-sm">
                        <MoreVertical size={16} />
                    </button>
                </div>
            </div>

            {/* Content Below Image */}
            <div className="p-4 flex flex-col flex-1 bg-[#262626] transition-colors group-hover:bg-[#2a2a2a]">
                
                <div className="flex justify-between items-start mb-3">
                    <span className="text-[#0f62fe] blue-text-readable text-[12px] font-mono bg-[#0f62fe]/10 px-1.5 py-0.5 transition-colors group-hover:bg-[#0f62fe]/20">
                        {item.sku}
                    </span>
                    <div className={`text-[11px] font-medium flex items-center gap-1 ${getStatusColor(item.status)}`}>
                        {item.status === 'Low Stock' && <AlertTriangle size={12} className="animate-pulse" />}
                        {item.status}
                    </div>
                </div>

                <h3 className="text-[#f4f4f4] text-[14px] font-medium leading-snug mb-2 line-clamp-2 group-hover:text-[#0f62fe] transition-colors" title={item.name}>
                    {item.name}
                </h3>
                
                <div className="mt-auto pt-4 border-t border-[#393939] flex items-end justify-between">
                    <div>
                        <p className="text-[10px] text-[#8d8d8d] uppercase tracking-wider mb-0.5">Category</p>
                        <p className="text-[12px] text-[#c6c6c6]">{item.category}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-[#8d8d8d] uppercase tracking-wider mb-0.5">On Hand</p>
                        <p className="text-[14px] text-[#f4f4f4] font-mono">{item.onHand}</p>
                    </div>
                </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
};

export default ItemsCardGrid;