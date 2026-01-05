import { equipmentTypes } from "@pages/Equipment/Equipments/constants";

/**
 * Formats an equipment ID with its type prefix
 * @param equipmentType - The equipment type (e.g., "notebook", "monitor")
 * @param inventoryNumber - The inventory number
 * @returns Formatted ID (e.g., "NTB-123")
 */
export function formatEquipmentId(
  equipmentType: string,
  inventoryNumber: number
): string {
  const type = equipmentTypes.find((t) => t.value === equipmentType);
  const prefix = type?.prefix || "UNK"; // UNK = Unknown if type not found
  
  return `${prefix}-${inventoryNumber}`;
}

