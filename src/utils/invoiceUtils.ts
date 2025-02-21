
import { jsPDF } from 'jspdf';
import { Invoice } from '@/types/invoice';

export const generateInvoicePDF = async (invoice: Invoice): Promise<Blob> => {
  const doc = new jsPDF();
  
  // Add invoice content
  doc.setFontSize(22);
  doc.text('INVOICE', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(`Invoice ID: ${invoice.id}`, 20, 40);
  doc.text(`Due Date: ${invoice.due_date}`, 20, 50);
  doc.text(`Amount: ${invoice.currency} ${invoice.amount}`, 20, 60);
  
  if (invoice.property) {
    doc.text(`Property: ${invoice.property.name}`, 20, 70);
    doc.text(`Address: ${invoice.property.address}`, 20, 80);
  }
  
  if (invoice.tenant) {
    doc.text(`Tenant: ${invoice.tenant.first_name} ${invoice.tenant.last_name}`, 20, 90);
    doc.text(`Email: ${invoice.tenant.email}`, 20, 100);
  }
  
  return doc.output('blob');
};
