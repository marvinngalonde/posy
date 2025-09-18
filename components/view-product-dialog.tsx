"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import type React from "react"

export function ViewProductDialog({
  product,
  open,
  onOpenChange,
}: {
  product: any
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Product Details</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {product.image && (
            <div className="md:col-span-2 flex justify-center">
              <img 
                src={product.image} 
                alt={product.name}
                className="max-h-64 rounded-lg object-contain"
              />
            </div>
          )}
          
          <div className="space-y-4">
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium w-[40%]">Name</TableCell>
                  <TableCell>{product.name}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Code</TableCell>
                  <TableCell>{product.code}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Category</TableCell>
                  <TableCell>{product.categories?.name || product.category_name || product.category_id}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Brand</TableCell>
                  <TableCell>{product.brands?.name || product.brand_name || product.brand_id}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Price</TableCell>
                  <TableCell>${Number(product.price)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          
          <div className="space-y-4">
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium w-[40%]">Cost</TableCell>
                  <TableCell>${Number(product.cost)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Stock</TableCell>
                  <TableCell>{Number(product.stock)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Unit</TableCell>
                  <TableCell>{product.unit_name || product.unit_id}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Status</TableCell>
                  <TableCell className="capitalize">{product.status}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
        
          {product.description && (
            <div className="mt-4 md:col-span-2">
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-sm text-gray-600">{product.description}</p>
            </div>
          )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t bg-white">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}