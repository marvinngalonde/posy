import { Loader2 } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"

export default function Loading() {
  return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading invoice creation...</p>
        </div>
      </div>
    </DashboardLayout>
  )
}
