"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"

interface User {
  userId: string
  username: string
  tokenCreatedAt: string | null
  tokenLastUsedAt: string | null
  hasOnboarded: boolean
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  logout: () => void
  regenerateToken: () => Promise<string>
  completeOnboarding: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const validateToken = useCallback(async (storedToken: string) => {
    try {
      const res = await fetch("/api/auth/validate", {
        headers: { Authorization: `Bearer ${storedToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setUser({
          userId: data.userId,
          username: data.username,
          tokenCreatedAt: data.tokenCreatedAt,
          tokenLastUsedAt: data.tokenLastUsedAt,
          hasOnboarded: data.hasOnboarded,
        })
        setToken(storedToken)
      } else {
        localStorage.removeItem("echo_token")
      }
    } catch {
      localStorage.removeItem("echo_token")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const storedToken = localStorage.getItem("echo_token")
    if (storedToken) {
      validateToken(storedToken)
    } else {
      setIsLoading(false)
    }
  }, [validateToken])

  const login = async (username: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)

    localStorage.setItem("echo_token", data.token)
    setToken(data.token)
    setUser({
      userId: data.userId,
      username,
      tokenCreatedAt: new Date().toISOString(),
      tokenLastUsedAt: null,
      hasOnboarded: data.hasOnboarded,
    })
  }

  const register = async (username: string, password: string) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)

    localStorage.setItem("echo_token", data.token)
    setToken(data.token)
    setUser({
      userId: data.userId,
      username,
      tokenCreatedAt: new Date().toISOString(),
      tokenLastUsedAt: null,
      hasOnboarded: data.hasOnboarded || false,
    })
  }

  const logout = () => {
    localStorage.removeItem("echo_token")
    setToken(null)
    setUser(null)
  }

  const regenerateToken = async () => {
    if (!token) throw new Error("Not authenticated")

    const res = await fetch("/api/auth/regenerate-token", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)

    localStorage.setItem("echo_token", data.token)
    setToken(data.token)
    return data.token
  }

  const completeOnboarding = async () => {
    if (!token) throw new Error("Not authenticated")

    const res = await fetch("/api/auth/complete-onboarding", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    })
    
    if (!res.ok) {
       const data = await res.json()
       throw new Error(data.error)
    }

    if (user) {
      setUser({ ...user, hasOnboarded: true })
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, register, logout, regenerateToken, completeOnboarding }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
