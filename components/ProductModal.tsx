import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Image as ImageIcon, Loader2, Sparkles, Upload } from 'lucide-react';
import { ProductData, ValidationErrors, INITIAL_PRODUCT_DATA } from '../types';
import { generateProductDescription } from '../services/geminiService';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ProductData) => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<ProductData>(INITIAL_PRODUCT_DATA);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData(INITIAL_PRODUCT_DATA);
      setErrors({});
      setImagePreview(null);
    }
  }, [isOpen]);

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
        if (!/^[A-Z0-9]{10}$/.test(value)) return 'Invalid ASIN format (10 alphanumeric chars)';
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
    } catch (err) {
      console.error("Error generating description:", err); // Log the full error
      alert("Failed to generate description.");
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

    const hasErrors = Object.values(errors).some(error => error !== undefined);
    return !hasEmptyFields && !hasInvalidNumeric && !hasErrors;
  }, [formData, errors]);

  const handleSave = () => {
    if (isFormValid()) {
      onSave(formData);
      onClose();
    }
  };

  if (!isOpen) return null;

  // Carbon Design Style Constants (Gray 100 Theme)
  // Inputs usually sit on a layer. If modal is Gray 90 (#262626), inputs are Gray 80 (#393939)
  const inputContainerStyle = "flex flex-col w-full relative";
  const labelStyle = "text-[12px] leading-[1.3] text-[#c6c6c6] mb-2"; // Text-02
  const inputStyle = (hasError: boolean) => `
    w-full h-[40px] bg-[#393939] border-b px-4 text-[14px] text-[#f4f4f4] placeholder-[#a8a8a8]
    transition-all outline-none
    ${hasError 
      ? 'border-b-2 border-[#fa4d56] outline-[#fa4d56]' 
      : 'border-[#8d8d8d] focus:outline focus:outline-2 focus:outline-offset-[-2px] focus:outline-white'}
  `;
  const errorTextStyle = "text-[12px] text-[#fa4d56] mt-1 font-normal flex items-center gap-1"; // Red 50

  return (
    <div className="fixed inset-0 z-[var(--z-modal-backdrop)] flex items-center justify-center bg-[#161616]/60 backdrop-blur-[2px] transition-opacity animate-fade-in-fast">
      
      {/* Carbon Modal Shell - Gray 90 (#262626) */}
      <div className="bg-[#262626] w-full max-w-[95%] md:max-w-[768px] flex flex-col max-h-[90vh] shadow-lg relative z-[var(--z-modal)] animate-modal-enter">
        
        {/* Header */}
        <div className="flex items-start justify-between pl-4 pr-12 pt-4 pb-2 min-h-[48px]">
          <div className="flex flex-col">
             <h2 className="text-[20px] leading-[1.2] font-semibold text-[#f4f4f4]">New Product Card</h2>
             <p className="text-[14px] text-[#c6c6c6] mt-1">Enter the details for the new inventory item.</p>
          </div>
          <button 
            onClick={onClose}
            className="absolute top-0 right-0 w-[48px] h-[48px] flex items-center justify-center hover:bg-[#393939] transition-colors"
            aria-label="Close modal"
          >
            <X size={20} className="text-[#f4f4f4]" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* Image Upload */}
            <div className="md:col-span-1 flex flex-col opacity-0 animate-slide-up-fade" style={{ animationDelay: '100ms' }}>
              <label className={labelStyle}>Product Image</label>
              <div 
                className={`w-full aspect-square bg-[#393939] border border-dashed flex flex-col items-center justify-center cursor-pointer relative group
                  ${errors.image ? 'border-[#fa4d56]' : 'border-[#8d8d8d] hover:bg-[#4c4c4c]'}
                `}
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-[#161616]/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <Upload className="text-white w-6 h-6" />
                    </div>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-8 h-8 text-[#c6c6c6] mb-2" />
                    <span className="text-[12px] text-[#0f62fe] font-medium blue-text-readable">Add Image</span>
                  </>
                )}
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" hidden />
              </div>
              {errors.image && <p className={errorTextStyle}>{errors.image}</p>}
            </div>

            {/* Product Info */}
            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className={`${inputContainerStyle} opacity-0 animate-slide-up-fade`} style={{ animationDelay: '150ms' }}>
                <label className={labelStyle}>SKU <span className="text-[#fa4d56]">*</span></label>
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

              <div className={`${inputContainerStyle} opacity-0 animate-slide-up-fade`} style={{ animationDelay: '200ms' }}>
                <label className={labelStyle}>ASIN <span className="text-[#fa4d56]">*</span></label>
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

              <div className={`${inputContainerStyle} md:col-span-2 opacity-0 animate-slide-up-fade`} style={{ animationDelay: '250ms' }}>
                <label className={labelStyle}>Product Name <span className="text-[#fa4d56]">*</span></label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter product name"
                  className={inputStyle(!!errors.name)}
                />
                {errors.name && <p className={errorTextStyle}>{errors.name}</p>}
              </div>
            </div>

            {/* Measurements Section */}
            <div className="md:col-span-4 opacity-0 animate-slide-up-fade" style={{ animationDelay: '300ms' }}>
              <h3 className={`${labelStyle} font-bold text-[#f4f4f4] text-[14px] mb-4`}>Measurements</h3>
              
              {/* Product Dimensions */}
              <div className={`${inputContainerStyle} mb-6`}>
                <label className={labelStyle}>Product Dimensions (L x W x H) <span className="text-[#fa4d56]">*</span></label>
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
                  <select
                    name="dimensionUnit"
                    value={formData.dimensionUnit}
                    onChange={handleChange}
                    className={`${inputStyle(!!errors.dimensionUnit)} w-[80px] text-[13px] appearance-none`}
                  >
                    <option value="" disabled>Unit</option>
                    <option value="cm">cm</option>
                    <option value="in">in</option>
                  </select>
                </div>
                {(errors.length || errors.width || errors.height || errors.dimensionUnit) && (
                  <p className={errorTextStyle}>
                    {errors.length || errors.width || errors.height || errors.dimensionUnit}
                  </p>
                )}
              </div>

              {/* Product Weight */}
              <div className={inputContainerStyle}>
                <label className={labelStyle}>Product Weight <span className="text-[#fa4d56]">*</span></label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    step="0.01"
                    placeholder="0.00"
                    className={`${inputStyle(!!errors.weight)} flex-1`}
                  />
                  <select
                    name="weightUnit"
                    value={formData.weightUnit}
                    onChange={handleChange}
                    className={`${inputStyle(!!errors.weightUnit)} w-[80px] text-[13px] appearance-none`}
                  >
                    <option value="" disabled>Unit</option>
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="lb">lb</option>
                    <option value="oz">oz</option>
                  </select>
                </div>
                {(errors.weight || errors.weightUnit) && (
                  <p className={errorTextStyle}>
                    {errors.weight || errors.weightUnit}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="md:col-span-4 opacity-0 animate-slide-up-fade" style={{ animationDelay: '350ms' }}>
                 <div className="flex justify-between items-end mb-2">
                  <label className="text-[12px] leading-[1.3] text-[#c6c6c6]">Description <span className="text-[#fa4d56]">*</span></label>
                  <button
                    type="button"
                    onClick={handleGenerateDescription}
                    disabled={isGenerating || !formData.name || !formData.asin} // Updated condition
                    className="flex items-center text-[12px] font-medium text-[#0f62fe] blue-text-readable hover:text-[#0353e9] disabled:text-[#525252] disabled:cursor-not-allowed transition-colors"
                  >
                    {isGenerating ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                    {isGenerating ? 'Generating...' : 'Generate via AI'}
                  </button>
                </div>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className={`w-full bg-[#393939] border border-[#393939] border-b-[#8d8d8d] p-4 text-[14px] blue-text-readable focus:outline focus:outline-2 focus:outline-white focus:outline-offset-[-2px] resize-none`}
                />
              </div>
            </div>
          
        </div>

        {/* Footer - Carbon Button Set */}
        <div className="flex">
          <button
            onClick={onClose}
            className="w-1/2 h-[64px] bg-[#393939] text-[#f4f4f4] hover:bg-[#4c4c4c] transition-colors text-[14px] font-normal"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isFormValid()}
            className={`w-1/2 h-[64px] text-white text-[14px] font-normal flex items-center justify-center transition-colors
              ${isFormValid() 
                ? 'bg-[#0f62fe] hover:bg-[#0353e9]' 
                : 'bg-[#525252] cursor-not-allowed text-[#c6c6c6]'}
            `}
          >
            Save Product
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
