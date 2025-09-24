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
  Home,
  TrendingUp,
  Warehouse,
  CreditCard,
  UserCheck,
  RefreshCw,
  Building,
  Calculator,
  Receipt,
  Truck,
  Briefcase,
  Database,
  Shield,
  LogOut,
  HelpCircle,
  Zap
} from "lucide-react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useAppDispatch } from "@/lib/hooks"
import { logout } from "@/lib/slices/authSlice"
import AuthGuard from "./AuthGuard"
import { useGetSystemSettingsQuery } from "@/lib/slices/settingsApi"
import { NotificationsDropdown } from "@/components/notifications-dropdown"

type IconType =| typeof BarChart3 | typeof Package | typeof Settings | typeof FileText | typeof ShoppingCart | typeof Users | typeof ArrowLeftRight | typeof DollarSign | typeof RotateCcw | typeof Menu | typeof Bell | typeof Maximize2 | typeof Minimize2 | typeof ChevronRight | typeof ChevronDown;  
type UserRole = 'admin' | 'user';

const menuItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: Home,
    href: "/dashboard",
    roles: ['admin', 'user'],
    category: "main"
  },
  {
    id: "pos",
    label: "Point of Sale",
    icon: Zap,
    href: "/pos",
    roles: ['admin', 'user'],
    category: "main",
    badge: "Quick Sale"
  },
  {
    id: "products",
    label: "Products",
    icon: Package,
    roles: ['admin'],
    category: "inventory",
    submenu: [
      { label: "Create Product", href: "/products/create", icon: "plus" },
      { label: "Product List", href: "/products/list", icon: "list" },
    ],
  },
  {
    id: "adjustment",
    label: "Stock Adjustment",
    icon: RefreshCw,
    roles: ['admin'],
    category: "inventory",
    submenu: [
      { label: "Create Adjustment", href: "/adjustment/create" },
      { label: "Adjustment List", href: "/adjustment/list" },
    ],
  },
  {
    id: "sales",
    label: "Sales",
    icon: TrendingUp,
    roles: ['admin', 'user'],
    category: "transactions",
    submenu: [
      { label: "Create Sale", href: "/sales/create", roles: ['admin'] },
      { label: "Sale List", href: "/sales/list" },
    ],
  },
  {
    id: "purchases",
    label: "Purchases",
    icon: Truck,
    roles: ['admin'],
    category: "transactions",
    submenu: [
      { label: "Create Purchase", href: "/purchases/create" },
      { label: "Purchase List", href: "/purchases/list" },
    ],
  },
  {
    id: "quotations",
    label: "Quotations",
    icon: FileText,
    roles: ['admin'],
    category: "documents",
    submenu: [
      { label: "Create Quotation", href: "/quotations/create" },
      { label: "Quotation List", href: "/quotations/list" },
    ],
  },
  {
    id: "invoices",
    label: "Invoices",
    icon: Receipt,
    roles: ['admin'],
    category: "documents",
    submenu: [
      { label: "Create Invoice", href: "/invoice/create" },
      { label: "Invoice List", href: "/invoice/list" },
    ],
  },
  {
    id: "expenses",
    label: "Expenses",
    icon: CreditCard,
    roles: ['admin'],
    category: "financial",
    submenu: [
      { label: "Expense List", href: "/expenses/list" },
      { label: "Expense Category", href: "/expenses/category" },
    ],
  },
  {
    id: "sales-return",
    label: "Sales Return",
    icon: RotateCcw,
    roles: ['admin'],
    category: "transactions",
    submenu: [
      { label: "Create Sales Return", href: "/sales-return/create" },
      { label: "Sales Return List", href: "/sales-return/list" },
    ],
  },
  {
    id: "purchases-return",
    label: "Purchase Return",
    icon: RotateCcw,
    roles: ['admin'],
    category: "transactions",
    submenu: [
      { label: "Create Purchase Return", href: "/purchases-return/create" },
      { label: "Purchase Return List", href: "/purchases-return/list" },
    ],
  },
  {
    id: "transfer",
    label: "Stock Transfer",
    icon: ArrowLeftRight,
    roles: ['admin', 'user'],
    category: "inventory",
    submenu: [
      { label: "Create Transfer", href: "/transfer/create" },
      { label: "Transfer List", href: "/transfer/list" },
    ],
  },
  {
    id: "people",
    label: "Contacts",
    icon: Users,
    roles: ['admin', 'user'],
    category: "management",
    submenu: [
      { label: "Customers", href: "/people/customers" },
      { label: "Suppliers", href: "/people/suppliers", roles: ['admin'] },
    ],
  },
  {
    id: "hrm",
    label: "Human Resources",
    icon: UserCheck,
    roles: ['admin', 'user'],
    category: "management",
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
    id: "reports",
    label: "Reports & Analytics",
    icon: BarChart3,
    roles: ['admin'],
    category: "analytics",
    submenu: [
      { label: "Sales Report", href: "/reports/sales" },
      { label: "Purchase Report", href: "/reports/purchases" },
      { label: "Profit & Loss", href: "/reports/profit-loss" },
      { label: "Inventory Alerts", href: "/reports/quantity-alerts" },
      { label: "Customer Report", href: "/reports/customers" },
      { label: "Supplier Report", href: "/reports/suppliers" },
      { label: "Top Products", href: "/reports/top-selling" },
      { label: "Best Customers", href: "/reports/best-customers" },
    ],
  },
  {
    id: "settings",
    label: "System Settings",
    icon: Settings,
    roles: ['admin'],
    category: "admin",
    submenu: [
      { label: "Warehouses", href: "/settings/warehouses" },
      { label: "Categories", href: "/settings/categories" },
      { label: "Brands", href: "/settings/brands" },
      { label: "Currency", href: "/settings/currencies" },
      { label: "Units", href: "/settings/units" },
      { label: "Backup", href: "/settings/backup" },
      { label: "System Config", href: "/settings/systems" },
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

// Simple Menu Item Component
const MenuItemComponent = ({
  item,
  isExpanded,
  onToggle,
  sidebarOpen,
  isActive,
  filterSubmenu
}: {
  item: any
  isExpanded: boolean
  onToggle: () => void
  sidebarOpen: boolean
  isActive: (href?: string) => boolean
  filterSubmenu: (submenu: any[]) => any[]
}) => {
  const submenuActive = item.submenu?.some((sub: any) => isActive(sub.href))
  const active = isActive(item.href) || submenuActive

  return (
    <div className="relative">
      {/* Main Item */}
      <div
        className={`group relative flex items-center ${sidebarOpen ? 'gap-3 px-3' : 'justify-center px-2'} py-2 rounded-md cursor-pointer transition-colors ${
          active
            ? "bg-blue-50 text-[#1a237e] border-l-4 border-[#1a237e]"
            : "text-gray-700 hover:bg-gray-50"
        }`}
        onClick={() => item.submenu && onToggle()}
      >
        <div className="flex-shrink-0">
          <item.icon className={`h-5 w-5 ${active ? 'text-[#1a237e]' : 'text-gray-500'}`} />
        </div>

        {sidebarOpen && (
          <>
            {item.href ? (
              <Link
                href={item.href}
                className="flex-1 font-medium text-sm truncate"
                onClick={(e) => e.stopPropagation()}
              >
                {item.label}
              </Link>
            ) : (
              <span className="flex-1 font-medium text-sm truncate">{item.label}</span>
            )}

            {item.badge && (
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-[#1a237e] rounded">
                {item.badge}
              </span>
            )}

            {item.submenu && (
              <ChevronRight
                className={`h-4 w-4 transition-transform flex-shrink-0 ${
                  isExpanded ? 'rotate-90' : ''
                } ${active ? 'text-[#1a237e]' : 'text-gray-400'}`}
              />
            )}
          </>
        )}

        {/* Tooltip for collapsed sidebar */}
        {!sidebarOpen && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            {item.label}
          </div>
        )}
      </div>

      {/* Submenu */}
      {item.submenu && isExpanded && sidebarOpen && (
        <div className="mt-1 ml-6 space-y-1">
          {filterSubmenu(item.submenu).map((subItem: any, index: number) => {
            const subActive = isActive(subItem.href)
            return (
              <Link
                key={index}
                href={subItem.href || "#"}
                className={`flex items-center gap-3 px-3 py-1.5 rounded text-sm transition-colors ${
                  subActive
                    ? "bg-blue-50 text-[#1a237e] font-medium"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <div className="w-1 h-1 rounded-full bg-current opacity-60"></div>
                <span className="truncate">{subItem.label}</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
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
    // Filter by role
    if (!item.roles) return true
    const hasRoleAccess = item.roles.includes(userRole as UserRole)
    return hasRoleAccess
  })

  // Group menu items by category for better organization
  const groupedMenuItems = filteredMenuItems.reduce((acc, item) => {
    const category = item.category || 'other'
    if (!acc[category]) acc[category] = []
    acc[category].push(item)
    return acc
  }, {} as Record<string, typeof menuItems>)

  const categoryOrder = ['main', 'transactions', 'inventory', 'documents', 'financial', 'management', 'analytics', 'admin']
  const categoryLabels = {
    main: 'Main',
    transactions: 'Transactions',
    inventory: 'Inventory',
    documents: 'Documents',
    financial: 'Financial',
    management: 'Management',
    analytics: 'Analytics',
    admin: 'Administration'
  }

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
        {/* Simple Clean Sidebar */}
        <div className={`${sidebarOpen ? "w-72" : "w-16"} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col h-full overflow-hidden`}>

          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200">
            <Link href="/dashboard" className="flex items-center gap-3 w-full">
              <div className={`${sidebarOpen ? "w-10 h-10" : "w-8 h-8"} bg-[#1a237e] rounded-lg flex items-center justify-center transition-all duration-300`}>
                <img
                  src={systemSettings?.system_logo || "/PosyLogo.png"}
                  alt="POSy Logo"
                  className="w-6 h-6 object-contain filter brightness-0 invert"
                />
              </div>
              {sidebarOpen && (
                <div className="flex flex-col">
                  <span className="font-semibold text-lg text-gray-900">
                    {systemSettings?.system_title || "POSy"}
                  </span>
                  <span className="text-gray-500 text-sm">Business Suite</span>
                </div>
              )}
            </Link>
          </div>


          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto">
            <div className={`${sidebarOpen ? 'px-4' : 'px-2'} py-2`}>
              {/* Categorized Navigation */}
              <div className="space-y-6">
                {categoryOrder.map(category => {
                  const items = groupedMenuItems[category]
                  if (!items || items.length === 0) return null

                  return (
                    <div key={category} className={`${sidebarOpen ? 'space-y-1' : 'space-y-2'}`}>
                      {sidebarOpen && (
                        <div className="px-1 mb-3">
                          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            {categoryLabels[category] || category}
                          </h3>
                        </div>
                      )}
                      {items.map((item) => (
                        <MenuItemComponent
                          key={item.id}
                          item={item}
                          isExpanded={expandedItems[item.id]}
                          onToggle={() => toggleItem(item.id)}
                          sidebarOpen={sidebarOpen}
                          isActive={isActive}
                          filterSubmenu={filterSubmenu}
                        />
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
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


              <NotificationsDropdown />
              
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
