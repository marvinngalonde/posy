import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { API_URL } from "../api-url"

interface User {
  id: string
  email: string
  name: string
  role: string
  avatar?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

interface LoginRequest {
  email: string
  password: string
}

interface SignupRequest {
  name: string
  email: string
  password: string
}

interface AuthResponse {
  user: User
  token: string
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
}

// RTK Query API
 const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as { auth: AuthState }).auth.token
      if (token) {
        headers.set("authorization", `Bearer ${token}`)
      }
      return headers
    },
  }),
  tagTypes: ["User"],
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: "/users/login",
        method: "POST",
        body: credentials,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(setCredentials(data))
          
          // Store in localStorage
          if (typeof window !== "undefined") {
            localStorage.setItem("token", data.token)
            localStorage.setItem("username", data.user.name)
            localStorage.setItem("email", data.user.email)
            localStorage.setItem("UserRole", data.user.role)
            localStorage.setItem("UserId", data.user.id)
          }
        } catch (error) {
          // Error handling is done by RTK Query automatically
        }
      },
    }),
    signup: builder.mutation<{ message: string }, SignupRequest>({
      query: (userData) => ({
        url: "/users",
        method: "POST",
        body: userData,
      }),
    }),
    getProfile: builder.query<User, void>({
      query: () => "/users/profile",
      providesTags: ["User"],
    }),
    refreshToken: builder.mutation<AuthResponse, void>({
      query: () => ({
        url: "/users/refresh",
        method: "POST",
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(setCredentials(data))
          
          // Update localStorage
          if (typeof window !== "undefined") {
            localStorage.setItem("token", data.token)
          }
        } catch (error) {
          dispatch(logout())
        }
      },
    }),
  }),
})

// Auth slice for managing auth state
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<AuthResponse>) => {
      state.user = action.payload.user
      state.token = action.payload.token
      state.isAuthenticated = true
    },
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      
      // Clear localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("token")
        localStorage.removeItem("username")
        localStorage.removeItem("email")
        localStorage.removeItem("UserRole")
        localStorage.removeItem("UserId")
      }
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload
      state.isAuthenticated = true
    },
    loadFromStorage: (state) => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("token")
        const username = localStorage.getItem("username")
        const email = localStorage.getItem("email")
        const role = localStorage.getItem("UserRole")
        const id = localStorage.getItem("UserId")
        
        if (token && username && email && role && id) {
          state.token = token
          state.user = { id, name: username, email, role }
          state.isAuthenticated = true
        }
      }
    },
  },
})

// Export hooks and actions
export const {
  useLoginMutation,
  useSignupMutation,
  useGetProfileQuery,
  useRefreshTokenMutation,
} = authApi

export const { setCredentials, logout, setUser, loadFromStorage } = authSlice.actions
export default authSlice.reducer

// Export the API reducer for store configuration
export { authApi }