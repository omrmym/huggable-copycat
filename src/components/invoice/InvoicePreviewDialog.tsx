import { useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Printer, Download } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';

interface InvoiceData {
  id: string;
  created_at: string;
  amount: number;
  status: string;
  type: string;
  description: string | null;
  radius_users?: {
    username: string;
    full_name: string | null;
    phone: string | null;
    expires_at: string | null;
    plan?: {
      name: string;
      price: number;
    } | null;
  } | null;
}

interface InvoicePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: InvoiceData | null;
}

export function InvoicePreviewDialog({ open, onOpenChange, invoice }: InvoicePreviewDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!invoice) return null;

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice.id.slice(0, 8).toUpperCase()}</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .company-name {
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 8px;
            }
            .invoice-title {
              font-size: 20px;
              color: #666;
            }
            .invoice-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
            }
            .info-section {
              flex: 1;
            }
            .info-section h3 {
              font-size: 14px;
              color: #666;
              margin-bottom: 8px;
              text-transform: uppercase;
            }
            .info-section p {
              margin: 4px 0;
              font-size: 14px;
            }
            .table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            .table th, .table td {
              border: 1px solid #ddd;
              padding: 12px;
              text-align: left;
            }
            .table th {
              background-color: #f5f5f5;
              font-weight: 600;
            }
            .total-row {
              font-weight: bold;
              font-size: 16px;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              color: #666;
              font-size: 12px;
            }
            .status-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
            }
            .status-completed {
              background-color: #dcfce7;
              color: #166534;
            }
            .status-pending {
              background-color: #fef3c7;
              color: #92400e;
            }
            .status-failed {
              background-color: #fee2e2;
              color: #991b1b;
            }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">MikroBill</div>
            <div class="invoice-title">Payment Invoice</div>
          </div>
          
          <div class="invoice-info">
            <div class="info-section">
              <h3>Invoice Details</h3>
              <p><strong>Invoice No:</strong> ${invoice.id.slice(0, 8).toUpperCase()}</p>
              <p><strong>Date:</strong> ${format(new Date(invoice.created_at), 'MMMM d, yyyy')}</p>
              <p><strong>Time:</strong> ${format(new Date(invoice.created_at), 'HH:mm:ss')}</p>
              <p><strong>Status:</strong> <span class="status-badge status-${invoice.status}">${invoice.status.toUpperCase()}</span></p>
            </div>
            <div class="info-section">
              <h3>Customer Details</h3>
              <p><strong>Name:</strong> ${invoice.radius_users?.full_name || 'N/A'}</p>
              <p><strong>Username:</strong> ${invoice.radius_users?.username || 'N/A'}</p>
              <p><strong>Mobile:</strong> ${invoice.radius_users?.phone || 'N/A'}</p>
              ${invoice.radius_users?.expires_at ? `<p><strong>Expiry:</strong> ${format(new Date(invoice.radius_users.expires_at), 'MMMM d, yyyy')}</p>` : ''}
            </div>
          </div>
          
          <table class="table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Plan</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${invoice.description || invoice.type.replace('_', ' ').toUpperCase()}</td>
                <td>${invoice.radius_users?.plan?.name || 'N/A'}</td>
                <td style="text-align: right;">৳${Number(invoice.amount).toLocaleString()}</td>
              </tr>
              <tr class="total-row">
                <td colspan="2" style="text-align: right;"><strong>Total Amount</strong></td>
                <td style="text-align: right;"><strong>৳${Number(invoice.amount).toLocaleString()}</strong></td>
              </tr>
            </tbody>
          </table>
          
          <div class="footer">
            <p>Thank you for your payment!</p>
            <p>This is a computer-generated invoice and does not require a signature.</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownload = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;
    
    const formatPDF = (amount: number) => `BDT ${amount.toLocaleString()}`;

    // Header
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('MikroBill', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Payment Invoice', pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
    
    // Header line
    doc.setDrawColor(51, 51, 51);
    doc.setLineWidth(0.5);
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 15;

    // Invoice Details Section
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE DETAILS', 20, yPos);
    doc.text('CUSTOMER DETAILS', pageWidth / 2 + 10, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    // Left column - Invoice Details
    doc.text(`Invoice No: ${invoice.id.slice(0, 8).toUpperCase()}`, 20, yPos);
    doc.text(`Name: ${invoice.radius_users?.full_name || 'N/A'}`, pageWidth / 2 + 10, yPos);
    yPos += 6;
    
    doc.text(`Date: ${format(new Date(invoice.created_at), 'MMMM d, yyyy')}`, 20, yPos);
    doc.text(`Username: @${invoice.radius_users?.username || 'N/A'}`, pageWidth / 2 + 10, yPos);
    yPos += 6;
    
    doc.text(`Time: ${format(new Date(invoice.created_at), 'HH:mm:ss')}`, 20, yPos);
    doc.text(`Mobile: ${invoice.radius_users?.phone || 'N/A'}`, pageWidth / 2 + 10, yPos);
    yPos += 6;
    
    doc.text(`Status: ${invoice.status.toUpperCase()}`, 20, yPos);
    if (invoice.radius_users?.expires_at) {
      doc.text(`Expiry: ${format(new Date(invoice.radius_users.expires_at), 'MMMM d, yyyy')}`, pageWidth / 2 + 10, yPos);
    }
    yPos += 15;

    // Table Header
    doc.setFillColor(245, 245, 245);
    doc.rect(20, yPos - 5, pageWidth - 40, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Description', 25, yPos);
    doc.text('Plan', 90, yPos);
    doc.text('Amount', pageWidth - 45, yPos);
    yPos += 10;

    // Table Row
    doc.setFont('helvetica', 'normal');
    const description = invoice.description || invoice.type.replace('_', ' ').charAt(0).toUpperCase() + invoice.type.replace('_', ' ').slice(1);
    doc.text(description, 25, yPos);
    doc.text(invoice.radius_users?.plan?.name || 'N/A', 90, yPos);
    doc.text(formatPDF(Number(invoice.amount)), pageWidth - 45, yPos);
    yPos += 10;

    // Table border
    doc.setDrawColor(221, 221, 221);
    doc.line(20, yPos - 15, pageWidth - 20, yPos - 15);
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 5;

    // Total Row
    doc.setFillColor(250, 250, 250);
    doc.rect(20, yPos - 5, pageWidth - 40, 12, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Total Amount', pageWidth - 80, yPos + 2);
    doc.setFontSize(12);
    doc.text(formatPDF(Number(invoice.amount)), pageWidth - 45, yPos + 2);
    yPos += 25;

    // Footer
    doc.setDrawColor(221, 221, 221);
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Thank you for your payment!', pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
    doc.setFontSize(8);
    doc.text('This is a computer-generated invoice and does not require a signature.', pageWidth / 2, yPos, { align: 'center' });

    // Save PDF
    doc.save(`Invoice-${invoice.id.slice(0, 8).toUpperCase()}.pdf`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success/20 text-success border-0">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-warning/20 text-warning border-0">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-destructive/20 text-destructive border-0">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Invoice Preview</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div ref={printRef} className="space-y-6 p-4 bg-card rounded-lg border">
          {/* Invoice Header */}
          <div className="text-center border-b pb-4">
            <h2 className="text-2xl font-bold text-primary">MikroBill</h2>
            <p className="text-muted-foreground">Payment Invoice</p>
          </div>

          {/* Invoice Info */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-2">Invoice Details</h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Invoice No:</span> {invoice.id.slice(0, 8).toUpperCase()}</p>
                <p><span className="font-medium">Date:</span> {format(new Date(invoice.created_at), 'MMM d, yyyy')}</p>
                <p><span className="font-medium">Time:</span> {format(new Date(invoice.created_at), 'HH:mm:ss')}</p>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Status:</span>
                  {getStatusBadge(invoice.status)}
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-2">Customer Details</h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Name:</span> {invoice.radius_users?.full_name || 'N/A'}</p>
                <p><span className="font-medium">Username:</span> @{invoice.radius_users?.username || 'N/A'}</p>
                <p><span className="font-medium">Mobile:</span> {invoice.radius_users?.phone || 'N/A'}</p>
                {invoice.radius_users?.expires_at && (
                  <p><span className="font-medium">Expiry:</span> {format(new Date(invoice.radius_users.expires_at), 'MMM d, yyyy')}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Invoice Items */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3">Payment Details</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Description</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Plan</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-3 text-sm">
                      {invoice.description || invoice.type.replace('_', ' ').charAt(0).toUpperCase() + invoice.type.replace('_', ' ').slice(1)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {invoice.radius_users?.plan?.name || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      ৳{Number(invoice.amount).toLocaleString()}
                    </td>
                  </tr>
                  <tr className="border-t bg-muted/50">
                    <td colSpan={2} className="px-4 py-3 text-right font-semibold">
                      Total Amount
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-lg text-primary">
                      ৳{Number(invoice.amount).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground pt-4 border-t">
            <p>Thank you for your payment!</p>
            <p className="text-xs mt-1">This is a computer-generated invoice.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
