"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Bell } from "lucide-react"

export function SimpleNotifications() {
  const [isOpen, setIsOpen] = useState(false)

  console.log('SimpleNotifications rendered, isOpen:', isOpen)

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="relative rounded bg-transparent hover:bg-blue-50 text-blue-900"
        onClick={() => {
          console.log('Simple bell clicked!')
          setIsOpen(!isOpen)
        }}
      >
        <Bell className="h-6 w-6" />
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          3
        </span>
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <div className="mt-2 space-y-2">
              <div className="p-2 bg-red-50 border border-red-200 rounded">
                <p className="text-sm font-medium">Low Stock Alert</p>
                <p className="text-xs text-gray-600">Test Product is running low</p>
              </div>
              <div className="p-2 bg-green-50 border border-green-200 rounded">
                <p className="text-sm font-medium">New Sale</p>
                <p className="text-xs text-gray-600">Sale SAL-001 completed - $150.00</p>
              </div>
              <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm font-medium">System Backup</p>
                <p className="text-xs text-gray-600">Weekly database backup is due</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}