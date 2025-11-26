import React from 'react';
import { Plus } from 'lucide-react';

interface ItemsHeaderProps {
  onAddItem: () => void;
}

const ItemsHeader: React.FC<ItemsHeaderProps> = ({ onAddItem }) => {
  return (
    <div className="px-4 md:px-6 pt-4 md:pt-6 pb-4 shrink-0 flex flex-wrap gap-4 justify-between items-start overflow-hidden">
      <div className="animate-slide-in-right">
        <h1 className="text-[24px] md:text-[28px] font-semibold text-[#f4f4f4] leading-tight">Items</h1>
        <p className="text-[14px] text-[#c6c6c6] mt-1">Get a view of all items in the XproFulfill warehouse.</p>
      </div>
      
      <button 
          onClick={onAddItem}
          className="h-[40px] px-4 bg-[#0f62fe] hover:bg-[#0353e9] text-white text-[14px] font-medium flex items-center gap-2 whitespace-nowrap transition-all duration-200 hover:scale-105 active:scale-95 animate-fade-in-fast"
          style={{ animationDelay: '100ms' }}
      >
          <Plus size={18} />
          Add Item
      </button>
    </div>
  );
};

export default ItemsHeader;