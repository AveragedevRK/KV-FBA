import React, { useState, useEffect, useRef } from 'react';
import { Check, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, ChevronDown } from 'lucide-react';

interface ItemsPaginationFooterProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  onItemsPerPageChange: (count: number) => void;
  startIndex: number;
  endIndex: number;
  totalItems: number;
}

const ItemsPaginationFooter: React.FC<ItemsPaginationFooterProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
  startIndex,
  endIndex,
  totalItems,
}) => {
  const [pageInput, setPageInput] = useState(String(currentPage));
  const [isPerPageDropdownOpen, setIsPerPageDropdownOpen] = useState(false);
  const perPageDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (perPageDropdownRef.current && !perPageDropdownRef.current.contains(event.target as Node)) {
        setIsPerPageDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePageInputCommit = () => {
    let page = parseInt(pageInput, 10);
    if (isNaN(page)) {
      setPageInput(String(currentPage));
      return;
    }
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    onPageChange(page);
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handlePageInputCommit();
      e.currentTarget.blur();
    }
  };

  return (
    <div className="p-3 md:p-2 border-t border-[#393939] bg-[#262626] text-[12px] text-[#8d8d8d] flex flex-wrap justify-center md:justify-between items-center shrink-0 gap-4 md:gap-0">
      <div className="flex items-center gap-4">
        <span>
          Showing {totalItems > 0 ? startIndex + 1 : 0}-{endIndex} of {totalItems} items
        </span>
      </div>

      <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6">
        <div className="relative" ref={perPageDropdownRef}>
          <button
            onClick={() => setIsPerPageDropdownOpen(!isPerPageDropdownOpen)}
            className="flex items-center gap-2 hover:text-[#f4f4f4] transition-colors"
          >
            <span>Show {itemsPerPage} results / page</span>
            <ChevronDown size={14} />
          </button>

          {isPerPageDropdownOpen && (
            <div className="absolute bottom-full mb-1 right-0 w-[200px] bg-[#262626] border border-[#393939] shadow-xl z-[var(--z-dropdown)] py-1 animate-drop-down origin-bottom-right">
              {[10, 50, 100, 250].map(count => (
                <button
                  key={count}
                  onClick={() => { onItemsPerPageChange(count); setIsPerPageDropdownOpen(false); }}
                  className={`w-full text-left px-4 py-2 hover:bg-[#393939] flex items-center justify-between
                                            ${itemsPerPage === count ? 'text-[#f4f4f4] bg-[#393939]' : 'text-[#c6c6c6]'}
                                        `}
                >
                  <span>Show {count} results / page</span>
                  {itemsPerPage === count && <Check size={14} className="text-[#0f62fe]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button onClick={() => onPageChange(1)} disabled={currentPage === 1} className="p-2 text-[#c6c6c6] hover:bg-[#393939] hover:text-[#f4f4f4] disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronsLeft size={16} />
          </button>
          <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 text-[#c6c6c6] hover:bg-[#393939] hover:text-[#f4f4f4] disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronLeft size={16} />
          </button>

          <div className="flex items-center justify-center mx-1">
            <input
              type="text"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onBlur={handlePageInputCommit}
              onKeyDown={handlePageInputKeyDown}
              className="w-[40px] h-[32px] bg-[#161616] border border-[#393939] text-[#f4f4f4] text-center text-[12px] focus:outline-none focus:border-[#0f62fe]"
            />
            <span className="ml-2 text-[#8d8d8d]">of {totalPages}</span>
          </div>

          <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 text-[#c6c6c6] hover:bg-[#393939] hover:text-[#f4f4f4] disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronRight size={16} />
          </button>
          <button onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages} className="p-2 text-[#c6c6c6] hover:bg-[#393939] hover:text-[#f4f4f4] disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronsRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemsPaginationFooter;