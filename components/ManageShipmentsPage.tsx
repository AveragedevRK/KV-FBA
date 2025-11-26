import React, { useState } from 'react';
import { Portal } from '../App'; // Import Portal
import { useShipments, INITIAL_SHIPMENT_FILTERS } from '../hooks/useShipments';
import ShipmentsToolbar from './shipments/ShipmentsToolbar';
import ShipmentsTable from './shipments/ShipmentsTable';
import ShipmentsFilterPanel from './shipments/ShipmentsFilterPanel';
import PackShipmentPanel from './shipments/PackShipmentPanel';
import ItemsPaginationFooter from './items/ItemsPaginationFooter';
import { 
  Package, Plus, Loader2, AlertCircle, 
  ArrowLeft, FileText, Truck, CheckCircle2, XCircle, MapPin, Ruler, Weight
} from 'lucide-react'; 
import { Shipment, ShipmentItem, ShipmentStatus, PackingLine } from '../types';

interface ManageShipmentsPageProps {
  onNavigate: (view: string) => void;
}

const ManageShipmentsPage: React.FC<ManageShipmentsPageProps> = ({ onNavigate }) => {
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isPackPanelOpen, setIsPackPanelOpen] = useState(false);
  const [selectedShipmentForPacking, setSelectedShipmentForPacking] = useState<Shipment | null>(null);
  const [mockPackingItems, setMockPackingItems] = useState<ShipmentItem[]>([]); 

  // State for Shipment Details Panel
  const [isShipmentDetailsPanelOpen, setIsShipmentDetailsPanel] = useState(false);
  const [selectedShipmentForDetails, setSelectedShipmentForDetails] = useState<Shipment | null>(null);
  
  // New state to trigger data refresh in useShipments
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const {
    paginatedShipments,
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
    setItemsPerPage,

    isLoading, 
    error,     
  } = useShipments(refreshTrigger); // Pass refreshTrigger to useShipments

  const handleClearFilters = () => {
    setStatusFilter('All Statuses');
    setFilters(INITIAL_SHIPMENT_FILTERS);
    setSearchQuery('');
  };

  const handlePackShipment = (shipment: Shipment) => {
      setSelectedShipmentForPacking(shipment);
      setMockPackingItems(shipment.items || []); 
      setIsPackPanelOpen(true);
  };

  // Fix: Update handleSavePacking to accept the updated shipment object
  const handleSavePacking = async (updatedShipment: Shipment) => {
      console.log(`Packing Configuration for shipment ${updatedShipment.shipmentId} Saved. New Status: ${updatedShipment.status}`);
      
      // Increment refreshTrigger to force useShipments to re-fetch
      setRefreshTrigger(prev => prev + 1);

      // If the details panel is open for this specific shipment, update its data immediately
      if (selectedShipmentForDetails && selectedShipmentForDetails.id === updatedShipment.id) {
          setSelectedShipmentForDetails(updatedShipment);
      }
  };

  // Handler for View Details
  const handleViewDetails = (shipment: Shipment) => {
      setSelectedShipmentForDetails(shipment);
      setIsShipmentDetailsPanel(true);
  };

  const hasActiveFilters = 
    statusFilter !== 'All Statuses' || 
    filters.originWarehouse !== '' || 
    filters.carrier !== '' || 
    filters.dateRange !== '';

  // Helper to get status badge (duplicated from ShipmentsTable for the panel)
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

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  };


  return (
    <div className="flex flex-col h-full bg-[#161616] relative overflow-hidden animate-fade-in-fast">
      
      {/* Page Header */}
      <div className="px-4 md:px-6 pt-6 pb-4 shrink-0 flex flex-wrap gap-4 justify-between items-start">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-[#212121] rounded-lg border border-[#333] text-[#c6c6c6]">
                <Package size={20} />
            </div>
            <div>
                <h1 className="text-[24px] font-semibold text-[#f4f4f4] leading-tight">Manage Shipments</h1>
                <p className="text-[13px] text-[#8d8d8d] mt-1">Track, filter, and manage all shipments from your warehouse.</p>
            </div>
        </div>
        
        <button 
            onClick={() => onNavigate('create-shipment')}
            className="h-[40px] px-4 bg-[#0f62fe] hover:bg-[#0353e9] text-white text-[14px] font-medium flex items-center gap-2 whitespace-nowrap transition-all duration-200 shadow-lg shadow-[#0f62fe]/10 hover:shadow-[#0f62fe]/20 rounded-md"
        >
            <Plus size={18} />
            Create Shipment
        </button>
      </div>

      {/* Toolbar */}
      <div className="px-4 md:px-6">
        <ShipmentsToolbar 
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            onOpenFilters={() => setIsFilterPanelOpen(true)}
            filtersActive={hasActiveFilters}
        />
      </div>

      {/* Table Area */}
      <div className="flex-1 px-4 md:px-6 pb-4 min-h-0 overflow-y-auto md:overflow-hidden flex flex-col">
         {isLoading ? (
           <div className="flex flex-col items-center justify-center py-16 bg-[#212121] border border-[#393939] rounded-lg shadow-sm animate-fade-in-fast">
               <Loader2 size={32} className="text-[#0f62fe] animate-spin mb-4" />
               <p className="text-[16px] text-[#c6c6c6]">Loading shipments...</p>
           </div>
         ) : error ? (
           <div className="flex flex-col items-center justify-center py-16 bg-[#212121] border border-[#fa4d56] rounded-lg shadow-sm animate-fade-in-fast">
               <AlertCircle size={32} className="text-[#fa4d56] mb-4" />
               <p className="text-[16px] text-[#fa4d56]">Error: {error}</p>
               <button onClick={() => window.location.reload()} className="text-[#0f62fe] blue-text-readable text-[14px] mt-2 hover:underline">
                   Retry
               </button>
           </div>
         ) : (
           <ShipmentsTable 
              shipments={paginatedShipments}
              sortConfig={sortConfig}
              onSort={handleSort}
              onClearFilters={handleClearFilters}
              onPackShipment={handlePackShipment}
              onViewDetails={handleViewDetails} // Pass view details handler
           />
         )}
      </div>

      {/* Footer */}
      {/* Only show footer if not loading, no error, and if there are total items to paginate */}
      {!isLoading && !error && totalItems > 0 && (
        <div className="px-4 md:px-6 pb-6 shrink-0">
          <div className="bg-[#212121] border border-[#393939] rounded-b-lg rounded-t-none border-t-0">
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
      )}

      {/* Side Panel for Filters */}
      <ShipmentsFilterPanel 
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        currentFilters={filters}
        onApply={setFilters}
        onClear={() => setFilters(INITIAL_SHIPMENT_FILTERS)}
      />

      {/* Pack Shipment Panel */}
      <PackShipmentPanel 
        isOpen={isPackPanelOpen}
        onClose={() => setIsPackPanelOpen(false)}
        shipment={selectedShipmentForPacking}
        items={mockPackingItems} 
        onSave={handleSavePacking} // Updated to pass updatedShipment
      />

      {/* Shipment Details Panel */}
      {isShipmentDetailsPanelOpen && selectedShipmentForDetails && (
        <Portal>
          <div className="fixed inset-0 bg-[#161616]/60 z-[var(--z-modal-backdrop)] backdrop-blur-sm animate-fade-in-fast" onClick={() => setIsShipmentDetailsPanel(false)} />
          <div className="fixed top-0 right-0 h-full w-full md:w-[768px] bg-[#212121] border-l border-[#393939] shadow-2xl z-[var(--z-modal)] flex flex-col animate-slide-in-right">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#393939] flex items-center bg-[#262626] shrink-0">
              <button 
                onClick={() => setIsShipmentDetailsPanel(false)}
                className="flex items-center text-[#8d8d8d] hover:text-[#f4f4f4] text-[13px] transition-colors self-start mr-4"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back
              </button>
              <div className="flex-1 flex flex-col min-w-0">
                <h2 className="text-[20px] font-semibold text-[#f4f4f4] truncate" title={selectedShipmentForDetails.name}>{selectedShipmentForDetails.name}</h2>
                <p className="text-[14px] text-[#8d8d8d] font-mono mt-0.5 truncate">{selectedShipmentForDetails.shipmentId || 'No Shipment ID'}</p>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* SECTION: Shipment Overview */}
                <h3 className="text-[16px] font-bold text-[#f4f4f4] uppercase tracking-wide mb-4 mt-2">Shipment Overview</h3>
                <div className="bg-[#2a2a2a] p-4 rounded-xl border border-[#393939] flex flex-col gap-4 animate-slide-up-fade">
                    <div className="flex flex-col gap-1">
                        <span className="text-[20px] font-semibold text-[#f4f4f4] leading-tight">{selectedShipmentForDetails.name}</span>
                        <span className="text-[13px] text-[#8d8d8d] font-mono">{selectedShipmentForDetails.shipmentId || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-4 pt-3 border-t border-[#333]">
                        {getStatusBadge(selectedShipmentForDetails.status)}
                        {selectedShipmentForDetails.isPriority ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[12px] font-medium bg-[#0f62fe] text-white border border-[#0f62fe]">
                                Priority Shipment (Index: {selectedShipmentForDetails.priorityIndex || 'N/A'})
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[12px] font-medium bg-[#393939] text-[#c6c6c6] border border-[#525252]">
                                Normal Shipment
                            </span>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 pt-3 border-t border-[#333] text-[13px]">
                        <div>
                            <p className="text-[11px] text-[#757575] uppercase mb-0.5">Origin Warehouse</p>
                            <p className="text-[#c6c6c6] flex items-center gap-1"><MapPin size={12} className="text-[#8d8d8d]"/> {selectedShipmentForDetails.originWarehouse}</p>
                        </div>
                        <div>
                            <p className="text-[11px] text-[#757575] uppercase mb-0.5">Destination</p>
                            <p className="text-[#c6c6c6] truncate">{selectedShipmentForDetails.destination}</p>
                        </div>
                        <div>
                            <p className="text-[11px] text-[#757575] uppercase mb-0.5">Carrier</p>
                            <p className="text-[#c6c6c6] flex items-center gap-1"><Truck size={12} className="text-[#8d8d8d]"/> {selectedShipmentForDetails.carrier}</p>
                        </div>
                        <div>
                            <p className="text-[11px] text-[#757575] uppercase mb-0.5">Total Items</p>
                            <p className="text-[#f4f4f4] font-mono">{selectedShipmentForDetails.totalItems}</p>
                        </div>
                        <div>
                            <p className="text-[11px] text-[#757575] uppercase mb-0.5">Created Date</p>
                            <p className="text-[#c6c6c6]">{formatDate(selectedShipmentForDetails.createdDate)}</p>
                        </div>
                        <div>
                            <p className="text-[11px] text-[#757575] uppercase mb-0.5">Last Updated</p>
                            <p className="text-[#c6c6c6]">{formatDate(selectedShipmentForDetails.lastUpdated)}</p>
                        </div>
                    </div>
                </div>

                {/* SECTION: Shipment Contents */}
                <div className="w-full border-t border-[#393939] pt-6" />
                <h3 className="text-[16px] font-bold text-[#f4f4f4] uppercase tracking-wide mb-4">Shipment Contents</h3>
                <div className="animate-slide-up-fade" style={{ animationDelay: '50ms' }}>
                    {selectedShipmentForDetails.items && selectedShipmentForDetails.items.length > 0 ? (
                        <div className="space-y-2 bg-[#2a2a2a] p-4 rounded-xl border border-[#393939]">
                            {selectedShipmentForDetails.items.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between text-[13px] border-b border-[#333] last:border-0 py-2 first:pt-0 last:pb-0">
                                    <div className="flex-1">
                                        <div className="font-medium text-[#f4f4f4]">{item.sku}</div>
                                        <div className="text-[11px] text-[#8d8d8d]">{item.name || 'Product Name N/A'}</div>
                                    </div>
                                    <span className="font-mono text-[#c6c6c6]">{item.quantity} units</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-[13px] text-[#8d8d8d] italic bg-[#2a2a2a] p-4 rounded-xl border border-[#393939]">No items defined for this shipment.</p>
                    )}
                </div>

                {/* SECTION: Packing Summary */}
                <div className="w-full border-t border-[#393939] pt-6" />
                <h3 className="text-[16px] font-bold text-[#f4f4f4] uppercase tracking-wide mb-4">Packing Summary</h3>
                <div className="animate-slide-up-fade" style={{ animationDelay: '100ms' }}>
                    {selectedShipmentForDetails.packingLines && selectedShipmentForDetails.packingLines.length > 0 ? (
                        <div className="space-y-4 bg-[#2a2a2a] p-4 rounded-xl border border-[#393939]">
                            <div className="flex justify-between text-[14px] font-medium text-[#f4f4f4] border-b border-[#333] pb-2 mb-2">
                                <span>Total Box Types Defined:</span>
                                <span>{selectedShipmentForDetails.packingLines.length}</span>
                            </div>
                            <div className="flex justify-between text-[14px] font-medium text-[#f4f4f4]">
                                <span>Total Physical Boxes:</span>
                                <span>{selectedShipmentForDetails.packingLines.reduce((sum, line) => sum + line.boxCount, 0)}</span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-[13px] text-[#8d8d8d] italic bg-[#2a2a2a] p-4 rounded-xl border border-[#393939]">No packing summary available yet.</p>
                    )}
                </div>

                {/* SECTION: Packing Lines */}
                <div className="w-full border-t border-[#393939] pt-6" />
                <h3 className="text-[16px] font-bold text-[#f4f4f4] uppercase tracking-wide mb-4">Packing Lines</h3>
                <div className="animate-slide-up-fade" style={{ animationDelay: '150ms' }}>
                    {selectedShipmentForDetails.packingLines && selectedShipmentForDetails.packingLines.length > 0 ? (
                        <div className="space-y-4">
                            {selectedShipmentForDetails.packingLines.map((line, idx) => (
                                <div key={idx} className="bg-[#1f1f1f] p-4 rounded-xl border border-[#333]">
                                    {/* Box Header */}
                                    <h4 className="text-[16px] font-bold text-[#0f62fe] mb-3 pb-2 border-b border-[#333]">Box {idx + 1}</h4>
                                    
                                    {/* Subdetails */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-y-3 gap-x-4 text-[13px] mb-4">
                                        <div className="flex items-center gap-2 text-[#c6c6c6]">
                                            <Package size={14} className="text-[#8d8d8d]"/>
                                            <span>Count: <span className="font-medium text-[#f4f4f4]">{line.boxCount} boxes</span></span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[#c6c6c6]">
                                            <Ruler size={14} className="text-[#8d8d8d]"/>
                                            <span>Dimensions: <span className="font-medium text-[#f4f4f4]">{line.dimensions.length}x{line.dimensions.width}x{line.dimensions.height} {line.dimensions.unit}</span></span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[#c6c6c6]">
                                            <Weight size={14} className="text-[#8d8d8d]"/>
                                            <span>Weight: <span className="font-medium text-[#f4f4f4]">{line.weight} {line.weightUnit}</span></span>
                                        </div>
                                    </div>

                                    {/* Units per box section */}
                                    <div className="pt-3 border-t border-[#333]">
                                        <h5 className="text-[14px] font-semibold text-[#c6c6c6] mb-2">Units per box:</h5>
                                        <div className="grid grid-cols-2 text-[13px] bg-[#2a2a2a] p-3 rounded">
                                            <span className="font-bold text-[#8d8d8d] border-b border-[#393939] pb-1">SKU</span>
                                            <span className="font-bold text-[#8d8d8d] border-b border-[#393939] pb-1 text-right">Quantity</span>
                                            {line.unitsPerBox.map((unit, unitIdx) => (
                                                <React.Fragment key={unitIdx}>
                                                    <span className="text-[#e0e0e0] pt-2">{unit.sku}</span>
                                                    <span className="font-mono text-[#f4f4f4] pt-2 text-right">{unit.quantity}</span>
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-[13px] text-[#8d8d8d] italic bg-[#2a2a2a] p-4 rounded-xl border border-[#393939]">No packing lines defined yet.</p>
                    )}
                </div>

            </div>
          </div>
        </Portal>
      )}

    </div>
  );
};

export default ManageShipmentsPage;