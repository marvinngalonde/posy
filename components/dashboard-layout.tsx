"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  BarChart3,
  Package,
  Settings,
  FileText,
  ShoppingCart,
  Users,
  ArrowLeftRight,
  DollarSign,
  RotateCcw,
  Menu,
  Bell,
  Maximize2, Minimize2,
  ChevronRight,
  ChevronDown,
} from "lucide-react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useAppDispatch } from "@/lib/hooks"
import { logout } from "@/lib/slices/authSlice"
import AuthGuard from "./AuthGuard"
import { useGetSystemSettingsQuery } from "@/lib/slices/settingsApi"

type IconType =| typeof BarChart3 | typeof Package | typeof Settings | typeof FileText | typeof ShoppingCart | typeof Users | typeof ArrowLeftRight | typeof DollarSign | typeof RotateCcw | typeof Menu | typeof Bell | typeof Maximize2 | typeof Minimize2 | typeof ChevronRight | typeof ChevronDown;  
type UserRole = 'admin' | 'user';

const menuItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: BarChart3,
    href: "/dashboard",
    roles: ['admin', 'user']
  },
  {
    id: "products",
    label: "Products",
    icon: Package,
    roles: ['admin'],
    submenu: [
      { label: "Create Product", href: "/products/create" },
      { label: "Product List", href: "/products/list" },
      
    ],
  },
  {
    id: "adjustment",
    label: "Adjustment",
    icon: Settings,
    roles: ['admin'],
    submenu: [
      { label: "Create Adjustment", href: "/adjustment/create" },
      { label: "Adjustment List", href: "/adjustment/list" },
    ],
  },
  {
    id: "quotations",
    label: "Quotations",
    icon: FileText,
    roles: ['admin'],
    submenu: [
      { label: "Create Quotation", href: "/quotations/create" },
      { label: "Quotation List", href: "/quotations/list" },
    ],
  },
  {
    id: "purchases",
    label: "Purchases",
    icon: ShoppingCart,
    roles: ['admin'],
    submenu: [
      { label: "Create Purchase", href: "/purchases/create" },
      { label: "Purchase List", href: "/purchases/list" },
    ],
  },
  {
    id: "sales",
    label: "Sales",
    icon: DollarSign,
    roles: ['admin', 'user'],
    submenu: [
      { label: "Create Sale", href: "/sales/create", roles: ['admin'] },
      { label: "Sale List", href: "/sales/list" },
    ],
  },
  {
    id: "invoices",
    label: "Invoices",
    icon: FileText,
    roles: ['admin'], // Assuming only admin can manage invoices initially
    submenu: [
      { label: "Create Invoice", href: "/invoice/create" },
      { label: "Invoice List", href: "/invoice/list" },
    ],
  },
  {
    id: "pos",
    label: "POS",
    icon: ShoppingCart,
    href: "/pos",
    roles: ['admin', 'user']
  },
  {
    id: "expenses",
    label: "Expenses",
    icon: DollarSign,
    roles: ['admin'],
    submenu: [
      { label: "Create Expense", href: "/expenses/create" },
      { label: "Expense List", href: "/expenses/list" },
      { label: "Expense Category", href: "/expenses/category" },
    ],
  },
  {
    id: "sales-return",
    label: "Sales Return",
    icon: RotateCcw,
    roles: ['admin'],
    submenu: [
      { label: "Create Sales Return", href: "/sales-return/create" },
      { label: "Sales Return List", href: "/sales-return/list" },
    ],
  },
  {
    id: "purchases-return",
    label: "Purchases Return",
    icon: RotateCcw,
    roles: ['admin'],
    submenu: [
      { label: "Create Purchase Return", href: "/purchases-return/create" },
      { label: "Purchase Return List", href: "/purchases-return/list" },
    ],
  },
  {
    id: "people",
    label: "People",
    icon: Users,
    roles: ['admin', 'user'],
    submenu: [
      { label: "Customer List", href: "/people/customers" },
      { label: "Supplier List", href: "/people/suppliers", roles: ['admin'] },
    ],
  },
  {
    id: "hrm",
    label: "HRM",
    icon: Users,
    roles: ['admin', 'user'],
    submenu: [
      { label: "Attendance", href: "/hrm/attendance" },
      { label: "Company", href: "/hrm/company" },
      { label: "Departments", href: "/hrm/departments" },
      { label: "Employees", href: "/hrm/employees" },
      { label: "Holidays", href: "/hrm/holidays" },
      { label: "Leave Requests", href: "/hrm/leave-request" },
      { label: "Leave Types", href: "/hrm/leave-type" },
      { label: "Shifts", href: "/hrm/shifts" },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    roles: ['admin'],
    submenu: [
      { label: "Warehouse", href: "/settings/warehouses" },
      { label: "Category", href: "/settings/categories" },
      { label: "Brand", href: "/settings/brands" },
      { label: "Currency", href: "/settings/currencies" },
      { label: "Unit", href: "/settings/units" },
      { label: "Backup", href: "/settings/backup" },
      { label: "Systems", href: "/settings/systems" },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    icon: BarChart3,
    roles: ['admin'],
    submenu: [
      {
        label: "Payments",
        href: "#",
        submenu: [
          { label: "Sales", href: "/reports/payments/sales" },
          { label: "Purchases", href: "/reports/payments/purchases" },
          { label: "Sales Returns", href: "/reports/payments/sales-returns" },
          { label: "Purchase Returns", href: "/reports/payments/purchase-returns" },
        ],
      },
      { label: "Profit and Loss", href: "/reports/profit-loss" },
      { label: "Product Quantity Alerts", href: "/reports/quantity-alerts" },
      { label: "Warehouse Report", href: "/reports/warehouse" },
      {
        label: "Sale Report",
        href: "/reports/sales",
        submenu: [
          { label: "Sales", href: "/reports/sales" },
          { label: "Sales Returns", href: "/reports/sales-returns" },
        ],
      },
      {
        label: "Purchase Report",
        href: "/reports/purchases",
        submenu: [
          { label: "Purchases", href: "/reports/purchases" },
          { label: "Purchase Returns", href: "/reports/purchase-returns" },
        ],
      },
      { label: "Customer Report", href: "/reports/customers" },
      { label: "Supplier Report", href: "/reports/suppliers" },
      { label: "Top Selling Products", href: "/reports/top-selling" },
      { label: "Best Customers", href: "/reports/best-customers" },
    ],
  },
  {
    id: "transfer",
    label: "Transfer",
    icon: ArrowLeftRight,
    roles: ['admin', 'user'],
    submenu: [
      { label: "Create Transfer", href: "/transfer/create" },
      { label: "Transfer List", href: "/transfer/list" },
    ],
  },
]

interface SubMenuItem {
  label: string;
  href?: string; 
  roles?: string[];
  submenu?: SubMenuItem[];
}


interface DashboardLayoutProps {
  children: React.ReactNode
}



export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: systemSettings } = useGetSystemSettingsQuery();

  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [profileOpen, setProfileOpen] = useState(false)
  const router = useRouter()
  const dispatch = useAppDispatch()
  const pathname = usePathname()
   const [isFullScreen, setIsFullScreen] = useState(false);

  // Get user role (replace with your actual auth logic)
  const userRole = typeof window !== 'undefined' ? localStorage.getItem('UserRole') || 'user' : 'user'

  const handleLogout = () => {
    dispatch(logout())
    router.push("/")
  }

    const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };

  const isActive = (href?: string) => {
    if (!href) return false
    return pathname === href || pathname.startsWith(href + "/")
  }

  const toggleItem = (itemId: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }))
  }

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(item => {
    if (!item.roles) return true
    return item.roles.includes(userRole as UserRole)
  })

  // Filter submenu items based on role
const filterSubmenu = (submenu: SubMenuItem[] = []): SubMenuItem[] => {
  return submenu.filter(subItem => {
    if (!subItem.roles) return true;
    return subItem.roles.includes(userRole as UserRole);
  });
};

  return (
    <AuthGuard>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? "w-64" : "w-16"} bg-white border-r transition-all duration-300 flex flex-col h-full`}>
          {/* Sidebar Header */}
          <div
            className=" p-4  flex items-center gap-3"
            style={{
              fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
              fontSize: "14px",
              background: "#fff",
              boxShadow: "none"
            }}
          >
            <Link href="/dashboard">
              <div className="w-10 h-10  rounded-lg flex items-center justify-center cursor-pointer">
                <img src={systemSettings?.system_logo || "/PosyLogo.png"} alt="POSy Logo" width={64} height={64} className="w-full h-full object-contain" />
              </div>
            </Link>
            {sidebarOpen && (
              <span className="font-semibold text-xl text-[#1a237e]" style={{ letterSpacing: "0.02em" }}>
                {systemSettings?.system_title || "POSy"}
              </span>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4 overflow-y-auto">
            {filteredMenuItems.map((item) => {
              const submenuActive = item.submenu?.some(sub => isActive(sub.href))
              const active = isActive(item.href) || submenuActive
              const isExpanded = expandedItems[item.id]

              return (
                <div key={item.id} className="relative">
                  <div
                    className={`flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 cursor-pointer
                      ${active ? "bg-purple-50 border-r-2 border-purple-600 font-semibold text-purple-900" : ""}`}
                    onClick={() => item.submenu && toggleItem(item.id)}
                  >
                    <item.icon className="h-5 w-5" />
                    {sidebarOpen && (
                      <>
                        {item.href ? (
                          <Link href={item.href} className="flex-1" onClick={(e) => e.stopPropagation()}>
                            {item.label}
                          </Link>
                        ) : (
                          <span className="flex-1">{item.label}</span>
                        )}
                        {item.submenu && (
                          isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                        )}
                      </>
                    )}
                  </div>

                  {/* Submenu - shown below parent when expanded */}
                  {item.submenu && isExpanded && sidebarOpen && (
                    <div className="bg-gray-50">
                      {filterSubmenu(item.submenu).map((subItem, index) => {
                        const subActive = isActive(subItem.href)
                        const hasSubSubmenu = subItem.submenu
                        const isSubExpanded = expandedItems[`${item.id}-${subItem.label}`]

                        return (
                          <div key={index}>
                            <div
                              className={`flex items-center gap-3 px-8 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer
                                ${subActive ? "bg-purple-100 text-purple-900 font-semibold" : ""}`}
                              onClick={(e) => {
                                if (hasSubSubmenu) {
                                  e.stopPropagation()
                                  setExpandedItems(prev => ({
                                    ...prev,
                                    [`${item.id}-${subItem.label}`]: !prev[`${item.id}-${subItem.label}`]
                                  }))
                                }
                              }}
                            >
                              {subItem.href ? (
                                <Link 
                                  href={subItem.href} 
                                  className="flex-1" 
                                  onClick={(e) => !hasSubSubmenu && e.stopPropagation()}
                                >
                                  {subItem.label}
                                </Link>
                              ) : (
                                <span className="flex-1">{subItem.label}</span>
                              )}
                              {hasSubSubmenu && (
                                isSubExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />
                              )}
                            </div>

                            {/* Third level submenu */}
                            {hasSubSubmenu && isSubExpanded && (
                              <div className="bg-gray-100">
                                {filterSubmenu(subItem.submenu || []).map((subSubItem, subIndex) => {
                                  const subSubActive = isActive(subSubItem.href)
                                  return (
                                    <Link href={subSubItem.href || '#'} key={subIndex}>
                                      <div
                                        className={`flex items-center gap-3 px-12 py-1 text-xs text-gray-700 hover:bg-gray-200 cursor-pointer
                                          ${subSubActive ? "bg-purple-100 text-purple-900 font-semibold" : ""}`}
                                      >
                                        {subSubItem.label}
                                      </div>
                                    </Link>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header - Exactly as in your original design */}
          <header className="bg-white border-b px-6 py-3 flex items-center justify-between shadow-none" style={{ fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif", fontSize: "14px" }}>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="rounded bg-transparent hover:bg-blue-50 text-blue-900" style={{ fontSize: "13px" }} onClick={() => setSidebarOpen(!sidebarOpen)}>
                <Menu className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/pos">
                <Button className="bg-[#1a237e] hover:bg-[#23308c] text-white rounded shadow-none" style={{ fontSize: "13px" }}>
                  POS
                </Button>
              </Link>
             <button
              onClick={toggleFullScreen}
              type="button"
              aria-label={isFullScreen ? "Exit full screen" : "Enter full screen"}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isFullScreen ? (
                <Minimize2 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Maximize2 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              )}
            </button>

           
              <Button variant="ghost" size="sm" className="relative rounded bg-transparent hover:bg-blue-50 text-blue-900" style={{ fontSize: "13px" }}>
                <Bell className="h-10 w-10"  />
                <span className="absolute -top-1 -right-1 bg-[#1a237e] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  1
                </span>
              </Button>
              
              {/* Profile Dropdown */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 rounded bg-transparent hover:bg-blue-50"
                  style={{ fontSize: "13px" }}
                  onClick={() => setProfileOpen((open) => !open)}
                >
                  <div className="w-8 h-8 bg-[#1a237e] rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">U</span>
                  </div>
                </Button>
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                    <div className="px-4 py-3">
                      <div className="font-semibold text-gray-800">{typeof window !== "undefined" ? localStorage.getItem("username") || "Username" : "Username"}</div>
                      <div className="text-sm text-gray-500">{typeof window !== "undefined" ? localStorage.getItem("email") || "user@email.com" : "user@email.com"}</div>
                    </div>
                    <Link href="/profile">
                      <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 border-b">
                        Profile
                      </button>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 border-t"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-auto pt-4">{children}</main>

          {/* Footer */}
          <footer className="bg-gray-100 px-6 py-3 border-t">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-6 h-6  rounded flex items-center justify-center">
               <img src={systemSettings?.system_logo || "/PosyLogo.png"} alt="POSy Logo" width={64} height={64} className="w-full h-full object-cover" />
              </div>
              <span>© 2025 Developed by Verdsoft </span>
              <span className="ml-auto">All rights reserved</span>
            </div>
          </footer>
        </div>
      </div>
    </AuthGuard>
  )
}
