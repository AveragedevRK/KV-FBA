

import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash, AlertCircle, Package, Info, ChevronDown, ChevronUp, CheckCircle2, Loader2 } from 'lucide-react';
import { Shipment, ShipmentItem, BoxType, PackingLine } from '../../types';
import { updateShipmentPacking } from '../../api/shipments'; // Import the new API function

interface PackShipmentPanelProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: Shipment | null;
  items: ShipmentItem[];
  onSave: (updatedShipment: Shipment) => Promise<void>; // Updated signature to pass the full updated shipment
}

// Internal state interface allowing empty strings for inputs
interface BoxTypeState {
  id: string;
  boxCount: number | '';
  length: number | '';
  width: number | '';
  height: number | '';
  weightPerBox: number | '';
  unitsPerProduct: Record<string, number | ''>;
  isExpanded: boolean;
}

const PackShipmentPanel: React.FC<PackShipmentPanelProps> = ({ isOpen, onClose, shipment, items, onSave }) => {
  const [totalPlannedBoxes, setTotalPlannedBoxes] = useState<number | ''>('');
  const [boxTypes, setBoxTypes] = useState<BoxTypeState[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({}); // Critical errors that block save
  const [infoMessage, setInfoMessage] = useState<string | null>(null); // Warnings that don't block save
  const [isSaving, setIsSaving] = useState(false); // New: Saving state

  // Initialize with one box type when opening
  useEffect(() => {
    if (isOpen) {
      // If shipment has existing packing lines, initialize with them
      if (shipment?.packingLines && shipment.packingLines.length > 0) {
        setBoxTypes(shipment.packingLines.map((pl, idx) => ({
          id: crypto.randomUUID(), // Generate new IDs for state management
          boxCount: pl.boxCount,
          length: pl.dimensions.length,
          width: pl.dimensions.width,
          height: pl.dimensions.height,
          weightPerBox: pl.weight,
          unitsPerProduct: pl.unitsPerBox.reduce((acc, unit) => ({ ...acc, [unit.sku]: unit.quantity }), {}),
          isExpanded: idx === 0 // Expand first box type
        })));
        // Also try to infer totalPlannedBoxes from existing lines
        setTotalPlannedBoxes(shipment.packingLines.reduce((sum, pl) => sum + pl.boxCount, 0));
      } else if (boxTypes.length === 0) { // Only add a default if no existing and no default added yet
        addBoxType();
      }
      setErrors({});
      setInfoMessage(null);
    } else {
      // Reset state when closing
      setBoxTypes([]);
      setTotalPlannedBoxes('');
      setErrors({});
      setInfoMessage(null);
    }
  }, [isOpen, shipment]);

  const addBoxType = () => {
    const newBoxType: BoxTypeState = {
      id: crypto.randomUUID(),
      boxCount: 1,
      length: '',
      width: '',
      height: '',
      weightPerBox: '',
      unitsPerProduct: items.reduce((acc, item) => ({ ...acc, [item.sku]: 0 }), {}),
      isExpanded: true
    };
    setBoxTypes(prev => [...prev, newBoxType]);
  };

  const removeBoxType = (id: string) => {
    if (boxTypes.length > 1) {
      setBoxTypes(prev => prev.filter(bt => bt.id !== id));
    }
  };

  const toggleExpand = (id: string) => {
    setBoxTypes(prev => prev.map(bt => bt.id === id ? { ...bt, isExpanded: !bt.isExpanded } : bt));
  };

  // --- Calculations ---

  // Calculate total units assigned for a product across ALL box types
  const getAssignedUnits = (sku: string) => {
    return boxTypes.reduce((sum, bt) => {
      const count = Number(bt.boxCount) || 0;
      const units = Number(bt.unitsPerProduct[sku]) || 0;
      return sum + (count * units);
    }, 0);
  };

  // Calculate total units assigned excluding a specific box type (useful for validation)
  const getAssignedUnitsExcluding = (sku: string, excludeBoxId: string) => {
    return boxTypes.reduce((sum, bt) => {
      if (bt.id === excludeBoxId) return sum;
      const count = Number(bt.boxCount) || 0;
      const units = Number(bt.unitsPerProduct[sku]) || 0;
      return sum + (count * units);
    }, 0);
  };

  const currentTotalBoxes = boxTypes.reduce((sum, bt) => sum + (Number(bt.boxCount) || 0), 0);

  const isAllItemsAssigned = useMemo(() => {
    if (!items || items.length === 0) return true; // No items to assign
    return items.every(item => {
      const totalAssignedForSku = getAssignedUnits(item.sku);
      return totalAssignedForSku === item.quantity;
    });
  }, [items, boxTypes]);

  // --- Handlers with Validation Logic ---

  const handleBoxCountChange = (id: string, value: string) => {
    const newCount: number | '' = value === '' ? '' : parseInt(value, 10);
    if (newCount !== '' && newCount < 0) return; // Prevent negative counts

    setBoxTypes(prev => prev.map(bt => {
      if (bt.id !== id) return bt;

      // Clear related errors when input changes
      setErrors(currentErrors => {
        const newErrors = { ...currentErrors };
        delete newErrors[`bt_${id}_count`];
        return newErrors;
      });

      const updatedBt = { ...bt, boxCount: newCount };
      return updatedBt;
    }));
  };

  const handleUnitsChange = (boxId: string, sku: string, value: string) => {
    const newUnits: number | '' = value === '' ? '' : parseInt(value, 10);
    if (newUnits !== '' && newUnits < 0) return; // Prevent negative units

    // Clear related errors when input changes
    setErrors(currentErrors => {
      const newErrors = { ...currentErrors };
      delete newErrors[`bt_${boxId}_units_${sku}`];
      return newErrors;
    });

    if (typeof newUnits === 'number') {
      const boxType = boxTypes.find(bt => bt.id === boxId);
      const itemTotal = items.find(i => i.sku === sku)?.quantity || 0;
      
      if (boxType) {
        const boxCount = Number(boxType.boxCount) || 0;
        const totalNewContribution = boxCount * newUnits;
        const assignedElsewhere = getAssignedUnitsExcluding(sku, boxId);
        const remainingForThisItem = itemTotal - assignedElsewhere;

        // Clamp the newUnits if it would exceed the total available for the item
        if (boxCount > 0 && totalNewContribution > remainingForThisItem) {
          const maxUnitsPerBox = Math.floor(remainingForThisItem / boxCount);
          if (maxUnitsPerBox < newUnits) { // Only show message if actual clamping happens
            setInfoMessage(`Adjusted units for ${sku} to ${maxUnitsPerBox} per box to not exceed total shipment quantity.`);
            setTimeout(() => setInfoMessage(null), 4000);
            setBoxTypes(prev => prev.map(bt =>
              bt.id === boxId
                ? { ...bt, unitsPerProduct: { ...bt.unitsPerProduct, [sku]: maxUnitsPerBox } }
                : bt
            ));
            return; // Exit after clamping
          }
        }
      }
    }

    setBoxTypes(prev => prev.map(bt =>
      bt.id === boxId
        ? { ...bt, unitsPerProduct: { ...bt.unitsPerProduct, [sku]: newUnits } }
        : bt
    ));
  };

  const handleBoxTypeDimensionChange = (id: string, field: keyof BoxTypeState, value: any) => {
    // Clear related dimension errors when input changes
    setErrors(currentErrors => {
      const newErrors = { ...currentErrors };
      delete newErrors[`bt_${id}_dim`];
      return newErrors;
    });
    setBoxTypes(prev => prev.map(bt => bt.id === id ? { ...bt, [field]: value } : bt));
  };

  const handleBoxTypeWeightChange = (id: string, value: any) => {
    // Clear related weight errors when input changes
    setErrors(currentErrors => {
      const newErrors = { ...currentErrors };
      delete newErrors[`bt_${id}_weight`];
      return newErrors;
    });
    setBoxTypes(prev => prev.map(bt => bt.id === id ? { ...bt, weightPerBox: value } : bt));
  };


  const handleSave = async () => {
    if (!shipment?.id || !shipment?.shipmentId) {
      setErrors({ global: 'Shipment ID is missing.' });
      return;
    }

    // Final Validation - Critical errors that block submission
    const newErrors: Record<string, string> = {};
    let criticalErrorsExist = false;

    // Validate Box Types for critical fields (must be present and positive)
    boxTypes.forEach((bt) => {
      if (!bt.boxCount || Number(bt.boxCount) <= 0) {
        newErrors[`bt_${bt.id}_count`] = 'Required & > 0';
        criticalErrorsExist = true;
      }
      if (!bt.length || Number(bt.length) <= 0) {
        newErrors[`bt_${bt.id}_dim`] = 'Required & > 0';
        criticalErrorsExist = true;
      }
      if (!bt.width || Number(bt.width) <= 0) {
        newErrors[`bt_${bt.id}_dim`] = 'Required & > 0';
        criticalErrorsExist = true;
      }
      if (!bt.height || Number(bt.height) <= 0) {
        newErrors[`bt_${bt.id}_dim`] = 'Required & > 0';
        criticalErrorsExist = true;
      }
      if (!bt.weightPerBox || Number(bt.weightPerBox) <= 0) {
        newErrors[`bt_${bt.id}_weight`] = 'Required & > 0';
        criticalErrorsExist = true;
      }

      // Check for negative units per product
      Object.entries(bt.unitsPerProduct).forEach(([sku, quantity]) => {
        if (typeof quantity === 'number' && quantity < 0) {
          newErrors[`bt_${bt.id}_units_${sku}`] = 'Cannot be negative';
          criticalErrorsExist = true;
        }
      });
    });

    setErrors(newErrors); // Update errors state with critical errors

    if (criticalErrorsExist) {
      setInfoMessage("Please correct critical errors before saving.");
      return; // Stop if critical errors found
    }

    // --- Handle Warnings (do NOT block save) ---
    let currentWarnings: string[] = [];

    // Warning 1: Box Consistency
    if (totalPlannedBoxes !== '' && currentTotalBoxes !== totalPlannedBoxes) {
      currentWarnings.push(`You planned ${totalPlannedBoxes} boxes but defined ${currentTotalBoxes}. This will be saved as defined.`);
    }

    // Warning 2: All items assigned
    if (!isAllItemsAssigned) {
      currentWarnings.push("Not all items from the shipment are assigned to boxes. This will be saved as defined.");
    }
    
    // Set info message for warnings, or clear it if no warnings
    if (currentWarnings.length > 0) {
        setInfoMessage(currentWarnings.join(" | "));
        // No return, allow saving
    } else {
        setInfoMessage(null); // Clear info message if everything is good
    }

    // Proceed with saving if no critical errors
    setIsSaving(true);
    try {
      // Map BoxTypeState to PackingLine for the API payload
      const actualPackingLines: PackingLine[] = boxTypes.map(bt => ({
        boxCount: Number(bt.boxCount) || 0, // Ensure numbers for API
        dimensions: {
          length: Number(bt.length) || 0,
          width: Number(bt.width) || 0,
          height: Number(bt.height) || 0,
          unit: 'in', // Assuming default 'in' unit for dimensions based on current inputs
        },
        weight: Number(bt.weightPerBox) || 0,
        weightUnit: 'lb', // Assuming default 'lb' unit for weight based on current inputs
        unitsPerBox: Object.entries(bt.unitsPerProduct).map(([sku, quantity]) => ({ sku, quantity: Number(quantity) || 0 })),
      }));

      // FIX: Use shipment.id (MongoDB _id) instead of shipment.shipmentId (human-readable ID)
      const updatedShipment = await updateShipmentPacking(shipment.id, actualPackingLines, 'Packed');
      await onSave(updatedShipment); // Pass the updated shipment object up to the parent
      onClose(); // Close only on successful save
    } catch (err: any) {
      console.error("Failed to save packing:", err);
      setInfoMessage(`Error saving packing: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !shipment) return null;

  const inputStyle = "w-full h-[32px] bg-[#393939] border border-[#525252] text-[#f4f4f4] px-2 text-[13px] focus:outline-none focus:border-[#0f62fe] transition-colors rounded";
  const labelStyle = "text-[11px] text-[#c6c6c6] uppercase tracking-wide mb-1 block";

  return (
    <>
      <div className="fixed inset-0 bg-[#161616]/60 z-[var(--z-modal-backdrop)] backdrop-blur-sm animate-fade-in-fast" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full md:w-[600px] bg-[#212121] border-l border-[#393939] shadow-2xl z-[var(--z-modal)] flex flex-col animate-slide-in-right">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#393939] flex justify-between items-center bg-[#262626]">
          <div>
            <h2 className="text-[18px] font-semibold text-[#f4f4f4]">Pack Shipment</h2>
            <p className="text-[12px] text-[#8d8d8d] font-mono">{shipment.shipmentId} • {shipment.name}</p>
          </div>
          <button type="button" onClick={onClose} className="text-[#c6c6c6] hover:text-[#f4f4f4] transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* Step 1: Total Boxes */}
            <div className="bg-[#2a2a2a] p-4 rounded-lg border border-[#393939]">
                <label htmlFor="totalPlannedBoxes" className="text-[14px] font-medium text-[#f4f4f4] mb-2 block">
                    How many boxes are you using for this shipment?
                </label>
                <div className="flex items-center gap-4">
                    <input 
                        id="totalPlannedBoxes"
                        type="number"
                        min="1"
                        value={totalPlannedBoxes}
                        onChange={(e) => {
                            const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                            setTotalPlannedBoxes(val);
                            setErrors(prev => { // Clear related error
                                const newErrors = { ...prev };
                                delete newErrors['totalBoxes'];
                                return newErrors;
                            });
                        }}
                        className="h-[40px] w-[120px] bg-[#161616] border border-[#393939] text-[#f4f4f4] px-3 rounded focus:outline-none focus:border-[#0f62fe]"
                        placeholder="e.g. 5"
                    />
                    {totalPlannedBoxes && (
                        <span className="text-[13px] text-[#42be65] flex items-center gap-1 animate-fade-in-fast">
                             <Package size={14} /> Planned {totalPlannedBoxes} boxes
                        </span>
                    )}
                </div>
                 {/* Consistency Error (now a warning, not blocking save) */}
                 {(totalPlannedBoxes !== '' && currentTotalBoxes !== totalPlannedBoxes) && (
                    <div className="mt-2 text-[12px] text-[#ff8389] flex items-center gap-1">
                        <AlertCircle size={12} />
                        You've defined {currentTotalBoxes} boxes, which {currentTotalBoxes > Number(totalPlannedBoxes) ? 'exceeds' : 'does not match'} your planned {totalPlannedBoxes}. This will be saved as defined.
                    </div>
                )}
            </div>

            {/* Step 2: Box Types */}
            <div>
                <div className="flex justify-between items-end mb-3">
                    <h3 className="text-[16px] font-semibold text-[#e0e0e0]">Box Types</h3>
                    <div className="text-[12px] text-[#8d8d8d]">
                        Total defined: <span className={totalPlannedBoxes !== '' && currentTotalBoxes !== totalPlannedBoxes ? 'text-[#ff8389] font-bold' : 'text-[#f4f4f4] font-bold'}>{currentTotalBoxes}</span>
                        {totalPlannedBoxes !== '' && <span className="text-[#525252]"> / {totalPlannedBoxes}</span>}
                    </div>
                </div>

                {/* Auto-adjust Info / General Warning Toast */}
                {(infoMessage || (!isAllItemsAssigned && (infoMessage === null || !infoMessage.includes("Not all items")))) && (
                    <div className="mb-4 p-3 bg-[#0f62fe]/10 border border-[#0f62fe]/30 text-[#a6c8ff] text-[13px] rounded flex items-start gap-2 animate-slide-up-fade">
                        <Info size={16} className="shrink-0 mt-0.5" />
                        {infoMessage || (!isAllItemsAssigned && "Warning: Not all items from the shipment are assigned to boxes.")}
                    </div>
                )}

                <div className="space-y-4">
                    {boxTypes.map((boxType, index) => (
                        <div key={boxType.id} className="bg-[#2a2a2a] border border-[#393939] rounded-lg overflow-hidden transition-all duration-200">
                            {/* Card Header */}
                            <div 
                                className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-[#333]"
                                onClick={() => toggleExpand(boxType.id)}
                                role="button"
                                tabIndex={0}
                                aria-expanded={boxType.isExpanded}
                                aria-controls={`box-type-content-${boxType.id}`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-[14px] font-medium text-[#f4f4f4]">Box Type {index + 1}</span>
                                    {boxType.boxCount !== '' && (
                                        <span className="text-[12px] bg-[#393939] text-[#c6c6c6] px-2 py-0.5 rounded border border-[#525252]">
                                            Qty: {boxType.boxCount}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                     {boxTypes.length > 1 && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); removeBoxType(boxType.id); }}
                                            className="p-1.5 text-[#666] hover:text-[#ff8389] hover:bg-[#393939] rounded transition-colors"
                                            type="button" // Important for buttons not to trigger form submission
                                            aria-label={`Remove Box Type ${index + 1}`}
                                        >
                                            <Trash size={14} />
                                        </button>
                                     )}
                                     {boxType.isExpanded ? <ChevronUp size={16} className="text-[#8d8d8d]" /> : <ChevronDown size={16} className="text-[#8d8d8d]" />}
                                </div>
                            </div>

                            {/* Card Body */}
                            {boxType.isExpanded && (
                                <div id={`box-type-content-${boxType.id}`} role="region" className="p-4 border-t border-[#393939] bg-[#212121]">
                                    
                                    {/* Top Row: Count, Dims, Weight */}
                                    <div className="grid grid-cols-12 gap-4 mb-6">
                                        <div className="col-span-3">
                                            <label htmlFor={`boxCount-${boxType.id}`} className={labelStyle}>Box Count <span className="text-[#ff8389]">*</span></label>
                                            <input 
                                                id={`boxCount-${boxType.id}`}
                                                type="number"
                                                min="1"
                                                value={boxType.boxCount}
                                                onChange={(e) => handleBoxCountChange(boxType.id, e.target.value)}
                                                className={`${inputStyle} ${errors[`bt_${boxType.id}_count`] ? 'border-[#ff8389]' : ''}`}
                                                aria-invalid={!!errors[`bt_${boxType.id}_count`]}
                                                aria-describedby={errors[`bt_${boxType.id}_count`] ? `error-boxCount-${boxType.id}` : undefined}
                                            />
                                             {errors[`bt_${boxType.id}_count`] && <p id={`error-boxCount-${boxType.id}`} className="text-[10px] text-[#ff8389] mt-1">{errors[`bt_${boxType.id}_count`]}</p>}
                                        </div>
                                        <div className="col-span-6">
                                             <label htmlFor={`dimensions-${boxType.id}`} className={labelStyle}>Dimensions (L x W x H) <span className="text-[#ff8389]">*</span></label>
                                             <div className="flex gap-2">
                                                <input 
                                                    type="number" placeholder="L"
                                                    min="0"
                                                    value={boxType.length} onChange={(e) => handleBoxTypeDimensionChange(boxType.id, 'length', e.target.value)}
                                                    className={`${inputStyle} ${errors[`bt_${boxType.id}_dim`] ? 'border-[#ff8389]' : ''}`}
                                                    aria-label="Length"
                                                />
                                                <input 
                                                    type="number" placeholder="W"
                                                    min="0"
                                                    value={boxType.width} onChange={(e) => handleBoxTypeDimensionChange(boxType.id, 'width', e.target.value)}
                                                    className={`${inputStyle} ${errors[`bt_${boxType.id}_dim`] ? 'border-[#ff8389]' : ''}`}
                                                    aria-label="Width"
                                                />
                                                <input 
                                                    type="number" placeholder="H"
                                                    min="0"
                                                    value={boxType.height} onChange={(e) => handleBoxTypeDimensionChange(boxType.id, 'height', e.target.value)}
                                                    className={`${inputStyle} ${errors[`bt_${boxType.id}_dim`] ? 'border-[#ff8389]' : ''}`}
                                                    aria-label="Height"
                                                />
                                             </div>
                                             {errors[`bt_${boxType.id}_dim`] && <p id={`error-dimensions-${boxType.id}`} className="text-[10px] text-[#ff8389] mt-1">{errors[`bt_${boxType.id}_dim`]}</p>}
                                        </div>
                                        <div className="col-span-3">
                                            <label htmlFor={`weight-${boxType.id}`} className={labelStyle}>Weight (lb) <span className="text-[#ff8389]">*</span></label>
                                            <input 
                                                id={`weight-${boxType.id}`}
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={boxType.weightPerBox}
                                                onChange={(e) => handleBoxTypeWeightChange(boxType.id, e.target.value)}
                                                className={`${inputStyle} ${errors[`bt_${boxType.id}_weight`] ? 'border-[#ff8389]' : ''}`}
                                                aria-invalid={!!errors[`bt_${boxType.id}_weight`]}
                                                aria-describedby={errors[`bt_${boxType.id}_weight`] ? `error-weight-${boxType.id}` : undefined}
                                            />
                                            {errors[`bt_${boxType.id}_weight`] && <p id={`error-weight-${boxType.id}`} className="text-[10px] text-[#ff8389] mt-1">{errors[`bt_${boxType.id}_weight`]}</p>}
                                        </div>
                                    </div>

                                    {/* Products Table */}
                                    <div>
                                        <label className={`${labelStyle} mb-2 border-b border-[#393939] pb-1 block`}>Units Per Box (For this box type)</label>
                                        <div className="space-y-3">
                                            {items.map(item => {
                                                const assignedTotal = getAssignedUnits(item.sku);
                                                const remaining = item.quantity - assignedTotal;
                                                const currentInThisBox = Number(boxType.unitsPerProduct[item.sku]) || 0;
                                                
                                                return (
                                                    <div key={item.sku} className="flex items-center justify-between text-[13px]">
                                                        <div className="flex-1 pr-4">
                                                            <div className="text-[#f4f4f4] font-medium">{item.sku}</div>
                                                            <div className="text-[11px] text-[#8d8d8d] truncate" title={item.name}>{item.name}</div>
                                                        </div>
                                                        
                                                        <div className="text-right mr-4 text-[11px] text-[#8d8d8d]">
                                                            <div>Total: {item.quantity}</div>
                                                            <div className={`${remaining < 0 ? 'text-[#ff8389]' : 'text-[#c6c6c6]'}`}>
                                                                Remaining: {remaining}
                                                            </div>
                                                        </div>

                                                        <div className="w-[80px]">
                                                            <input 
                                                                type="number"
                                                                min="0"
                                                                value={boxType.unitsPerProduct[item.sku]}
                                                                onChange={(e) => handleUnitsChange(boxType.id, item.sku, e.target.value)}
                                                                className={`w-full h-[32px] bg-[#161616] border text-[#f4f4f4] text-center rounded focus:outline-none focus:border-[#0f62fe]
                                                                    ${errors[`bt_${boxType.id}_units_${item.sku}`] ? 'border-[#ff8389]' : 'border-[#393939]'}
                                                                `}
                                                                aria-label={`Units for ${item.sku} in Box Type ${index + 1}`}
                                                                aria-invalid={!!errors[`bt_${boxType.id}_units_${item.sku}`]}
                                                                aria-describedby={errors[`bt_${boxType.id}_units_${item.sku}`] ? `error-units-${boxType.id}-${item.sku}` : undefined}
                                                            />
                                                            {errors[`bt_${boxType.id}_units_${item.sku}`] && <p id={`error-units-${boxType.id}-${item.sku}`} className="text-[10px] text-[#ff8389] mt-1">{errors[`bt_${boxType.id}_units_${item.sku}`]}</p>}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                </div>
                            )}
                        </div>
                    ))}

                    <button 
                        onClick={addBoxType}
                        className="flex items-center gap-2 text-[#0f62fe] blue-text-readable text-[13px] font-medium hover:underline p-1"
                        type="button" // Important for buttons not to trigger form submission
                    >
                        <Plus size={16} /> Add Box Type
                    </button>
                </div>
            </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#393939] bg-[#262626] flex justify-end gap-4">
            <button 
                onClick={onClose}
                className="h-[48px] px-6 bg-[#393939] hover:bg-[#4c4c4c] text-[#f4f4f4] rounded-md font-medium text-[14px] transition-colors"
                type="button" // Important for buttons not to trigger form submission
            >
                Cancel
            </button>
            <button 
                onClick={handleSave}
                disabled={isSaving || Object.keys(errors).length > 0}
                className="h-[48px] px-6 bg-[#0f62fe] hover:bg-[#0353e9] text-white rounded-md font-medium text-[14px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                type="button" // Important for buttons not to trigger form submission
            >
                {isSaving && <Loader2 size={16} className="animate-spin mr-2" />}
                Save Packing
            </button>
        </div>

      </div>
    </>
  );
};

export default PackShipmentPanel;