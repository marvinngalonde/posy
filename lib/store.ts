import { configureStore } from "@reduxjs/toolkit"
import authSlice from "./slices/authSlice"
import databaseSlice from "./slices/databaseSlice"
import customersSlice from "./slices/customersSlice"
import suppliersSlice from "./slices/suppliersSlice"
import expensesSlice from "./slices/expensesSlice"
import transfersSlice from "./slices/transfersSlice"
import hrmSlice from "./slices/hrmSlice"
import reportsSlice from "./slices/reportsSlice"
import settingsSlice from "./slices/settingsSlice"

import { productsApi } from "./slices/productsApi"
import { adjustmentsApi } from "./slices/adjustmentsApi"
import { quotationsApi } from "./slices/quotationsApi"
import { purchasesApi } from "./slices/purchasesApi"
import { salesApi } from "./slices/salesApi"
import { customersApi } from "./slices/customersApi"
import { settingsApi } from "./slices/settingsApi"
import { expensesApi } from "./slices/expensesApi"
import { returnsApi } from "./slices/returnsApi"
import { suppliersApi } from "./slices/suppliersApi"
import { reportsApi } from "./slices/reportsApi" 
import { paymentsApi } from "./slices/paymentsApi"
import { hrmApi } from "./slices/hrmApi"
import { transfersApi } from "./slices/transfersApi"
import { hrmCatalogApi } from "./slices/hrmCatalogApi"
import { hrmAttendanceApi } from "./slices/hrmAttendanceApi"
import { invoicesApi } from "./slices/invoicesApi"

export const store = configureStore({
  reducer: {
    auth: authSlice,
    database: databaseSlice,
    customers: customersSlice,
    suppliers: suppliersSlice,
    expenses: expensesSlice,
    transfers: transfersSlice,
    hrm: hrmSlice,
    reports: reportsSlice,
    settings: settingsSlice,
    [productsApi.reducerPath]: productsApi.reducer,
    [adjustmentsApi.reducerPath]: adjustmentsApi.reducer,
    [quotationsApi.reducerPath]: quotationsApi.reducer,
    [purchasesApi.reducerPath]: purchasesApi.reducer,
    [salesApi.reducerPath]: salesApi.reducer,
    [customersApi.reducerPath]: customersApi.reducer,
    [settingsApi.reducerPath]: settingsApi.reducer,
    [expensesApi.reducerPath]: expensesApi.reducer,
    [returnsApi.reducerPath]: returnsApi.reducer,
    [suppliersApi.reducerPath]: suppliersApi.reducer,
    [reportsApi.reducerPath]: reportsApi.reducer, 
    [paymentsApi.reducerPath]: paymentsApi.reducer,
    [hrmApi.reducerPath]: hrmApi.reducer,
    [transfersApi.reducerPath]: transfersApi.reducer,
    [hrmCatalogApi.reducerPath]: hrmCatalogApi.reducer,
    [hrmAttendanceApi.reducerPath]: hrmAttendanceApi.reducer,
    [invoicesApi.reducerPath]: invoicesApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      productsApi.middleware,
      adjustmentsApi.middleware,
      quotationsApi.middleware,
      purchasesApi.middleware,
      salesApi.middleware,
      customersApi.middleware,
      settingsApi.middleware,
      expensesApi.middleware,
      returnsApi.middleware,
      suppliersApi.middleware,
      reportsApi.middleware, // Add the new middleware
      paymentsApi.middleware
      , hrmApi.middleware
      , transfersApi.middleware
      , hrmCatalogApi.middleware
      , hrmAttendanceApi.middleware
      , invoicesApi.middleware
    ),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
