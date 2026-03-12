import jsPDF from 'jspdf';
import { Bill } from '../types';

export const generateInvoicePDF = (bill: Bill) => {
    const doc = new jsPDF();
    const customer = bill.customer;

    if (!customer) return;

    // Header
    doc.setFillColor(59, 130, 246); // Blue-600
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('KKR CABLE NETWORK', 20, 25);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Monthly Subscription Invoice', 20, 32);

    // Invoice Info
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE TO:', 20, 60);

    doc.setFont('helvetica', 'normal');
    doc.text(customer.name, 20, 68);
    doc.text(customer.phone, 20, 74);
    doc.text(`${customer.village}, ${customer.mandal}`, 20, 80);

    doc.setFont('helvetica', 'bold');
    doc.text('BILLING DETAILS:', 140, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice #: ${bill.id.slice(0, 8).toUpperCase()}`, 140, 68);
    doc.text(`Period: ${new Date(0, bill.month - 1).toLocaleString('default', { month: 'long' })} ${bill.year}`, 140, 74);
    doc.text(`Due Date: ${new Date(bill.due_date).toLocaleDateString()}`, 140, 80);

    // Table Header
    doc.setFillColor(243, 244, 246);
    doc.rect(20, 100, 170, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Description', 25, 106);
    doc.text('Box ID', 100, 106);
    doc.text('Amount', 160, 106);

    // Table Body
    doc.setFont('helvetica', 'normal');
    doc.text('Cable TV Monthly Subscription', 25, 120);
    doc.text(customer.box_id, 100, 120);
    doc.text(`Rs. ${bill.amount.toLocaleString()}`, 160, 120);

    // Total
    doc.setDrawColor(200, 200, 200);
    doc.line(130, 140, 190, 140);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Total Amount:', 130, 150);
    doc.text(`Rs. ${bill.amount.toLocaleString()}`, 165, 150);

    // Status Stamp
    if (bill.paid_status === 'paid') {
        doc.setTextColor(16, 185, 129); // Emerald-600
        doc.setFontSize(40);
        doc.text('PAID', 85, 180, { angle: 15 });
    } else {
        doc.setTextColor(244, 63, 94); // Rose-600
        doc.setFontSize(40);
        doc.text('UNPAID', 80, 180, { angle: 15 });
    }

    // Footer
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(10);
    doc.text('Thank you for choosing KKR Cable Network!', 105, 280, { align: 'center' });

    doc.save(`Invoice_${customer.name.replace(/\s+/g, '_')}_${bill.month}_${bill.year}.pdf`);
};
