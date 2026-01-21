import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, Package, ChevronDown, Pencil, XCircle, MoreVertical,
  MapPin, Calendar, FileText, CheckCircle2, AlertCircle, Truck
} from 'lucide-react';
import { Portal } from '../App';
import { Shipment, ShipmentStatus } from '../types';
import { useShipments } from '../hooks/useShipments';
import ShipmentsToolbar from './shipments/ShipmentsToolbar';
import ShipmentsTable from './shipments/ShipmentsTable';
import ShipmentsFilterPanel from './shipments/ShipmentsFilterPanel';
import ItemsPaginationFooter from './items/ItemsPaginationFooter';
import PackShipmentPanel from './shipments/PackShipmentPanel';

interface ManageShipmentsPageProps {
  onNavigate: (view: string) => void;
}

const ManageShipmentsPage: React.FC<ManageShipmentsPageProps> = ({ onNavigate }) => {
  // Main List View State
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // Data Hook
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
     refresh
  } = useShipments();

  // Details / Edit / Pack State
  const [isShipmentDetailsPanel, setIsShipmentDetailsPanel] = useState(false);
  const [selectedShipmentForDetails, setSelectedShipmentForDetails] = useState<Shipment | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [isPackPanelOpen, setIsPackPanelOpen] = useState(false);
  const [shipmentToPack, setShipmentToPack] = useState<Shipment | null>(null);

  // Actions Dropdown in Details Header
  const [isActionsDropdownOpen, setIsActionsDropdownOpen] = useState(false);
  const actionsDropdownRef = useRef<HTMLButtonElement>(null);

  // Close actions dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        // We handle this via the overlay in the Portal, but just in case
        if (actionsDropdownRef.current && !actionsDropdownRef.current.contains(event.target as Node)) {
             // Logic handled by overlay usually
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const handleViewDetails = (shipment: Shipment) => {
      setSelectedShipmentForDetails(shipment);
      setIsShipmentDetailsPanel(true);
      setIsEditMode(false);
      setIsActionsDropdownOpen(false);
  };

  const handlePackShipment = (shipment: Shipment) => {
      setShipmentToPack(shipment);
      setIsPackPanelOpen(true);
      setIsActionsDropdownOpen(false); // Close dropdown if open from details view
  };

  const handlePackSave = async (updatedShipment: Shipment) => {
    refresh(); // Refresh the list
    if (selectedShipmentForDetails && selectedShipmentForDetails.shipmentId === updatedShipment.shipmentId) {
        setSelectedShipmentForDetails(updatedShipment);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // --- Render Details View ---
  if (isShipmentDetailsPanel && selectedShipmentForDetails) {
    return (
        <div className="flex flex-col h-full bg-[var(--bg-0)] animate-fade-in-fast relative">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[var(--border-1)] flex items-center bg-[var(--bg-1)] shrink-0">
              <button 
                type="button"
                onClick={() => { setIsShipmentDetailsPanel(false); setIsEditMode(false); }}
                className="flex items-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] text-[13px] transition-colors self-start mr-4"
                aria-label="Back to Shipments"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back
              </button>
              <div className="flex-1 flex flex-col min-w-0">
                <h2 className="text-[20px] font-semibold text-[var(--text-primary)] truncate" title={selectedShipmentForDetails.name}>{selectedShipmentForDetails.name}</h2>
                <p className="text-[14px] text-[var(--text-tertiary)] font-mono mt-0.5 truncate">{selectedShipmentForDetails.shipmentId || 'No Shipment ID'}</p>
              </div>

              {/* Action Buttons: Pack Shipment + Dropdown */}
              <div className="flex items-center ml-4 relative">
                {selectedShipmentForDetails.status !== 'Cancelled' && (
                    <button 
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        handlePackShipment(selectedShipmentForDetails);
                    }}
                    className="h-[32px] px-3 bg-[#0f62fe] hover:bg-[#0353e9] text-white text-[13px] font-medium flex items-center gap-1 whitespace-nowrap transition-all duration-200 shadow-sm rounded-l-md"
                    >
                    <Package size={14} /> Pack Shipment
                    </button>
                )}
                <button
                  type="button"
                  ref={actionsDropdownRef}
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setIsActionsDropdownOpen((prev) => !prev); 
                  }}
                  className={`h-[32px] w-[32px] bg-[#0f62fe] hover:bg-[#0353e9] text-white flex items-center justify-center rounded-r-md transition-colors border-l border-[#0043ce] ${selectedShipmentForDetails.status === 'Cancelled' ? 'rounded-md border-0' : ''}`}
                  aria-label="More actions"
                  aria-haspopup="true"
                  aria-expanded={isActionsDropdownOpen}
                >
                  <ChevronDown size={16} className={`transition-transform duration-200 ${isActionsDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isActionsDropdownOpen && (
                  <Portal>
                    {/* Transparent overlay to handle clicking outside the dropdown */}
                    <div 
                        className="fixed inset-0 z-[1305]" 
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsActionsDropdownOpen(false);
                        }}
                    />
                    <div
                      id="shipment-actions-dropdown"
                      className="fixed bg-[var(--bg-1)] border border-[var(--border-1)] rounded shadow-xl py-1 animate-drop-down origin-top-right"
                      style={{
                        top: (actionsDropdownRef.current?.getBoundingClientRect().bottom || 0) + 4,
                        left: (actionsDropdownRef.current?.getBoundingClientRect().right || 0) - 180 + 32, // align right
                        width: '180px',
                        zIndex: 1310, 
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button 
                        type="button"
                        onClick={() => { setIsEditMode(true); setIsActionsDropdownOpen(false); }}
                        className="w-full text-left px-4 py-2.5 text-[13px] text-[var(--text-secondary)] hover:bg-[var(--bg-2)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-2"
                      >
                        <Pencil size={14} /> Edit Shipment
                      </button>
                      <div className="h-[1px] bg-[var(--border-1)] my-1"></div>
                      <button 
                        type="button"
                        onClick={() => { 
                            console.log('Cancel Shipment clicked');
                            setIsActionsDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-[13px] text-[#ff8389] hover:bg-[#da1e28]/10 transition-colors flex items-center gap-2"
                      >
                        <XCircle size={14} /> Cancel Shipment
                      </button>
                    </div>
                  </Portal>
                )}
              </div>
            </div>
            
            {/* Detail Body */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-[var(--bg-1)] p-4 rounded border border-[var(--border-1)]">
                        <div className="text-[12px] text-[var(--text-tertiary)] uppercase mb-1">Status</div>
                        <div className="text-[var(--text-primary)] font-medium">{selectedShipmentForDetails.status}</div>
                    </div>
                    <div className="bg-[var(--bg-1)] p-4 rounded border border-[var(--border-1)]">
                        <div className="text-[12px] text-[var(--text-tertiary)] uppercase mb-1">Origin / Destination</div>
                        <div className="text-[var(--text-primary)] text-[14px]">{selectedShipmentForDetails.originWarehouse}</div>
                        <div className="text-[var(--text-tertiary)] text-[12px]">to {selectedShipmentForDetails.destination}</div>
                    </div>
                    <div className="bg-[var(--bg-1)] p-4 rounded border border-[var(--border-1)]">
                        <div className="text-[12px] text-[var(--text-tertiary)] uppercase mb-1">Carrier</div>
                        <div className="text-[var(--text-primary)]">{selectedShipmentForDetails.carrier}</div>
                    </div>
                </div>

                <h3 className="text-[16px] font-semibold text-[var(--text-primary)] mb-4">Shipment Contents</h3>
                <div className="bg-[var(--bg-1)] border border-[var(--border-1)] rounded overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[var(--border-1)] bg-[var(--bg-2)] text-[12px] text-[var(--text-tertiary)] uppercase">
                                <th className="px-4 py-3 font-semibold">SKU</th>
                                <th className="px-4 py-3 font-semibold">Name</th>
                                <th className="px-4 py-3 font-semibold text-right">Quantity</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-1)] text-[14px] text-[var(--text-secondary)]">
                            {selectedShipmentForDetails.items && selectedShipmentForDetails.items.length > 0 ? (
                                selectedShipmentForDetails.items.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-[var(--bg-2)] transition-colors">
                                        <td className="px-4 py-3 font-mono text-[var(--text-primary)]">{item.sku}</td>
                                        <td className="px-4 py-3">{item.name || <span className="text-[var(--text-tertiary)] italic">No name provided</span>}</td>
                                        <td className="px-4 py-3 text-right font-mono text-[var(--text-primary)]">{item.quantity}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} className="px-4 py-8 text-center text-[var(--text-tertiary)]">No items in this shipment.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

             {/* Pack Panel (if opened from details) */}
            <PackShipmentPanel 
                isOpen={isPackPanelOpen}
                onClose={() => setIsPackPanelOpen(false)}
                shipment={shipmentToPack}
                items={shipmentToPack?.items || []} 
                onSave={handlePackSave}
            />
        </div>
    );
  }

  // --- Render List View ---
  return (
    <div className="flex flex-col h-full relative overflow-hidden">
       {/* List Header */}
       <div className="px-6 pt-6 pb-2 shrink-0 animate-fade-in-fast">
        <h1 className="text-[24px] font-semibold text-[var(--text-primary)]">Manage Shipments</h1>
        <p className="text-[14px] text-[var(--text-tertiary)]">View and manage all your shipments.</p>
       </div>
       
       <div className="px-6">
           <ShipmentsToolbar 
             searchQuery={searchQuery}
             onSearchChange={setSearchQuery}
             statusFilter={statusFilter}
             onStatusChange={setStatusFilter}
             onOpenFilters={() => setIsFilterPanelOpen(true)}
             filtersActive={filters.originWarehouse !== '' || filters.carrier !== '' || filters.dateRange !== ''}
             onRefresh={refresh}
             isLoading={isLoading}
           />
       </div>

       <ShipmentsTable 
         shipments={paginatedShipments}
         sortConfig={sortConfig}
         onSort={handleSort}
         onClearFilters={() => {
             setSearchQuery('');
             setStatusFilter('All Statuses');
             setFilters({ originWarehouse: '', carrier: '', dateRange: '' });
         }}
         onPackShipment={handlePackShipment}
         onViewDetails={handleViewDetails}
       />
       
       <div className="px-6 pb-6 bg-transparent">
        <div className="bg-[var(--bg-1)] border-x border-b border-[var(--border-1)] rounded-b-lg">
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

      <ShipmentsFilterPanel 
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        currentFilters={filters}
        onApply={setFilters}
        onClear={() => setFilters({ originWarehouse: '', carrier: '', dateRange: '' })}
      />

      <PackShipmentPanel 
        isOpen={isPackPanelOpen}
        onClose={() => setIsPackPanelOpen(false)}
        shipment={shipmentToPack}
        items={shipmentToPack?.items || []} 
        onSave={handlePackSave}
      />
    </div>
  );
};

export default ManageShipmentsPage;