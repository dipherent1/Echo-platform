"use client"

import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Activity, Settings, LogOut, User, Copy, RefreshCw, Database } from "lucide-react"
import { useState } from "react"
import { useSWRConfig } from "swr"

export function DashboardHeader() {
  const { user, token, logout, regenerateToken } = useAuth()
  const { mutate } = useSWRConfig()
  const [copied, setCopied] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [seeding, setSeeding] = useState(false)

  const seedData = async () => {
    if (!token) return
    setSeeding(true)
    try {
      const res = await fetch("/api/seed", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (res.ok) {
        // Refresh all stats data
        mutate(() => true)
      } else {
        console.error("Seed failed")
      }
    } catch (error) {
      console.error("Seed error:", error)
    } finally {
      setSeeding(false)
    }
  }

  const copyToken = async () => {
    if (token) {
      await navigator.clipboard.writeText(token)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleRegenerate = async () => {
    setRegenerating(true)
    try {
      const newToken = await regenerateToken()
      await navigator.clipboard.writeText(newToken)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to regenerate token:", error)
    } finally {
      setRegenerating(false)
    }
  }

  return (
    <header className="border-b border-border bg-card">
      <div className="flex h-14 items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <Activity className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold text-foreground">Echo</span>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{user?.username}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium text-foreground">{user?.username}</p>
                <p className="text-xs text-muted-foreground">API Token</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={copyToken}>
                <Copy className="mr-2 h-4 w-4" />
                {copied ? "Copied!" : "Copy Token"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleRegenerate} disabled={regenerating}>
                <RefreshCw className={`mr-2 h-4 w-4 ${regenerating ? "animate-spin" : ""}`} />
                Regenerate Token
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={seedData} disabled={seeding}>
                <Database className={`mr-2 h-4 w-4 ${seeding ? "animate-pulse" : ""}`} />
                {seeding ? "Seeding..." : "Seed Mock Data"}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={logout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
