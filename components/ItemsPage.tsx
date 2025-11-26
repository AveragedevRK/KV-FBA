import React, { useState } from 'react';
import { useItems, INITIAL_FILTERS } from '../hooks/useItems';
import ItemsHeader from './items/ItemsHeader';
import ItemsToolbar from './items/ItemsToolbar';
import ItemsTable from './items/ItemsTable';
import ItemsCardGrid from './items/ItemsCardGrid';
import ItemsPaginationFooter from './items/ItemsPaginationFooter';
// Add missing import for ItemsFilterPanel
import ItemsFilterPanel from './items/ItemsFilterPanel';

interface ItemsPageProps {
  onNavigate: (view: string) => void;
}

const ItemsPage: React.FC<ItemsPageProps> = ({ onNavigate }) => {
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  
  const {
    paginatedItems,
    totalItems,
    startIndex,
    endIndex,
    
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    filters,
    setFilters,
    
    sortConfig,
    handleSort,
    
    currentPage,
    totalPages,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage
  } = useItems();

  const handleClearFilters = () => {
    setStatusFilter('All Statuses');
    setFilters(INITIAL_FILTERS);
    setSearchQuery('');
  };

  const hasActiveFilters = 
    statusFilter !== 'All Statuses' || 
    filters.categories.length > 0 || 
    filters.warehouse !== '' || 
    filters.supplier !== '' ||
    filters.priceRange.min !== '' || 
    filters.stockRange.min !== '';

  const filtersActive = 
    filters.categories.length > 0 || 
    filters.warehouse !== '' || 
    filters.supplier !== '';

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      <ItemsHeader onAddItem={() => onNavigate('add-product')} />
      
      <ItemsToolbar 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        onOpenFilters={() => setIsFilterPanelOpen(true)}
        filtersActive={filtersActive}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {viewMode === 'list' ? (
        <ItemsTable 
          items={paginatedItems}
          sortConfig={sortConfig}
          onSort={handleSort}
          onClearFilters={handleClearFilters}
        />
      ) : (
        <ItemsCardGrid 
          items={paginatedItems}
          onClearFilters={handleClearFilters}
        />
      )}

      <div className="px-6 pb-6 bg-transparent">
        <div className={`${viewMode === 'list' ? 'bg-[#262626] border-x border-b border-[#393939] rounded-b-lg' : 'bg-transparent'}`}>
           <ItemsPaginationFooter
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={setItemsPerPage}
            startIndex={startIndex}
            endIndex={endIndex}
            totalItems={totalItems}
          />
        </div>
      </div>

      <ItemsFilterPanel 
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        currentFilters={filters}
        onApply={setFilters}
        onClear={() => setFilters(INITIAL_FILTERS)}
      />
    </div>
  );
};

export default ItemsPage;