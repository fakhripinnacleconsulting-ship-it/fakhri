"use client";
import { Download, Eye, CreditCard } from "lucide-react";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
const invoices = [
  {
    id: "INV-2026-001",
    date: "Jan 15, 2026",
    amount: "₹20,000",
    status: "paid",
    dueDate: "Jan 15, 2026"
  },
  {
    id: "INV-2025-012",
    date: "Dec 15, 2025",
    amount: "₹20,000",
    status: "paid",
    dueDate: "Dec 15, 2025"
  },
  {
    id: "INV-2025-011",
    date: "Nov 15, 2025",
    amount: "₹20,000",
    status: "paid",
    dueDate: "Nov 15, 2025"
  },
];
const ClientBilling = () => {
  return (<div className="space-y-6">
    <div>
      <h1 className="font-heading text-2xl font-bold mb-2">Billing</h1>
      <p className="text-muted-foreground">View your invoices and payment history.</p>
    </div>

    {/* Payment Summary */}
    <div className="grid md:grid-cols-3 gap-4">
      <div className="bg-card rounded-xl border p-6">
        <div className="flex items-center gap-3 mb-2">
          <CreditCard className="h-5 w-5 text-primary" />
          <span className="text-sm text-muted-foreground">Current Plan</span>
        </div>
        <p className="text-2xl font-heading font-bold">Premium</p>
        <p className="text-sm text-muted-foreground">₹20,000/month</p>
      </div>
      <div className="bg-card rounded-xl border p-6">
        <div className="flex items-center gap-3 mb-2">
          <CreditCard className="h-5 w-5 text-primary" />
          <span className="text-sm text-muted-foreground">Next Payment</span>
        </div>
        <p className="text-2xl font-heading font-bold">Feb 15, 2026</p>
        <p className="text-sm text-muted-foreground">₹20,000 due</p>
      </div>
      <div className="bg-card rounded-xl border p-6">
        <div className="flex items-center gap-3 mb-2">
          <CreditCard className="h-5 w-5 text-primary" />
          <span className="text-sm text-muted-foreground">Total Paid</span>
        </div>
        <p className="text-2xl font-heading font-bold">₹60,000</p>
        <p className="text-sm text-muted-foreground">3 invoices</p>
      </div>
    </div>

    {/* Invoice Table */}
    <div className="bg-card rounded-xl border overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="font-heading font-semibold">Invoice History</h2>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (<TableRow key={invoice.id}>
            <TableCell className="font-medium">{invoice.id}</TableCell>
            <TableCell className="text-muted-foreground">{invoice.date}</TableCell>
            <TableCell>{invoice.amount}</TableCell>
            <TableCell>
              <StatusBadge status={invoice.status} />
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>))}
        </TableBody>
      </Table>
    </div>

    {/* Payment Methods */}
    <div className="bg-card rounded-xl border p-6">
      <h2 className="font-heading font-semibold mb-4">Payment Method</h2>
      <div className="flex items-center justify-between p-4 rounded-lg bg-accent/50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded flex items-center justify-center text-white text-xs font-bold">
            VISA
          </div>
          <div>
            <p className="font-medium">•••• •••• •••• 4242</p>
            <p className="text-sm text-muted-foreground">Expires 12/2027</p>
          </div>
        </div>
        <Button variant="outline" size="sm">Update</Button>
      </div>
    </div>
  </div>);
};
export default ClientBilling;
