"use client"

import { AuthProvider, useAuth } from "@/lib/auth-context"
import { AuthForm } from "@/components/auth/auth-form"
import { DashboardContent } from "@/components/dashboard/dashboard-content"
import ChatWidget from "@/components/AI/ChatWidget"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

function AppContent() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && !user.hasOnboarded) {
      router.push("/onboarding")
    }
  }, [user, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return <AuthForm />
  }

  if (!user.hasOnboarded) {
    return null // Return null while redirecting
  }

  return (
    <>
      <DashboardContent />
      <ChatWidget />
    </>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
