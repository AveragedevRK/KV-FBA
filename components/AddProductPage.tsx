import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Image as ImageIcon, Loader2, Sparkles, Upload, Check, AlertCircle } from 'lucide-react';
import { ProductData, ValidationErrors, INITIAL_PRODUCT_DATA } from '../types';
import { generateProductDescription } from '../services/geminiService';
import { createProduct } from '../api/products'; // Import createProduct from API client

interface AddProductPageProps {
  onSave: (data: ProductData) => void;
  onCancel: () => void;
  onGoToProducts: () => void; // Renamed from onGoToInventory
}

const AddProductPage: React.FC<AddProductPageProps> = ({ onSave, onCancel, onGoToProducts }) => {
  const [formData, setFormData] = useState<ProductData>(INITIAL_PRODUCT_DATA);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null); // New state for API errors


  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const validateField = (name: keyof ProductData, value: any): string | undefined => {
    switch (name) {
      case 'sku':
        if (!value) return 'SKU is required';
        if (!/^[a-zA-Z0-9-_]+$/.test(value)) return 'Invalid format (A-Z, 0-9, -, _)';
        return undefined;
      case 'asin': // New validation
        if (!value) return 'ASIN is required';
        if (!/^[A-Z0-9]{10}$/.test(value)) return 'Invalid ASIN format (10 alphanumeric characters)';
        return undefined;
      case 'name':
        return !value ? 'Product Name is required' : undefined;
      case 'description':
        return !value ? 'Description is required' : undefined;
      case 'length':
      case 'width':
      case 'height':
        if (value === '') return 'Required';
        if (isNaN(Number(value)) || Number(value) <= 0) return 'Must be a positive number';
        return undefined;
      case 'dimensionUnit':
        return !value ? 'Unit is required' : undefined;
      case 'weight':
        if (value === '') return 'Required';
        if (isNaN(Number(value)) || Number(value) <= 0) return 'Must be a positive number';
        return undefined;
      case 'weightUnit':
        return !value ? 'Unit is required' : undefined;
      default:
        return undefined;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    const error = validateField(name as keyof ProductData, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, image: 'File must be an image' }));
        return;
      }
      setFormData(prev => ({ ...prev, image: file }));
      setErrors(prev => ({ ...prev, image: undefined }));
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
    }
  };

  const handleGenerateDescription = async () => {
    if (!formData.name || !formData.asin) { // Changed condition to asin
      alert("Please enter Product Name and ASIN to generate a description."); // Updated message
      return;
    }

    setIsGenerating(true);
    try {
      const description = await generateProductDescription(
        formData.name,
        formData.asin // Pass asin
      );
      setFormData(prev => ({ ...prev, description }));
    } catch (err: any) {
      console.error(err);
      alert(`Failed to generate description: ${err.message || 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const isFormValid = useCallback(() => {
    const requiredFields: (keyof ProductData)[] = [
      'sku', 'asin', 'name', 'description', 'length', 'width', 'height', 'dimensionUnit', 'weight', 'weightUnit'
    ];
    
    // Ensure numeric fields are actually numbers and positive if required
    const numericFields: (keyof ProductData)[] = ['length', 'width', 'height', 'weight'];
    const hasInvalidNumeric = numericFields.some(key => {
        const value = formData[key];
        return (value !== '' && (isNaN(Number(value)) || Number(value) <= 0));
    });

    const hasEmptyFields = requiredFields.some(key => {
        const value = formData[key];
        // For numeric fields that can be empty strings, ensure they are not empty if required.
        // The `validateField` will catch negative/zero values.
        if (numericFields.includes(key)) {
            return value === '';
        }
        return !value; // For strings and objects like image
    });

    const hasErrorsFromValidation = Object.values(errors).some(error => error !== undefined);
    return !hasEmptyFields && !hasInvalidNumeric && !hasErrorsFromValidation;
  }, [formData, errors]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission

    // Perform client-side validation
    let overallValid = true;
    const newErrors: ValidationErrors = {};
    const fieldsToValidate: (keyof ProductData)[] = [
      'sku', 'asin', 'name', 'description', 'length', 'width', 'height', 'dimensionUnit', 'weight', 'weightUnit'
    ];

    fieldsToValidate.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
        overallValid = false;
      }
    });
    setErrors(newErrors);

    if (!overallValid) {
      setApiError("Please correct the highlighted errors."); // Set a global error message for client-side issues
      return;
    }

    // `isFormValid` check should now pass if `overallValid` is true
    // This is a redundant check but acts as a safeguard.
    if (!isFormValid()) { 
        setApiError("Please correct the highlighted errors.");
        return;
    }


    setIsSaving(true);
    setApiError(null); // Clear previous API errors

    try {
      // Use the createProduct API client function
      const newProduct = await createProduct({
        sku: formData.sku,
        asin: formData.asin,
        productName: formData.name, // Map to backend's productName
        description: formData.description,
        productWeight: Number(formData.weight),
        // Fix: Pass weightUnit as undefined if it's an empty string
        weightUnit: formData.weightUnit === '' ? undefined : formData.weightUnit,
        length: Number(formData.length),
        width: Number(formData.width),
        height: Number(formData.height),
        // Fix: Pass dimensionUnit as undefined if it's an empty string
        dimensionUnit: formData.dimensionUnit === '' ? undefined : formData.dimensionUnit,
        imageFile: formData.image,
      });

      // Success
      console.log("Product created successfully:", newProduct);
      setShowSuccessModal(true);

    } catch (error: any) {
      console.error("API Error creating product:", error);
      setApiError(error.message || "An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFormData(INITIAL_PRODUCT_DATA);
    setErrors({});
    setImagePreview(null);
    setShowSuccessModal(false);
    setApiError(null); // Clear API error on reset
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  // IBM Carbon Styles (Dark Theme - Gray 90)
  const labelStyle = "text-[14px] text-[#c6c6c6] mb-1 block";
  const inputStyle = (hasError: boolean) => `
    w-full h-[40px] bg-[#393939] border-b px-4 text-[14px] text-[#f4f4f4] placeholder-[#a8a8a8]
    transition-all duration-200 outline-none
    ${hasError
      ? 'border-b-2 border-[#fa4d56] outline-[#fa4d56]'
      : 'border-[#8d8d8d] focus:outline focus:outline-2 focus:outline-offset-[-2px] focus:outline-white'}
  `;
  const errorTextStyle = "text-[12px] text-[#fa4d56] mt-1 font-normal animate-slide-in-right";

  return (
    <>
      <div className="w-full h-full bg-[#262626] flex flex-col animate-slide-up-fade duration-300">

        {/* Header */}
        <div className="px-4 md:px-6 py-4 border-b border-[#393939] shrink-0">
          <h2 className="text-[20px] font-bold text-[#f4f4f4]">New Product Card</h2>
          <p className="text-[14px] text-[#c6c6c6]">Enter the details for the new inventory item.</p>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden min-h-0">

          {/* Wrapper content that scrolls on mobile but is fixed height on desktop (inner parts scroll) */}
          <form onSubmit={handleSave} className="flex-1 flex flex-col lg:flex-row gap-6 lg:gap-8 p-4 md:p-6 lg:h-full overflow-visible lg:overflow-hidden">

            {/* Left Sidebar - Image Card */}
            <div className="w-full lg:w-[280px] shrink-0 flex flex-col animate-slide-in-right" style={{ animationDelay: '100ms' }}>
              <label className={labelStyle}>Product Image</label>
              <div
                className={`w-full aspect-square bg-[#393939] border border-dashed flex flex-col items-center justify-center cursor-pointer relative group overflow-hidden mb-4 transition-all duration-300
                      ${errors.image ? 'border-[#fa4d56]' : 'border-[#8d8d8d] hover:bg-[#4c4c4c]'}
                    `}
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-[#161616]/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Upload className="text-white w-8 h-8" />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-3 px-4 text-center">
                    <div className="w-12 h-12 bg-[#262626] flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                      <ImageIcon className="w-6 h-6 text-[#c6c6c6]" />
                    </div>
                    <div>
                      <span className="text-[14px] text-[#0062ff] font-medium block group-hover:underline blue-text-readable">Upload Image</span>
                      <span className="text-[12px] text-[#8d8d8d] mt-1">Drag & drop or click</span>
                    </div>
                  </div>
                )}
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" hidden />
              </div>
              {errors.image && <p className={errorTextStyle}>{errors.image}</p>}

              <div className="p-4 bg-[#393939]/50 border border-[#393939] hidden sm:block">
                <h4 className="text-[13px] text-[#f4f4f4] font-medium mb-2">Image Guidelines</h4>
                <ul className="text-[12px] text-[#c6c6c6] list-disc pl-4 space-y-1">
                  <li>Square aspect ratio recommended</li>
                  <li>Max file size: 5MB</li>
                  <li>High resolution preferred</li>
                </ul>
              </div>
            </div>

            {/* Right Side - Inputs */}
            <div className="flex-1 flex flex-col gap-6 h-auto lg:h-full lg:overflow-y-auto animate-slide-in-right no-scrollbar" style={{ animationDelay: '200ms' }}>

              {/* Row 1: SKU, ASIN, Name */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 shrink-0">
                <div className="col-span-1 md:col-span-3">
                  <label className={labelStyle}>SKU</label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    placeholder="PROD-001"
                    className={inputStyle(!!errors.sku)}
                  />
                  {errors.sku && <p className={errorTextStyle}>{errors.sku}</p>}
                </div>

                <div className="col-span-1 md:col-span-3">
                  <label className={labelStyle}>ASIN</label>
                  <input
                    type="text"
                    name="asin"
                    value={formData.asin}
                    onChange={handleChange}
                    placeholder="B0XXXXXXX"
                    className={inputStyle(!!errors.asin)}
                  />
                  {errors.asin && <p className={errorTextStyle}>{errors.asin}</p>}
                </div>

                <div className="col-span-1 md:col-span-6">
                  <label className={labelStyle}>Product Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Product name"
                    className={inputStyle(!!errors.name)}
                  />
                  {errors.name && <p className={errorTextStyle}>{errors.name}</p>}
                </div>
              </div>

              {/* Measurements Section */}
              <div className="shrink-0">
                <h3 className={`${labelStyle} font-bold text-[#f4f4f4] text-[14px] mb-4`}>Measurements</h3>
                
                {/* Product Dimensions */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
                    <div className="col-span-1 md:col-span-9">
                        <label className={labelStyle}>Product Dimensions (L x W x H)</label>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                name="length"
                                value={formData.length}
                                onChange={handleChange}
                                placeholder="L"
                                className={`${inputStyle(!!errors.length)} flex-1`}
                            />
                            <input
                                type="number"
                                name="width"
                                value={formData.width}
                                onChange={handleChange}
                                placeholder="W"
                                className={`${inputStyle(!!errors.width)} flex-1`}
                            />
                            <input
                                type="number"
                                name="height"
                                value={formData.height}
                                onChange={handleChange}
                                placeholder="H"
                                className={`${inputStyle(!!errors.height)} flex-1`}
                            />
                        </div>
                        {(errors.length || errors.width || errors.height) && (
                            <p className={errorTextStyle}>
                                {errors.length || errors.width || errors.height}
                            </p>
                        )}
                    </div>
                    <div className="col-span-1 md:col-span-3 flex items-end">
                        <select
                            name="dimensionUnit"
                            value={formData.dimensionUnit}
                            onChange={handleChange}
                            className={`${inputStyle(!!errors.dimensionUnit)} w-full text-[13px] appearance-none`}
                        >
                            <option value="" disabled>Unit</option>
                            <option value="cm">cm</option>
                            <option value="in">in</option>
                        </select>
                         {errors.dimensionUnit && <p className={errorTextStyle}>{errors.dimensionUnit}</p>}
                    </div>
                </div>

                {/* Product Weight */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="col-span-1 md:col-span-9">
                        <label className={labelStyle}>Product Weight</label>
                        <input
                            type="number"
                            name="weight"
                            value={formData.weight}
                            onChange={handleChange}
                            step="0.01"
                            placeholder="0.00"
                            className={inputStyle(!!errors.weight)}
                        />
                        {errors.weight && <p className={errorTextStyle}>{errors.weight}</p>}
                    </div>
                    <div className="col-span-1 md:col-span-3 flex items-end">
                        <select
                            name="weightUnit"
                            value={formData.weightUnit}
                            onChange={handleChange}
                            className={`${inputStyle(!!errors.weightUnit)} w-full text-[13px] appearance-none`}
                        >
                            <option value="" disabled>Unit</option>
                            <option value="g">g</option>
                            <option value="kg">kg</option>
                            <option value="lb">lb</option>
                            <option value="oz">oz</option>
                        </select>
                        {errors.weightUnit && <p className={errorTextStyle}>{errors.weightUnit}</p>}
                    </div>
                </div>
              </div>


              {/* Row 3: Description */}
              <div className="flex-1 flex flex-col min-h-[150px]">
                <label className={labelStyle}>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Product description..."
                  className={`flex-1 w-full bg-[#393939] border border-[#8d8d8d] p-4 text-[14px] text-[#f4f4f4] focus:outline focus:outline-2 focus:outline-white focus:outline-offset-[-2px] resize-none transition-all duration-200`}
                />
              </div>
            </div>

          </form>

        </div>

        {/* Footer */}
        <div className="px-4 md:px-6 py-4 border-t border-[#393939] flex justify-end gap-4 bg-[#262626] shrink-0 z-10">
          {apiError && (
            <p className="text-[#fa4d56] text-[14px] flex items-center gap-2 mr-auto animate-slide-in-right">
              <AlertCircle size={16} /> {apiError}
            </p>
          )}
          <button
            type="button" // Change to type="button" to prevent default form submission from this button
            onClick={onCancel}
            disabled={isSaving}
            className={`h-[48px] px-6 md:px-8 bg-[#393939] text-[#f4f4f4] hover:bg-[#4c4c4c] transition-colors text-[14px] font-medium hover:scale-105 active:scale-95 duration-200 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Cancel
          </button>
          <button
            type="submit" // Ensure this is a submit button if the form is wrapped, or call handleSave directly
            onClick={handleSave} // Keep onClick to call the handler
            disabled={!isFormValid() || isSaving}
            className={`h-[48px] px-6 md:px-8 text-white text-[14px] font-medium transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2
                ${isFormValid() && !isSaving
                ? 'bg-[#0062ff] hover:bg-[#0353e9]'
                : 'bg-[#525252] cursor-not-allowed text-[#c6c6c6]'}
              `}
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSaving ? 'Saving...' : 'Save Product'}
          </button>
        </div>

      </div>

      {/* Success Modal */}
      {showSuccessModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[var(--z-modal-backdrop)] flex items-center justify-center bg-[#161616]/60 backdrop-blur-[2px] animate-in fade-in duration-200 p-4">
          <div className="bg-[#262626] border border-[#393939] p-6 md:p-8 w-full max-w-[420px] shadow-2xl relative z-[var(--z-modal)] animate-slide-up-fade">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-[#24a148]/20 flex items-center justify-center mb-6 border border-[#24a148]/50">
                 <Check size={32} className="text-[#24a148]" />
              </div>
              
              <h3 className="text-[24px] font-semibold text-[#f4f4f4] mb-2">Product Saved</h3>
              <p className="text-[14px] text-[#c6c6c6] mb-2 leading-relaxed">
                <span className="text-[#f4f4f4] font-medium px-1 bg-[#393939]">{formData.name}</span> has been added to your inventory.
              </p>
              <p className="text-[14px] text-[#8d8d8d] mb-8">
                What would you like to do next?
              </p>
              
              <div className="flex flex-col w-full gap-3">
                 <button 
                   onClick={onGoToProducts} 
                   className="w-full h-[48px] bg-[#0f62fe] hover:bg-[#0353e9] text-white text-[14px] font-medium transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                 >
                    Go to Products
                 </button>
                 <button 
                    onClick={handleReset} 
                    className="w-full h-[48px] bg-[#393939] hover:bg-[#4c4c4c] text-[#f4f4f4] text-[14px] font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Create Another Product
                 </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default AddProductPage;