
const BASE_URL = 'https://kv-fba-api.onrender.com/api';

// Re-using Shipment and PackingLine types from types.ts
import { Shipment, PackingLine } from '../types';

// API response type for updating packing
interface UpdatePackingResponse {
  success: boolean;
  message?: string;
  data: Shipment; // Return the full updated shipment object
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

  const responseData: UpdatePackingResponse = await response.json();

  if (!response.ok || !responseData.success) {
    throw new Error(responseData.message || 'Failed to update shipment packing.');
  }

  return responseData.data;
}
