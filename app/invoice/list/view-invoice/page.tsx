"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useGetInvoiceItemsQuery, useGetInvoiceByIdQuery } from '@/lib/slices/invoicesApi'
import type React from "react"
import { InvoiceListItem } from "../page"

interface ViewInvoiceDialogProps {
  invoice: InvoiceListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewInvoiceDialog({ invoice, open, onOpenChange }: ViewInvoiceDialogProps) {
  if (!invoice) return null
  const { data: items = [], isLoading: loading } = useGetInvoiceItemsQuery(invoice.id, { skip: !open })
  const { data: fullInvoice, isLoading: loadingDetails } = useGetInvoiceByIdQuery(invoice.id, { skip: !open })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Invoice Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1 px-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Reference</p>
              <p className="font-medium">{fullInvoice?.reference ?? invoice.reference}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-medium">{fullInvoice?.date ? String(fullInvoice.date) : invoice.date}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Customer</p>
              <p className="font-medium">{invoice.customer_name || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Warehouse</p>
              <p className="font-medium">{invoice.warehouse_name || 'Unknown'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <Badge
                variant={(fullInvoice?.status ?? invoice.status) === "paid" ? "default" : "secondary"}
                className={
                  (fullInvoice?.status ?? invoice.status) === "paid"
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }
              >
                {(fullInvoice?.status ?? invoice.status).charAt(0).toUpperCase() + (fullInvoice?.status ?? invoice.status).slice(1)}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500">Payment Status</p>
              <Badge
                variant={(fullInvoice?.payment_status ?? invoice.payment_status) === "paid" ? "default" : "secondary"}
                className={
                  (fullInvoice?.payment_status ?? invoice.payment_status) === "paid"
                    ? "bg-green-100 text-green-800"
                    : (fullInvoice?.payment_status ?? invoice.payment_status) === "partial" ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"
                }
              >
                {(fullInvoice?.payment_status ?? invoice.payment_status).charAt(0).toUpperCase() + (fullInvoice?.payment_status ?? invoice.status).slice(1)}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Created By</p>
              <p className="font-medium">{fullInvoice?.created_by ?? '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="font-medium">${Number(fullInvoice?.total ?? invoice.total).toFixed(2)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Subtotal</p>
              <p className="font-medium">${Number(fullInvoice?.subtotal ?? 0).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Order Tax</p>
              <p className="font-medium">${Number(fullInvoice?.tax_amount ?? 0).toFixed(2)} ({Number(fullInvoice?.tax_rate ?? 0)}%)</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Discount</p>
              <p className="font-medium">${Number(fullInvoice?.discount ?? 0).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Shipping</p>
              <p className="font-medium">${Number(fullInvoice?.shipping ?? 0).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Paid</p>
              <p className="font-medium">${Number(fullInvoice?.paid ?? 0).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Due</p>
              <p className="font-medium">${Number(fullInvoice?.due ?? 0).toFixed(2)}</p>
            </div>
          </div>

          <div className="mt-2">
            <p className="text-sm font-medium mb-2">Notes</p>
            <p className="text-sm text-gray-700">{fullInvoice?.notes ?? 'No notes provided.'}</p>
          </div>

          <div className="mt-2">
            <p className="text-sm font-medium mb-2">Items</p>
            <div className="rounded-md border max-h-64 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left p-3 min-w-[40px]">#</th>
                    <th className="text-left p-3 min-w-[150px]">Product</th>
                    <th className="text-left p-3 min-w-[100px]">Code</th>
                    <th className="text-left p-3 min-w-[60px]">Qty</th>
                    <th className="text-left p-3 min-w-[80px]">Unit Price</th>
                    <th className="text-left p-3 min-w-[80px]">Discount</th>
                    <th className="text-left p-3 min-w-[60px]">Tax</th>
                    <th className="text-left p-3 min-w-[80px]">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {loading || loadingDetails ? (
                    <tr><td className="p-3" colSpan={8}>Loading...</td></tr>
                  ) : items.length === 0 ? (
                    <tr><td className="p-3 text-gray-500" colSpan={8}>No items</td></tr>
                  ) : (
                    items.map((it: any, idx: number) => (
                      <tr key={it.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">{idx + 1}</td>
                        <td className="p-3">{it.name || 'N/A'}</td>
                        <td className="p-3">{it.code || 'N/A'}</td>
                        <td className="p-3">{it.quantity || 0}</td>
                        <td className="p-3">${Number(it.unit_price ?? 0).toFixed(2)}</td>
                        <td className="p-3">${Number(it.discount || 0).toFixed(2)}</td>
                        <td className="p-3">${Number(it.tax || 0).toFixed(2)}</td>
                        <td className="p-3">${Number(it.subtotal ?? ((Number(it.unit_price ?? 0) * Number(it.quantity || 0)) - Number(it.discount || 0) + Number(it.tax || 0))).toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        <div className="flex justify-end pt-4 border-t bg-white">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
