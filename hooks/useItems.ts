
import { useState, useMemo, useEffect } from 'react';
import { InventoryItem } from '../types';
import { fetchProducts, Product, ProductListResponse } from '../api/products'; // Import API client

export type SortDirection = 'asc' | 'desc' | null;
export interface SortConfig {
  key: keyof InventoryItem | null;
  direction: SortDirection;
}

export interface FilterState {
  categories: string[];
  statuses: string[];
  warehouse: string;
  supplier: string;
  priceRange: { min: string; max: string };
  stockRange: { min: string; max: string };
}

export const INITIAL_FILTERS: FilterState = {
  categories: [],
  statuses: [],
  warehouse: '',
  supplier: '',
  priceRange: { min: '', max: '' },
  stockRange: { min: '', max: '' }
};

export const useItems = () => {
  // Removed MOCK_ITEMS
  const [apiProducts, setApiProducts] = useState<InventoryItem[]>([]); // Will store mapped API results for current page
  const [totalApiItems, setTotalApiItems] = useState(0); // Total items from API (across all pages)
  const [isLoading, setIsLoading] = useState(true); // Added for loading state
  const [error, setError] = useState<string | null>(null); // Added for error state

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All Statuses');
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: null });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50); 

  // Effect to fetch data from API
  useEffect(() => {
    const getProducts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response: ProductListResponse = await fetchProducts({ 
          page: currentPage, 
          limit: itemsPerPage, 
          search: searchQuery 
        });

        // Map API Product type to InventoryItem type
        const mappedItems: InventoryItem[] = response.data.map(product => ({
          id: product._id,
          asin: product.asin,
          sku: product.sku,
          name: product.productName,
          category: "N/A", // Default as per prompt
          warehouse: "",   // Default as per prompt
          bin: "",         // Default as per prompt
          supplier: "",    // Default as per prompt
          onHand: 0,       // Default as per prompt
          available: 0,    // Default as per prompt
          status: "In Stock", // Default as per prompt
          lastUpdated: product.createdAt,
          price: 0,        // Default as per prompt
          // NOTE: Fields like `asin`, `imageUrl`, `productDimensions`, `productWeight`, `weightUnit`
          // are not mapped here because they are not part of the `InventoryItem` interface
          // and modifying `types.ts` is disallowed by the prompt.
        }));
        setApiProducts(mappedItems);
        setTotalApiItems(response.total); // Use total from API for overall count
      } catch (err: any) {
        console.error("Failed to fetch products:", err);
        setError(err.message || "Failed to fetch products.");
      } finally {
        setIsLoading(false);
      }
    };

    getProducts();
  }, [currentPage, itemsPerPage, searchQuery]); // Re-fetch when these change

  // Reset page on *client-side* filter change (searchQuery is handled by API fetch)
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, filters]);


  // --- Client-side Filtering Logic (applied to the current page's API data) ---
  const clientFilteredItems = useMemo(() => {
    // `apiProducts` is already filtered by `searchQuery` from the API.
    // This memo applies *additional* client-side filters (status, categories, etc.)
    return apiProducts.filter(item => {
      if (statusFilter !== 'All Statuses' && item.status !== statusFilter) {
        return false;
      }

      if (filters.categories.length > 0 && !filters.categories.includes(item.category)) return false;
      if (filters.statuses.length > 0 && !filters.statuses.includes(item.status)) return false;
      // Using .includes() and .toLowerCase() to match original mock data filtering behavior for warehouse/supplier
      if (filters.warehouse && !item.warehouse.toLowerCase().includes(filters.warehouse.toLowerCase())) return false;
      if (filters.supplier && !item.supplier.toLowerCase().includes(filters.supplier.toLowerCase())) return false;

      if (filters.priceRange.min && item.price < Number(filters.priceRange.min)) return false;
      if (filters.priceRange.max && item.price > Number(filters.priceRange.max)) return false;

      if (filters.stockRange.min && item.onHand < Number(filters.stockRange.min)) return false;
      if (filters.stockRange.max && item.onHand > Number(filters.stockRange.max)) return false;

      return true;
    });
  }, [apiProducts, statusFilter, filters]);

  // --- Client-side Sorting Logic ---
  const sortedItems = useMemo(() => {
    const data = [...clientFilteredItems]; // Sort the client-side filtered data
    if (!sortConfig.key || !sortConfig.direction) return data;

    return data.sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];

      // Handle null/undefined values for sorting stability
      if (aValue === null || aValue === undefined) return sortConfig.direction === 'asc' ? 1 : -1;
      if (bValue === null || bValue === undefined) return sortConfig.direction === 'asc' ? -1 : 1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Fallback for other comparable types
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [clientFilteredItems, sortConfig]);

  // --- Pagination Logic (derived from API's total and client's itemsPerPage) ---
  // totalPages is calculated based on total items from API and client's itemsPerPage
  const totalPages = Math.max(1, Math.ceil(totalApiItems / itemsPerPage));
  
  // startIndex and endIndex refer to the overall dataset, not just the current page's view.
  // These are for display purposes in the pagination footer.
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalApiItems);

  // The `paginatedItems` returned here are essentially the `sortedItems`
  // because the `apiProducts` (which `clientFilteredItems` and `sortedItems` derive from)
  // are already a paginated chunk from the API. The slice is now implicitly done by the API fetch.
  const paginatedItems = sortedItems; 

  // --- Handlers ---
  const handleSort = (key: keyof InventoryItem) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') direction = 'desc';
      else if (sortConfig.direction === 'desc') direction = null; // Cycle to no sort
      else if (sortConfig.direction === null) direction = 'asc'; // Cycle from no sort to asc
    }
    setSortConfig({ key: direction ? key : null, direction });
  };


  return {
    // Original hook return values as specified in the prompt
    paginatedItems,
    totalItems: totalApiItems, // Total items across all pages, as per API response
    startIndex: totalApiItems > 0 ? startIndex : 0, // Adjust startIndex for 0 items
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
    setCurrentPage,
    totalPages,
    itemsPerPage,
    setItemsPerPage,
    // Optional: expose loading and error for UI feedback, but not strictly required by prompt
    isLoading,
    error,
  };
};
