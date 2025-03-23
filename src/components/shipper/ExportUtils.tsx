import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

// Function to export data to CSV
export function exportToCSV(data: any[], filename: string) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  // Generate CSV file
  const csvOutput = XLSX.write(workbook, { bookType: "csv", type: "array" });
  const blob = new Blob([csvOutput], { type: "text/csv;charset=utf-8" });

  saveAs(blob, `${filename}.csv`);
}

// Function to export data to Excel
export function exportToExcel(data: any[], filename: string) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  // Generate Excel file
  const excelOutput = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelOutput], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(blob, `${filename}.xlsx`);
}

// Function to export data to PDF (simplified version)
export function exportToPDF(data: any[], filename: string) {
  // In a real implementation, you would use a library like jsPDF
  // This is a placeholder that creates a text representation
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });

  saveAs(blob, `${filename}.json`);

  // Show a message that this is just a placeholder
  alert(
    "PDF export would be implemented with a library like jsPDF. For now, a JSON file has been downloaded instead.",
  );
}

// Function to format shipment data for export
export function formatShipmentsForExport(shipments: any[]) {
  return shipments.map((shipment) => ({
    ID: shipment.id,
    Status: shipment.status,
    Origin: shipment.origin || shipment.pickup?.location,
    Destination: shipment.destination || shipment.delivery?.location,
    "Pickup Date": shipment.pickupDate,
    "Delivery Date": shipment.deliveryDate,
    Carrier: shipment.carrier || "Not Assigned",
    Type: shipment.type,
    Weight: shipment.weight,
    Rate: shipment.rate ? `$${shipment.rate}` : "N/A",
  }));
}
