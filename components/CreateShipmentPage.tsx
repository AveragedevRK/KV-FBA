import React, { useState, useRef, useEffect, Fragment, useCallback } from 'react';
import { 
  Plus, 
  Trash, 
  Search, 
  ArrowLeft, 
  Loader2, 
  Package, 
  AlertCircle, 
  CheckCircle2,
  Pencil
} from 'lucide-react';
import { Portal } from '../App';
import { fetchProducts, Product } from '../api/products'; // Import Product type

interface CreateShipmentPageProps {
  onNavigate: (view: string) => void;
}

// Custom debounce utility
export const debounce = <T extends (...args: any[]) => void>(func: T, delay: number) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  const debounced = function(this: any, ...args: Parameters<T>) {
    const context = this;
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func.apply(context, args), delay);
  } as T & { cancel: () => void }; // Add .cancel() method

  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return debounced;
};


interface ShipmentItemRow {
  id: string;
  sku: string;
  asin: string;
  quantity: number | '';
  productName: string;
  isAsinEditable: boolean;
  error?: {
    sku?: string;
    asin?: string;
    quantity?: string;
  };
}

const CreateShipmentPage: React.FC<CreateShipmentPageProps> = ({ onNavigate }) => {
  const [shipmentName, setShipmentName] = useState('');
  const [shipmentId, setShipmentId] = useState(''); // New: Shipment ID state
  const [items, setItems] = useState<ShipmentItemRow[]>([
    { id: crypto.randomUUID(), sku: '', asin: '', quantity: '', productName: '', isAsinEditable: false }
  ]);
  const [errors, setErrors] = useState<{ name?: string; global?: string; shipmentId?: string }>({}); // Updated error state type
  const [isSaving, setIsSaving] = useState(false);
  const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [isLoadingSku, setIsLoadingSku] = useState<Record<string, boolean>>({}); // Loading state per SKU input (for the exact match autofill)

  // NEW: State for API fetched suggestions for the dropdown
  const [apiSuggestions, setApiSuggestions] = useState<Product[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);

  const searchInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null); // For exact match autofill

  // NEW: Debounced function for fetching dropdown suggestions
  const debouncedFetchSuggestions = useCallback(
    debounce(async (term: string) => {
      if (term.length < 2) {
        setApiSuggestions([]);
        setIsSuggestionsLoading(false);
        return;
      }
      setIsSuggestionsLoading(true);
      try {
        const response = await fetchProducts({ search: term });
        setApiSuggestions(response.data);
      } catch (error) {
        console.error("Error fetching product suggestions:", error);
        setApiSuggestions([]);
      } finally {
        setIsSuggestionsLoading(false);
      }
    }, 300), // 300ms debounce for suggestions
    []
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeSearchIndex !== null) {
        const inputElement = searchInputRefs.current[activeSearchIndex];
        const dropdownElement = document.getElementById(`product-search-dropdown-${activeSearchIndex}`);
        
        if (inputElement && !inputElement.contains(event.target as Node) &&
            dropdownElement && !dropdownElement.contains(event.target as Node)) {
          setActiveSearchIndex(null);
          setApiSuggestions([]); // Clear suggestions when closing dropdown
          setSearchTerm(''); // Clear search term as well
          debouncedFetchSuggestions.cancel(); // Cancel any pending suggestion fetches
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        debouncedFetchSuggestions.cancel(); // Cleanup on unmount
    };
  }, [activeSearchIndex, debouncedFetchSuggestions]);

  // Track dirty state
  useEffect(() => {
    if (shipmentId || shipmentName || items.some(i => i.sku || i.asin || i.quantity)) { // Added shipmentId
      setIsDirty(true);
    }
  }, [shipmentId, shipmentName, items]); // Added shipmentId

  const addBoxType = () => { // This function seems unused, should be handleAddItem
    setItems(prev => [
      ...prev,
      { id: crypto.randomUUID(), sku: '', asin: '', quantity: '', productName: '', isAsinEditable: false }
    ]);
  };

  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      { id: crypto.randomUUID(), sku: '', asin: '', quantity: '', productName: '', isAsinEditable: false }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof ShipmentItemRow, value: any) => {
    setItems(prev => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };
      
      if (newItems[index].error) {
        if (field === 'sku') delete newItems[index].error!.sku;
        if (field === 'asin') delete newItems[index].error!.asin;
        if (field === 'quantity') delete newItems[index].error!.quantity;
      }
      return newItems;
    });
  };

  const handleToggleAsinEditable = (index: number) => {
    setItems(prev => prev.map((item, idx) => 
      idx === index ? { ...item, isAsinEditable: !item.isAsinEditable } : item
    ));
  };

  // This `lookupProduct` is for autofilling ASIN/productName when a user types a SKU and pauses.
  const lookupProduct = useCallback(async (index: number, sku: string) => {
    // Only attempt to lookup if the SKU isn't empty and is potentially a full SKU for autofill
    if (!sku.trim()) {
        setItems(prev => prev.map((item, idx) => 
            idx === index 
                ? { ...item, asin: '', productName: '', isAsinEditable: false } 
                : item
        ));
        return;
    }

    setIsLoadingSku(prev => ({ ...prev, [index]: true }));
    try {
      const response = await fetchProducts({ search: sku, limit: 1 });
      if (response.data.length > 0) {
        const product = response.data[0];
        // Only autofill if the API returned product's SKU exactly matches the typed SKU (case-insensitive)
        if (product.sku.toLowerCase() === sku.toLowerCase()) {
            setItems(prev => prev.map((item, idx) => 
                idx === index 
                    ? { ...item, asin: product.asin, productName: product.productName, isAsinEditable: false } 
                    : item
            ));
        } else {
            // If API returned a product but it's not an exact SKU match (e.g., partial search returned one),
            // we should not autofill ASIN, but can update product name if desired.
            // For now, let's keep ASIN empty and product name empty if not exact match.
             setItems(prev => prev.map((item, idx) => 
                idx === index 
                    ? { ...item, asin: '', productName: '' } 
                    : item
            ));
        }
      } else {
        // Clear ASIN and product name if no product found for the exact SKU
        setItems(prev => prev.map((item, idx) => 
            idx === index 
                ? { ...item, asin: '', productName: '' } 
                : item
        ));
      }
    } catch (error) {
      console.error("Error fetching product by SKU:", error);
       setItems(prev => prev.map((item, idx) => 
            idx === index 
                ? { ...item, asin: '', productName: '' } 
                : item
        ));
    } finally {
      setIsLoadingSku(prev => ({ ...prev, [index]: false }));
    }
  }, []); // Empty dependency array, lookupProduct will fetch current state on each call

  const handleSkuSearch = (index: number, term: string) => {
    setSearchTerm(term);
    setActiveSearchIndex(index);
    updateItem(index, 'sku', term);

    if (term === '') {
      updateItem(index, 'productName', '');
      updateItem(index, 'asin', '');
      setApiSuggestions([]); // Clear dropdown suggestions
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
      debouncedFetchSuggestions.cancel(); // Cancel any pending suggestion fetches
      return;
    }

    // Trigger debounced suggestion fetch for the dropdown
    debouncedFetchSuggestions(term);

    // Existing debounce logic for autofilling ASIN/productName if an exact match is found (after user stops typing)
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      lookupProduct(index, term);
    }, 500); // 500ms debounce for autofill (for when user finishes typing a full SKU)
  };

  const selectProduct = (index: number, product: Pick<Product, 'sku' | 'productName' | 'asin'>) => {
    updateItem(index, 'sku', product.sku);
    updateItem(index, 'asin', product.asin);
    updateItem(index, 'productName', product.productName);
    updateItem(index, 'isAsinEditable', false); // Lock ASIN after selection
    setSearchTerm(''); // Clear search term after selection
    setActiveSearchIndex(null); // Close dropdown
    setApiSuggestions([]); // Clear suggestions after selection
    debouncedFetchSuggestions.cancel(); // Cancel any pending suggestion fetches
  };

  const validateForm = () => {
    const newErrors: { name?: string; global?: string; shipmentId?: string } = {}; // Updated error type
    let isValid = true;
    
    // Validate Shipment ID
    if (!shipmentId.trim()) {
        newErrors.shipmentId = 'Shipment ID is required.';
        isValid = false;
    } else if (shipmentId.length < 3) {
        newErrors.shipmentId = 'Shipment ID must be at least 3 characters.';
        isValid = false;
    }

    // Validate Shipment Name
    if (!shipmentName.trim()) {
      newErrors.name = 'Shipment name is required.';
      isValid = false;
    } else if (shipmentName.length < 3) {
      newErrors.name = 'Shipment name must be at least 3 characters.';
      isValid = false;
    }

    // Validate Items
    const newItems = items.map(item => {
      const itemErrors: { sku?: string; asin?: string; quantity?: string } = {};
      let itemValid = true;

      if (!item.sku.trim()) {
        itemErrors.sku = 'SKU is required.';
        itemValid = false;
      }

      if (!item.asin.trim()) {
        itemErrors.asin = 'ASIN is required.';
        itemValid = false;
      } else if (!/^[A-Z0-9]{10}$/.test(item.asin)) {
        itemErrors.asin = 'Invalid ASIN (10 alphanumeric chars).';
        itemValid = false;
      }

      if (item.quantity === '' || Number(item.quantity) < 1) {
        itemErrors.quantity = 'Quantity must be at least 1.';
        itemValid = false;
      }

      if (!itemValid) isValid = false;
      return { ...item, error: itemErrors };
    });

    setItems(newItems);
    setErrors(newErrors);
    return isValid;
  };

  const handleSave = async () => {
    if (!validateForm()) {
        setErrors(prev => ({ ...prev, global: "Please correct the highlighted errors." }));
        return;
    }
    setErrors({}); // Clear global errors if validation passes

    setIsSaving(true);
    
    try {
        const shipmentContents = items.map(item => ({
            sku: item.sku,
            asin: item.asin,
            quantity: Number(item.quantity)
        }));

        const response = await fetch('https://kv-fba-api.onrender.com/api/shipments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                shipmentId, // New: Include shipmentId
                shipmentName,
                shipmentContents,
            }),
        });

        const responseData = await response.json();

        if (!response.ok || !responseData.success) {
            throw new Error(responseData.message || 'Failed to create shipment.');
        }
        
        // Success
        setIsDirty(false);
        alert("Shipment created successfully!"); 
        onNavigate('manage-shipments'); // Navigate to manage shipments page
    } catch (err: any) {
        console.error("API Error creating shipment:", err);
        setErrors(prev => ({ ...prev, global: err.message || "An unexpected error occurred." }));
    } finally {
        setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      if (window.confirm("You have unsaved changes. Are you sure you want to discard them?")) {
        onNavigate('dashboard');
      }
    } else {
      onNavigate('dashboard');
    }
  };

  // Reusable Styles
  const inputBaseClasses = "w-full h-[48px] bg-[var(--bg-1)] border border-[var(--border-1)] rounded-md text-[14px] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[#0f62fe] focus:ring-1 focus:ring-[#0f62fe]/20 transition-all";

  return (
    <div className="w-full h-full bg-[var(--bg-0)] flex flex-col overflow-y-auto animate-fade-in-fast">
      
      {/* Page Header (Transparent/Blend) */}
      <div className="px-4 md:px-8 py-6 shrink-0 bg-[var(--bg-0)] sticky top-0 z-30 flex flex-col gap-4">
        <button 
          onClick={handleCancel}
          className="flex items-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] text-[13px] transition-colors self-start"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Dashboard
        </button>
        <div className="flex items-center gap-4">
            <div className="p-2.5 bg-[var(--bg-1)] rounded-lg border border-[var(--border-1)] text-[var(--text-primary)]">
                <Package size={24} strokeWidth={1.5} />
            </div>
            <div>
                <h1 className="text-[24px] font-semibold text-[var(--text-primary)] tracking-tight">Create Shipment</h1>
                <p className="text-[13px] text-[var(--text-tertiary)] mt-0.5 font-normal">Define shipment details and add items from your inventory.</p>
            </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 px-4 md:px-8 pb-12 max-w-4xl mx-auto w-full relative">
        
        {/* Main Card */}
        <div className="bg-[var(--bg-1)] rounded-xl border border-[var(--border-1)] shadow-xl overflow-hidden animate-slide-up-fade ring-1 ring-white/5">
            
            {/* Form Body */}
            <div className="p-6 md:p-10 space-y-8">
                
                {/* Shipment ID Section */}
                <div className="space-y-3 max-w-lg">
                    <label className="text-[14px] font-medium text-[var(--text-primary)]">
                        Shipment ID <span className="text-[#ff8389]/80">*</span>
                    </label>
                    <input 
                        type="text" 
                        value={shipmentId}
                        onChange={(e) => {
                            setShipmentId(e.target.value);
                            if (errors.shipmentId) setErrors(prev => ({ ...prev, shipmentId: undefined }));
                        }}
                        placeholder="e.g., SHIP-FBA-2025-001"
                        className={`${inputBaseClasses} px-4 
                            ${errors.shipmentId 
                                ? 'border-[#ff8389] focus:border-[#ff8389] focus:ring-[#ff8389]/20' 
                                : ''}
                        `}
                    />
                    {errors.shipmentId ? (
                        <p className="text-[12px] text-[#ff8389] flex items-center gap-1 mt-1 animate-slide-in-right">
                           <AlertCircle size={12} /> {errors.shipmentId}
                        </p>
                    ) : (
                        <p className="text-[12px] text-[var(--text-tertiary)]">
                            A unique identifier for this shipment.
                        </p>
                    )}
                </div>

                {/* Shipment Name Section */}
                <div className="space-y-3 max-w-lg">
                    <label className="text-[14px] font-medium text-[var(--text-primary)]">
                        Shipment Name <span className="text-[#ff8389]/80">*</span>
                    </label>
                    <input 
                        type="text" 
                        value={shipmentName}
                        onChange={(e) => {
                            setShipmentName(e.target.value);
                            if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
                        }}
                        placeholder="e.g., Amazon FBA – May 12"
                        className={`${inputBaseClasses} px-4 
                            ${errors.name 
                                ? 'border-[#ff8389] focus:border-[#ff8389] focus:ring-[#ff8389]/20' 
                                : ''}
                        `}
                    />
                    {errors.name ? (
                        <p className="text-[12px] text-[#ff8389] flex items-center gap-1 mt-1 animate-slide-in-right">
                           <AlertCircle size={12} /> {errors.name}
                        </p>
                    ) : (
                        <p className="text-[12px] text-[var(--text-tertiary)]">
                            Give this shipment a descriptive name for easier tracking.
                        </p>
                    )}
                </div>

                {/* Gentle Divider */}
                <div className="w-full border-t border-[var(--border-1)]" />

                {/* Shipment Contents Section */}
                <div className="space-y-6">
                    <div className="flex items-end justify-between">
                        <div>
                            <h3 className="text-[18px] font-medium text-[var(--text-primary)]">Shipment Contents</h3>
                            <p className="text-[12px] text-[var(--text-tertiary)] mt-1">Add items you wish to include in this shipment.</p>
                        </div>
                        <span className="text-[12px] font-mono text-[var(--text-tertiary)] bg-[var(--bg-2)] px-2 py-1 rounded border border-[var(--border-1)]">{items.length} item{items.length !== 1 ? 's' : ''}</span>
                    </div>
                    
                    <div className="space-y-4 overflow-visible">
                        {items.map((item, index) => (
                            <div 
                                key={item.id} 
                                className="group relative bg-[var(--bg-2)] p-5 border border-[var(--border-1)] rounded-lg hover:border-[var(--border-2)] transition-all animate-slide-up-fade"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                                    
                                    {/* SKU Input */}
                                    <div className="col-span-12 md:col-span-5 relative">
                                        <label className="text-[13px] text-[var(--text-tertiary)] mb-2 block font-medium">Product SKU <span className="text-[#ff8389]/80">*</span></label>
                                        <div className="relative">
                                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                                            <input 
                                                type="text" 
                                                value={item.sku}
                                                onChange={(e) => handleSkuSearch(index, e.target.value)}
                                                onFocus={() => {
                                                    setActiveSearchIndex(index);
                                                    setSearchTerm(item.sku);
                                                    if (item.sku) debouncedFetchSuggestions(item.sku); // Load suggestions on focus if not empty
                                                }}
                                                ref={el => { searchInputRefs.current[index] = el; }}
                                                placeholder="Search by SKU or name..."
                                                className={`${inputBaseClasses} pl-10 pr-4 
                                                    ${item.error?.sku ? 'border-[#ff8389] focus:border-[#ff8389]' : ''}
                                                `}
                                            />
                                            {isLoadingSku[index] && (
                                              <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] animate-spin" />
                                            )}
                                        </div>
                                        
                                        {item.productName && (
                                            <p className="text-[12px] text-[#0f62fe] blue-text-readable mt-1.5 flex items-center gap-1.5 opacity-90">
                                                <CheckCircle2 size={13} /> {item.productName}
                                            </p>
                                        )}
                                        
                                        {item.error?.sku && (
                                            <p className="text-[12px] text-[#ff8389] mt-1.5 flex items-center gap-1">
                                                <AlertCircle size={12} /> {item.error.sku}
                                            </p>
                                        )}

                                        {/* Dropdown Suggestions (rendered in Portal) */}
                                        {activeSearchIndex === index && searchTerm && ( // Only show if searchTerm is not empty
                                            <Portal>
                                                <div 
                                                    id={`product-search-dropdown-${index}`}
                                                    className="absolute bg-[var(--bg-1)] border border-[var(--border-1)] rounded-md shadow-2xl z-[var(--z-dropdown)] max-h-[220px] overflow-y-auto mt-1 animate-drop-down ring-1 ring-black/20"
                                                    style={{
                                                        top: (searchInputRefs.current[index]?.getBoundingClientRect().bottom || 0) + window.scrollY + 5, // 5px offset
                                                        left: searchInputRefs.current[index]?.getBoundingClientRect().left || 0,
                                                        width: searchInputRefs.current[index]?.getBoundingClientRect().width || 'auto',
                                                    }}
                                                >
                                                    {isSuggestionsLoading ? (
                                                        <div className="px-4 py-4 text-[13px] text-[var(--text-tertiary)] text-center italic flex items-center justify-center gap-2">
                                                            <Loader2 size={16} className="animate-spin" /> Loading suggestions...
                                                        </div>
                                                    ) : apiSuggestions.length > 0 ? (
                                                        apiSuggestions.map(product => (
                                                            <div 
                                                                key={product._id}
                                                                onClick={() => selectProduct(index, product)}
                                                                className="px-4 py-3 hover:bg-[var(--bg-2)] cursor-pointer text-[14px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex flex-col border-b border-[var(--border-1)] last:border-0 transition-colors"
                                                            >
                                                                <span className="font-medium text-[var(--text-primary)] mb-0.5">{product.sku}</span>
                                                                <span className="text-[12px] text-[var(--text-tertiary)]">{product.productName}</span>
                                                                <span className="text-[10px] text-[var(--text-tertiary)] font-mono mt-0.5">ASIN: {product.asin}</span>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="px-4 py-4 text-[13px] text-[var(--text-tertiary)] text-center italic">
                                                            {searchTerm.length < 2 ? 'Type at least 2 characters to search' : 'No matching products'}
                                                        </div>
                                                    )}
                                                </div>
                                            </Portal>
                                        )}
                                    </div>

                                    {/* ASIN Input */}
                                    <div className="col-span-12 md:col-span-4 relative">
                                        <label className="text-[13px] text-[var(--text-tertiary)] mb-2 block font-medium">ASIN <span className="text-[#ff8389]/80">*</span></label>
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                value={item.asin}
                                                onChange={(e) => updateItem(index, 'asin', e.target.value)}
                                                readOnly={!item.isAsinEditable}
                                                placeholder="B0XXXXXXX"
                                                className={`${inputBaseClasses} pl-4 pr-10 
                                                    ${item.error?.asin ? 'border-[#ff8389] focus:border-[#ff8389]' : ''}
                                                    ${!item.isAsinEditable ? 'bg-[var(--bg-2)] text-[var(--text-tertiary)] border-[var(--border-1)]' : ''}
                                                `}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleToggleAsinEditable(index)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-1 rounded hover:bg-[var(--bg-2)] transition-colors"
                                                title={item.isAsinEditable ? "Lock ASIN" : "Edit ASIN"}
                                            >
                                                <Pencil size={16} />
                                            </button>
                                        </div>
                                        {item.error?.asin && (
                                            <p className="text-[12px] text-[#ff8389] mt-1.5 flex items-center gap-1">
                                                <AlertCircle size={12} /> {item.error.asin}
                                            </p>
                                        )}
                                    </div>

                                    {/* Quantity Input */}
                                    <div className="col-span-12 md:col-span-2">
                                        <label className="text-[13px] text-[var(--text-tertiary)] mb-2 block font-medium">Quantity <span className="text-[#ff8389]/80">*</span></label>
                                        <input 
                                            type="number" 
                                            value={item.quantity}
                                            onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                            min="1"
                                            placeholder="0"
                                            className={`${inputBaseClasses} px-4 
                                                ${item.error?.quantity ? 'border-[#ff8389] focus:border-[#ff8389]' : ''}
                                            `}
                                        />
                                        {item.error?.quantity && (
                                            <p className="text-[12px] text-[#ff8389] mt-1.5 flex items-center gap-1">
                                                <AlertCircle size={12} /> {item.error.quantity}
                                            </p>
                                        )}
                                    </div>

                                    {/* Delete Row */}
                                    <div className="absolute top-3 right-3 md:static md:col-span-1 md:self-center md:pt-6 md:pl-0 pl-4">
                                        <button 
                                            onClick={() => handleRemoveItem(index)}
                                            disabled={items.length === 1}
                                            className={`p-2.5 text-[var(--text-tertiary)] hover:text-[#ff8389] hover:bg-[var(--bg-1)] rounded-md transition-all ${items.length === 1 ? 'opacity-0 pointer-events-none' : ''}`}
                                            title="Remove item"
                                        >
                                            <Trash size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-2">
                         <button 
                            onClick={handleAddItem}
                            className="flex items-center gap-2 text-[#0f62fe] blue-text-readable hover:text-[#4589ff] text-[14px] font-normal py-2 px-3 hover:bg-[#0f62fe]/10 rounded-md transition-all group"
                        >
                            <div className="w-5 h-5 rounded-full border border-[#0f62fe] flex items-center justify-center group-hover:bg-[#0f62fe] group-hover:text-white transition-all">
                                <Plus size={12} />
                            </div>
                            Add Another Item
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="bg-[var(--bg-1)] border-t border-[var(--border-1)] p-6 md:px-10 flex flex-col md:flex-row justify-end items-center gap-4">
                {errors.global && (
                    <p className="text-[#ff8389] text-[14px] mr-auto flex items-center gap-2 bg-[#ff8389]/10 px-3 py-2 rounded-md animate-fade-in-fast">
                        <AlertCircle size={16} /> {errors.global}
                    </p>
                )}
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button 
                        onClick={handleCancel}
                        disabled={isSaving}
                        className="h-[44px] flex-1 md:flex-none px-6 text-[var(--text-primary)] bg-transparent border border-[var(--border-1)] hover:bg-[var(--bg-2)] rounded-md text-[14px] font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="h-[44px] flex-1 md:flex-none px-6 bg-[#0f62fe] hover:bg-[#0353e9] text-white rounded-md text-[14px] font-medium transition-all shadow-lg shadow-[#0f62fe]/20 hover:shadow-[#0f62fe]/40 active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSaving && <Loader2 size={16} className="animate-spin" />}
                        {isSaving ? 'Saving...' : 'Save Shipment'}
                    </button>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default CreateShipmentPage;