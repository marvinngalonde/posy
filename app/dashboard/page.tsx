"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAppSelector } from "@/lib/hooks"
import type React from "react"
import AuthGuard from "@/components/AuthGuard"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ShoppingCart,
  Package,
  Users,
  Building2,
  TrendingUp,

  AlertTriangle,
  DollarSign,
  BarChart3,
  Eye,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react"
import {

  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid
} from "recharts"
import {
  useGetDashboardStatsQuery,
  useGetTopProductsQuery,
  useGetLowStockProductsQuery,
  useGetRecentTransactionsQuery,
  useGetSalesChartQuery
} from "@/lib/slices/dashboardApi"

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"]

export default function Dashboard() {
  const router = useRouter()
  const { isAuthenticated } = useAppSelector((state) => state.auth)

  // RTK Query hooks
  const { data: stats, isLoading: statsLoading } = useGetDashboardStatsQuery()
  const { data: topProducts, isLoading: topProductsLoading } = useGetTopProductsQuery({ period: "30", limit: 5 })
  const { data: lowStock, isLoading: lowStockLoading } = useGetLowStockProductsQuery({ limit: 10 })
  const { data: recentTransactions, isLoading: transactionsLoading } = useGetRecentTransactionsQuery({ limit: 10 })
  const { data: salesChart, isLoading: chartLoading } = useGetSalesChartQuery({ days: 7 })

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, router])

  // Stat cards data
  const statCards = [
    {
      title: "Total Sales",
      value: `$${(stats?.total_sales || 0).toLocaleString()}`,
      change: `${stats?.todays_sales || 0} today`,
      trend: "up",
      icon: ShoppingCart,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200"
    },
    {
      title: "Total Purchases",
      value: `$${(stats?.total_purchases || 0).toLocaleString()}`,
      change: `${stats?.todays_purchases || 0} today`,
      trend: "up",
      icon: Package,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200"
    },
    {
      title: "Active Customers",
      value: (stats?.total_customers || 0).toLocaleString(),
      change: "+12% this month",
      trend: "up",
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200"
    },
    {
      title: "Total Products",
      value: (stats?.total_products || 0).toLocaleString(),
      change: `${lowStock?.length || 0} low stock`,
      trend: lowStock?.length ? "down" : "neutral",
      icon: Building2,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200"
    }
  ]

  // Process chart data
  const chartData = salesChart?.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
    sales: item.sales,
    purchases: item.purchases
  })) || []

  // Process pie chart data for top products
  const pieData = topProducts?.map((product, index) => ({
    name: product.name,
    value: product.revenue,
    color: COLORS[index % COLORS.length]
  })) || []

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back! Here&apos;s what&apos;s happening with your business.</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
              <Button size="sm" onClick={() => router.push("/reports/profit-loss")}>
                <Eye className="h-4 w-4 mr-2" />
                View Reports
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat, index) => (
              <Card key={index} className={`${stat.borderColor} border-l-4 hover:shadow-lg transition-all duration-200`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <div className="flex items-center gap-1">
                        {stat.trend === "up" && <ArrowUpRight className="h-4 w-4 text-green-500" />}
                        {stat.trend === "down" && <ArrowDownRight className="h-4 w-4 text-red-500" />}
                        <span className={`text-xs ${
                          stat.trend === "up" ? "text-green-600" :
                          stat.trend === "down" ? "text-red-600" : "text-gray-600"
                        }`}>
                          {stat.change}
                        </span>
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Sales vs Purchases (Last 7 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(value, name) => [`$${Number(value).toLocaleString()}`, name === 'sales' ? 'Sales' : 'Purchases']}
                        labelStyle={{ color: '#374151' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="sales"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="purchases"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Products Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  Top Products (30 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {topProductsLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-gray-500">Loading...</div>
                    </div>
                  ) : pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          innerRadius={40}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Revenue']} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      No product data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tables Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Low Stock Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Low Stock Alerts
                  {lowStock && lowStock.length > 0 && (
                    <Badge variant="destructive">{lowStock.length}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {lowStockLoading ? (
                    <div className="text-center text-gray-500 py-4">Loading...</div>
                  ) : lowStock && lowStock.length > 0 ? (
                    lowStock.slice(0, 8).map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div>
                          <p className="font-medium text-sm text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-600">{product.warehouse_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-red-600">{product.current_stock}</p>
                          <p className="text-xs text-gray-500">Min: {product.min_stock}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-4">No low stock items</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Selling Products */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Top Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {topProductsLoading ? (
                    <div className="text-center text-gray-500 py-4">Loading...</div>
                  ) : topProducts && topProducts.length > 0 ? (
                    topProducts.map((product, index) => (
                      <div key={product.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-green-600">#{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-600">{product.units_sold} units sold</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-green-600">${product.revenue.toLocaleString()}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-4">No sales data</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  Recent Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {transactionsLoading ? (
                    <div className="text-center text-gray-500 py-4">Loading...</div>
                  ) : recentTransactions && recentTransactions.length > 0 ? (
                    recentTransactions.map((transaction) => (
                      <div key={`${transaction.type}-${transaction.id}`} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div>
                          <p className="font-medium text-sm text-gray-900">{transaction.reference}</p>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={transaction.type === 'sale' ? 'default' : transaction.type === 'purchase' ? 'secondary' : 'outline'}
                              className="text-xs"
                            >
                              {transaction.type}
                            </Badge>
                            <p className="text-xs text-gray-600">
                              {new Date(transaction.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">${transaction.amount.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">{transaction.status}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-4">No transactions</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}