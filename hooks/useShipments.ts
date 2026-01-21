

import { useState, useMemo, useEffect } from 'react';
import { Shipment, ShipmentStatus, PackingLine } from '../types';

// Removed MOCK_SHIPMENTS as per requirements

export type SortDirection = 'asc' | 'desc' | null;
export interface SortConfig {
  key: keyof Shipment | null;
  direction: SortDirection;
}

export interface ShipmentFilterState {
  originWarehouse: string;
  carrier: string;
  dateRange: string; // Simplified for now: 'Today', 'Last 7', 'Last 30'
}

export const INITIAL_SHIPMENT_FILTERS: ShipmentFilterState = {
  originWarehouse: '',
  carrier: '',
  dateRange: ''
};

// Define API response structure for shipments
interface ShipmentAPIResponse {
  success: boolean;
  count: number; // number of products in this page
  total: number; // total products matching search
  page?: number;
  pages?: number; // total pages
  data: {
    _id: string; // MongoDB internal ID
    shipmentId: string;
    shipmentName: string;
    shipmentContents?: Array<{ sku: string; asin: string; quantity: number; _id: string }>;
    packingLines?: Array<{ // Assuming API returns this structure, even if empty
      _id?: string; // Add optional _id for backend-provided ID
      boxCount: number;
      dimensions: {
        length: number;
        width: number;
        height: number;
        unit: string;
      };
      weight: number;
      weightUnit: string;
      unitsPerBox: Array<{ sku: string; quantity: number }>;
    }>;
    status: string; // Corresponds to ShipmentStatus
    createdAt: string;
    updatedAt: string;
    isPriority?: boolean; // Assume API might return this
    priorityIndex?: number; // Assume API might return this
    shippingLabels?: Array<{ // Include shipping labels in API response type
      _id: string;
      fileName: string;
      fileUrl: string;
      appliesTo: string[];
      uploadedAt: string;
    }>;
  }[];
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // 1 second

export const useShipments = (externalRefreshKey: number = 0) => { // Accept refreshKey as a prop
  const [allLiveShipments, setAllLiveShipments] = useState<Shipment[]>([]
);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [internalRefreshCounter, setInternalRefreshCounter] = useState(0); // New: Internal state to trigger manual refresh

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All Statuses');
  const [filters, setFilters] = useState<ShipmentFilterState>(INITIAL_SHIPMENT_FILTERS);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'createdDate', direction: 'desc' });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Effect to fetch data from API
  useEffect(() => {
    const fetchAllShipments = async (retries = 0) => {
      if (retries === 0) { // Only set loading and clear error on initial attempt
        setIsLoading(true);
        setError(null);
      }
      try {
        const response = await fetch('https://kv-fba-api.onrender.com/api/shipments');
        if (!response.ok) {
          const errorText = await response.text(); // Get raw text first
          let errorMessage = `Server responded with status ${response.status}`;
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorMessage;
          } catch {
            // If JSON parsing fails, use the raw text or default message
            errorMessage = errorText || errorMessage;
          }
          throw new Error(errorMessage);
        }
        const apiResponse: ShipmentAPIResponse = await response.json();

        // Map API data to Shipment interface
        const mappedShipments: Shipment[] = apiResponse.data.map(apiShipment => {
          const totalItems = apiShipment.shipmentContents?.reduce((sum, item) => sum + item.quantity, 0) || 0;
          return {
            shipmentId: apiShipment.shipmentId, // Use shipmentId as the primary identifier
            name: apiShipment.shipmentName,
            destination: "FBA Warehousing & Distribution", // Fixed text as per prompt
            originWarehouse: "Main Warehouse",   // Placeholder as per prompt
            carrier: "UPS Ground",               // Placeholder for carrier
            totalItems: totalItems,
            status: apiShipment.status as ShipmentStatus, // Cast string to ShipmentStatus
            createdDate: apiShipment.createdAt,
            lastUpdated: apiShipment.updatedAt,
            items: apiShipment.shipmentContents?.map(content => ({ // Map contents to ShipmentItem for packing panel
              sku: content.sku,
              name: "", // API does not provide product name directly here, will be updated if needed by product lookup
              quantity: content.quantity,
              asin: content.asin, // Include ASIN
            })),
            packingLines: (apiShipment.packingLines || []).map(pl => ({ // Map packing lines
              id: pl._id!, // Ensure each packing line has an ID, strictly from _id
              boxCount: pl.boxCount,
              dimensions: pl.dimensions,
              weight: pl.weight,
              weightUnit: pl.weightUnit,
              unitsPerBox: pl.unitsPerBox,
            })),
            isPriority: apiShipment.isPriority || false, // Default to false if not provided
            priorityIndex: apiShipment.priorityIndex, // Keep undefined if not provided
            shippingLabels: (apiShipment.shippingLabels || []).map(label => ({ // Map shipping labels
              id: label._id,
              fileName: label.fileName,
              fileUrl: label.fileUrl,
              appliesTo: label.appliesTo,
              uploadedAt: label.uploadedAt,
            })),
          };
        });
        setAllLiveShipments(mappedShipments);
      } catch (err: any) {
        console.error("Failed to fetch shipments:", err);
        if (retries < MAX_RETRIES) {
          setTimeout(() => fetchAllShipments(retries + 1), RETRY_DELAY_MS * Math.pow(2, retries));
        } else {
          setError(err.message || "Failed to fetch shipments after multiple retries.");
        }
      } finally {
        if (retries === 0 || retries === MAX_RETRIES) { // Only set loading to false on initial attempt's success or final failure
          setIsLoading(false);
        }
      }
    };

    fetchAllShipments();
  }, [externalRefreshKey, internalRefreshCounter]); // Add both external and internal refresh keys to dependency array

  // Reset page on filter or search query change (client-side pagination is applied to filtered/sorted data)
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, filters]);

  // --- Filtering Logic ---
  const filteredShipments = useMemo(() => {
    const dataToFilter = allLiveShipments;

    return dataToFilter.filter(item => {
      // 1. Search Query
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        item.name.toLowerCase().includes(query) ||
        item.shipmentId.toLowerCase().includes(query) ||
        item.destination.toLowerCase().includes(query) ||
        item.carrier.toLowerCase().includes(query) ||
        item.originWarehouse.toLowerCase().includes(query); // Added originWarehouse to search
      
      if (!matchesSearch) return false;

      // 2. Status
      if (statusFilter !== 'All Statuses' && item.status !== statusFilter) {
        return false;
      }

      // 3. Advanced Filters
      // Using .includes() and .toLowerCase() for case-insensitive partial match consistent with mock data behavior
      if (filters.originWarehouse && !item.originWarehouse.toLowerCase().includes(filters.originWarehouse.toLowerCase())) return false;
      if (filters.carrier && !item.carrier.toLowerCase().includes(filters.carrier.toLowerCase())) return false;

      // 4. Date Range (Simplified Logic)
      if (filters.dateRange) {
        const date = new Date(item.createdDate);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

        if (filters.dateRange === 'Today' && diffDays > 1) return false;
        if (filters.dateRange === 'Last 7 Days' && diffDays > 7) return false;
        if (filters.dateRange === 'Last 30 Days' && diffDays > 30) return false;
      }

      return true;
    });
  }, [allLiveShipments, searchQuery, statusFilter, filters]);

  // --- Sorting Logic ---
  const sortedShipments = useMemo(() => {
    const data = [...filteredShipments];
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

      // Special handling for dates if the key is a date string
      if ((sortConfig.key === 'createdDate' || sortConfig.key === 'lastUpdated') && typeof aValue === 'string' && typeof bValue === 'string') {
        const dateA = new Date(aValue);
        const dateB = new Date(bValue);
        if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
          return sortConfig.direction === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
        }
      }

      // Fallback for other comparable types
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredShipments, sortConfig]);

  // --- Pagination Logic ---
  const totalItems = sortedShipments.length; // Total items after filtering and sorting
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedShipments = sortedShipments.slice(startIndex, startIndex + itemsPerPage);
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  // --- Handlers ---
  const handleSort = (key: keyof Shipment) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') direction = 'desc';
      else if (sortConfig.direction === 'desc') direction = null;
    }
    setSortConfig({ key: direction ? key : null, direction });
  };

  const refresh = () => {
    setInternalRefreshCounter(prev => prev + 1);
  };


  return {
    allShipments: allLiveShipments, // Expose all fetched shipments if needed
    paginatedShipments,
    totalItems,
    startIndex: totalItems > 0 ? startIndex : 0,
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

    isLoading,
    error,
    refresh, // New: Expose refresh function
  };
};