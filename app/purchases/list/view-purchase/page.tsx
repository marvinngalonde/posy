"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Purchase } from "@/lib/types"
import { format } from "date-fns"
import { Eye } from "lucide-react"
import type React from "react"

interface ViewPurchaseDialogProps {
  purchase: Purchase | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewPurchaseDialog({ purchase, open, onOpenChange }: ViewPurchaseDialogProps) {
  if (!purchase) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Purchase Details - {purchase.reference}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto flex-1 px-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Date</h3>
              <p>{format(new Date(purchase.date), "MMM dd, yyyy")}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Supplier</h3>
              <p>{purchase.suppliers?.name || 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Warehouse</h3>
              <p>{purchase.warehouses?.name || 'N/A'}</p>
            </div>
          </div>

          <div className="border rounded-lg max-h-64 overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-white">
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Unit Cost</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchase.purchase_items?.map((item) => (
                  <TableRow key={item.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="font-medium">{item.products?.name || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{item.products?.code || 'N/A'}</div>
                    </TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">${Number(item.unit_cost).toFixed(2)}</TableCell>
                    <TableCell className="text-right">${Number(item.subtotal).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Notes</h3>
              <div className="p-3 bg-gray-50 rounded-md">
                {purchase.notes || "No notes provided"}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Summary</h3>
              <div className="space-y-2 p-3 bg-gray-50 rounded-md">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{Number(purchase.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax ({purchase.tax_rate}%):</span>
                  <span>{Number(purchase.tax_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>{Number(purchase.discount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span>{Number(purchase.shipping)}</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>{Number(purchase.total)}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className="flex justify-end pt-4 border-t bg-white">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}