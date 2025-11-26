const BASE_URL = 'https://kv-fba-api.onrender.com/api'; // Define base URL

// Backend Product type definition
export type Product = {
  _id: string;
  sku: string;
  asin: string;
  productName: string;
  description: any;
  imageUrl: string;
  productWeight: number;
  weightUnit: string;
  productDimensions: {
    length: number;
    width: number;
    height: number;
    unit: string; // 'cm' or 'in'
  };
  createdAt: string;
};

// Backend Product List Response type
export type ProductListResponse = {
  success: boolean;
  count: number; // number of products in this page
  total: number; // total products matching search
  page: number;
  pages: number; // total pages
  data: Product[];
};

/**
 * Fetches a list of products from the backend API.
 * @param params Optional query parameters for pagination and search.
 * @returns A promise that resolves to ProductListResponse.
 */
export async function fetchProducts(params?: { page?: number; limit?: number; search?: string }): Promise<ProductListResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.append('page', String(params.page));
  if (params?.limit) query.append('limit', String(params.limit));
  if (params?.search) query.append('search', params.search);

  const response = await fetch(`${BASE_URL}/products?${query.toString()}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(errorData.message || 'Failed to fetch products');
  }
  return response.json();
}

/**
 * Creates a new product by sending multipart/form-data to the backend API.
 * @param input Object containing product details and an optional image file.
 * @returns A promise that resolves to the created Product object.
 */
export async function createProduct(input: {
  sku: string;
  asin: string;
  productName: string; // Maps to backend's productName
  description: string;
  productWeight: number;
  weightUnit?: 'g' | 'kg' | 'lb' | 'oz';
  length: number;
  width: number;
  height: number;
  dimensionUnit?: 'cm' | 'in';
  imageFile?: File | null;
}): Promise<Product> {
  const formData = new FormData();
  formData.append("sku", input.sku);
  formData.append("asin", input.asin);
  formData.append("productName", input.productName);
  formData.append("description", input.description);
  formData.append("productWeight", String(input.productWeight));
  if (input.weightUnit) formData.append("weightUnit", input.weightUnit);
  formData.append("length", String(input.length));
  formData.append("width", String(input.width));
  formData.append("height", String(input.height));
  if (input.dimensionUnit) formData.append("dimensionUnit", input.dimensionUnit);
  if (input.imageFile) formData.append("productImage", input.imageFile);

  const response = await fetch(`${BASE_URL}/products`, {
    method: "POST",
    body: formData,
  });

  const responseData = await response.json();
  if (!response.ok || !responseData.success) {
    throw new Error(responseData.message || "Failed to create product.");
  }
  return responseData.data;
}
