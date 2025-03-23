import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

export function exportToCSV(data: any[], filename: string) {
  const csvContent = convertToCSV(data);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, `${filename}.csv`);
}

export function exportToExcel(data: any[], filename: string) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportToPDF(data: any[], filename: string) {
  // In a real app, you would use a PDF library like jsPDF
  // For this demo, we'll just create a text file with JSON data
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json" });
  saveAs(blob, `${filename}.json`);
}

export function formatShipmentsForExport(shipments: any[]) {
  return shipments.map((shipment) => ({
    ID: shipment.id,
    Type: shipment.type,
    Carrier: shipment.carrier,
    "Pickup Location": shipment.pickup.location,
    "Pickup Time": shipment.pickup.time,
    "Delivery Location": shipment.delivery.location,
    "Delivery Time": shipment.delivery.time,
  }));
}

function convertToCSV(data: any[]) {
  if (data.length === 0) return "";

  const headers = Object.keys(data[0]);
  const headerRow = headers.join(",");

  const rows = data.map((item) => {
    return headers
      .map((header) => {
        const value = item[header];
        // Handle values with commas by wrapping in quotes
        return typeof value === "string" && value.includes(",")
          ? `"${value}"`
          : value;
      })
      .join(",");
  });

  return [headerRow, ...rows].join("\n");
}
