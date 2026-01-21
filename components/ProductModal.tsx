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
        return !value; // For strings and objects like