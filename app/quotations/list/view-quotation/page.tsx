"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { useGetQuotationItemsQuery, useGetQuotationByIdQuery } from '@/lib/slices/quotationsApi'
import type React from "react"

interface QuotationListItem {
  id: string
  date: string
  reference: string
  customer_name?: string
  warehouse_name?: string
  status: string
  total: number
  created_by?: string
  valid_until?: string | null
}

interface ViewQuotationDialogProps {
  quotation: QuotationListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewQuotationDialog({ quotation, open, onOpenChange }: ViewQuotationDialogProps) {
  if (!quotation) return null
  const { data: items = [], isLoading: loading } = useGetQuotationItemsQuery(quotation.id, { skip: !open })
  const { data: fullQuotation, isLoading: loadingDetails } = useGetQuotationByIdQuery(quotation.id, { skip: !open })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Quotation Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Reference</p>
              <p className="font-medium">{fullQuotation?.reference ?? quotation.reference}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-medium">{fullQuotation?.date ? String(fullQuotation.date) : quotation.date}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Customer</p>
              <p className="font-medium">{fullQuotation?.customers?.name || quotation.customers?.name || quotation.customer_name || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Warehouse</p>
              <p className="font-medium">{fullQuotation?.warehouses?.name || quotation.warehouses?.name || quotation.warehouse_name || 'Unknown'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <Badge
                variant={(fullQuotation?.status ?? quotation.status) === "approved" ? "default" : "secondary"}
                className={
                  (fullQuotation?.status ?? quotation.status) === "approved"
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }
              >
                {(fullQuotation?.status ?? quotation.status).charAt(0).toUpperCase() + (fullQuotation?.status ?? quotation.status).slice(1)}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="font-medium">${Number(fullQuotation?.total ?? quotation.total).toFixed(2)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Valid Until</p>
              <p className="font-medium">{fullQuotation?.valid_until ? String(fullQuotation.valid_until) : '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Created By</p>
              <p className="font-medium">{fullQuotation?.created_by ?? '-'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Subtotal</p>
              <p className="font-medium">${Number(fullQuotation?.subtotal ?? 0).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Order Tax</p>
              <p className="font-medium">${Number(fullQuotation?.tax_amount ?? 0).toFixed(2)} ({Number(fullQuotation?.tax_rate ?? 0)}%)</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Discount</p>
              <p className="font-medium">${Number(fullQuotation?.discount ?? 0).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Shipping</p>
              <p className="font-medium">${Number(fullQuotation?.shipping ?? 0).toFixed(2)}</p>
            </div>
          </div>

          <div className="mt-2">
            <p className="text-sm font-medium mb-2">Items</p>
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3">#</th>
                    <th className="text-left p-3">Product</th>
                    <th className="text-left p-3">Code</th>
                    <th className="text-left p-3">Qty</th>
                    <th className="text-left p-3">Unit Price</th>
                    <th className="text-left p-3">Discount</th>
                    <th className="text-left p-3">Tax</th>
                    <th className="text-left p-3">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {loading || loadingDetails ? (
                    <tr><td className="p-3" colSpan={8}>Loading...</td></tr>
                  ) : items.length === 0 ? (
                    <tr><td className="p-3 text-gray-500" colSpan={8}>No items</td></tr>
                  ) : (
                    items.map((it: any, idx: number) => (
                      <tr key={it.id} className="border-b">
                        <td className="p-3">{idx + 1}</td>
                        <td className="p-3">{it.products?.name || it.product?.name || it.product_name || it.name || 'N/A'}</td>
                        <td className="p-3">{it.products?.code || it.product?.code || it.product_code || it.code || 'N/A'}</td>
                        <td className="p-3">{it.quantity || 0}</td>
                        <td className="p-3">${Number(it.price ?? it.unit_price ?? 0).toFixed(2)}</td>
                        <td className="p-3">${Number(it.discount || 0).toFixed(2)}</td>
                        <td className="p-3">${Number(it.tax || 0).toFixed(2)}</td>
                        <td className="p-3">${Number(it.subtotal ?? ((Number(it.price ?? it.unit_price ?? 0) * Number(it.quantity || 0)) - Number(it.discount || 0) + Number(it.tax || 0))).toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}