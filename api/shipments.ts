
const BASE_URL = 'https://kv-fba-api.onrender.com/api';

// Re-using Shipment and PackingLine types from types.ts
import { Shipment, PackingLine, ShippingLabel, ShipmentItem } from '../types';

// Export BASE_URL
export { BASE_URL };

// API response type for updating packing
interface UpdatePackingResponse {
  success: boolean;
  message?: string;
  data: Shipment; // Return the full updated shipment object
}

// API request body for updating shipment contents
interface UpdateShipmentContentsPayload {
  updates: { sku: string; newQuantity: number }[];
  additions: { sku: string; asin: string; quantity: number }[];
}

interface UpdateShipmentContentsResponse {
  success: boolean;
  message?: string;
  data: Shipment; // Ensure data is part of successful response
  historyEvent?: any; // Assuming backend returns a history event
}

interface ResetShipmentResponse {
  success: boolean;
  message?: string;
  data: Shipment;
  historyEvent?: any; // Assuming backend returns a history event
}

// New: Define response interface for label upload
interface UploadLabelResponse {
  success: boolean;
  message?: string;
  data: ShippingLabel;
}

// New: Define response interface for label deletion
interface DeleteLabelResponse {
  success: boolean;
  message?: string;
}

// Generic error handling utility for API calls
// New: Ensure handleApiResponse returns the full parsed response object.
async function handleApiResponse<T>(response: Response): Promise<T> {
  let responseText: string;
  try {
    responseText = await response.text();
  } catch (e: any) {
    throw new Error(`Network error or no response body: ${e.message}`);
  }

  let responseData: any;
  try {
    responseData = JSON.parse(responseText);
  } catch {
    // If response is not JSON, use the raw text as the error message
    throw new Error(`Server returned non-JSON response (Status: ${response.status}): ${responseText.substring(0, 200)}...`);
  }

  if (!response.ok || !responseData.success) {
    throw new Error(responseData.message || `API error: ${responseData.error || 'Unknown error'}`);
  }
  return responseData as T;
}


/**
 * Updates the packing lines and status for a specific shipment.
 * @param shipmentId The ID of the shipment to update.
 * @param packingLines An array of PackingLine objects to save.
 * @param status The new status for the shipment (e.g., "Packed").
 * @returns A promise that resolves to the updated Shipment object.
 */
export async function updateShipmentPacking(
  shipmentId: string,
  packingLines: PackingLine[],
  status: 'Packed'
): Promise<Shipment> {
  const response = await fetch(`${BASE_URL}/shipments/${shipmentId}/packing`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      packingLines,
      status,
    }),
  });

  const responseData: UpdatePackingResponse = await handleApiResponse(response);
  return responseData.data;
}

/**
 * Uploads a shipping label PDF file for a specific shipment.
 * @param shipmentId The ID of the shipment.
 * @param file The PDF File object to upload.
 * @param appliesTo An array of PackingLine IDs the label applies to.
 * @returns A promise that resolves to the newly created ShippingLabel object.
 */
export async function uploadShippingLabel(
  shipmentId: string,
  file: File,
  appliesTo: string[]
): Promise<ShippingLabel> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('appliesTo', JSON.stringify(appliesTo)); // Backend expects JSON string

  const response = await fetch(`${BASE_URL}/shipments/${shipmentId}/labels`, {
    method: 'POST',
    body: formData,
  });

  // Fix: Specify the expected response type and extract the 'data' property
  const responseData: UploadLabelResponse = await handleApiResponse(response);
  return responseData.data; // Assuming data contains the new ShippingLabel object
}

/**
 * Deletes a specific shipping label for a shipment.
 * @param shipmentId The ID of the shipment.
 * @param labelId The ID of the label to delete.
 * @returns A promise that resolves to a success message.
 */
export async function deleteShippingLabel(
  shipmentId: string,
  labelId: string
): Promise<DeleteLabelResponse> { // Fix: Changed return type to DeleteLabelResponse
  const response = await fetch(`${BASE_URL}/shipments/${shipmentId}/labels/${labelId}`, {
    method: 'DELETE',
  });

  // Fix: Specify the expected response type
  const responseData: DeleteLabelResponse = await handleApiResponse(response);
  return responseData;
}

/**
 * Updates the contents (items and quantities) of a shipment.
 * @param shipmentId The ID of the shipment to update.
 * @param payload An object containing arrays for item updates and additions.
 * @returns A promise that resolves to the updated Shipment object.
 */
export async function updateShipmentContents(
  shipmentId: string,
  payload: UpdateShipmentContentsPayload
): Promise<Shipment> {
  const response = await fetch(`${BASE_URL}/shipments/${shipmentId}/contents`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const responseData: UpdateShipmentContentsResponse = await handleApiResponse(response);
  return responseData.data;
}

/**
 * Resets a shipment to its original setup, clearing packing lines and setting status to Draft.
 * @param shipmentId The ID of the shipment to reset.
 * @returns A promise that resolves to the reset Shipment object.
 */
export async function resetShipment(
  shipmentId: string
): Promise<ResetShipmentResponse> {
  const response = await fetch(`${BASE_URL}/shipments/${shipmentId}/reset`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const responseData: ResetShipmentResponse = await handleApiResponse(response);
  return responseData;
}