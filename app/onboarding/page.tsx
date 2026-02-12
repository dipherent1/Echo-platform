"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
  Key,
  Check,
  ArrowRight,
  Download,
  Terminal,
  Settings,
  Chrome,
} from "lucide-react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { AuthForm } from "@/components/auth/auth-form";

function OnboardingContent() {
  const { user, regenerateToken, isLoading, completeOnboarding } = useAuth();
  const router = useRouter();
  const [showToken, setShowToken] = useState(false);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);

  // Auto-generate token on first load if not present (simulated by just generating one for the user to see)
  // or wait for them to click. It's better to let them click so they know what follows.

  // If user is not logged in, show auth form or redirect
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  const copyToken = async () => {
    if (newToken) {
      await navigator.clipboard.writeText(newToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGenerate = async () => {
    setRegenerating(true);
    try {
      const freshToken = await regenerateToken();
      setNewToken(freshToken);
      setShowToken(true);
    } catch (error) {
      console.error("Failed to generate token:", error);
    } finally {
      setRegenerating(false);
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await completeOnboarding();
      router.push("/");
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
    } finally {
      setCompleting(false);
    }
  };

  const displayToken = newToken ? newToken : "••••••••••••••••••••••••••••••••";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 md:p-8">
      <div className="max-w-3xl w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Welcome to Echo
          </h1>
          <p className="text-xl text-muted-foreground">
            Let's get your Chrome extension set up to start tracking your
            productivity.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Step 1: Generate Token */}
          <Card className="bg-card border-border h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                  1
                </div>
                Get Your API Token
              </CardTitle>
              <CardDescription>
                You'll need this token to authenticate the extension.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-1">
              {!newToken ? (
                <div className="flex flex-col items-center justify-center h-40 space-y-4 border rounded-md border-dashed bg-secondary/30 p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Generate your unique access token to connect the extension
                    to your account.
                  </p>
                  <Button onClick={handleGenerate} disabled={regenerating}>
                    {regenerating ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Key className="mr-2 h-4 w-4" />
                        Generate Token
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      Token generated successfully!
                    </p>
                  </div>
                  <div className="relative">
                    <Input
                      type={showToken ? "text" : "password"}
                      value={displayToken}
                      readOnly
                      className="pr-20 font-mono text-sm bg-secondary border-border text-foreground"
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setShowToken(!showToken)}
                      >
                        {showToken ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        <span className="sr-only">Toggle visibility</span>
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-7 w-7"
                        onClick={copyToken}
                      >
                        {copied ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        <span className="sr-only">Copy token</span>
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Copy this token now. It won't be shown again for security.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Install Extension */}
          <Card className="bg-card border-border h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                  2
                </div>
                Install Extension
              </CardTitle>
              <CardDescription>
                Follow these steps to add Echo to Chrome.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm flex-1">
              <ol className="space-y-3 list-none">
                <li className="flex gap-3">
                  <Download className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <span>
                    Clone the{" "}
                    <a
                      href="https://github.com/dipherent1/Echo-chrome-extention"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline underline-offset-4"
                    >
                      Echo extension repository
                    </a>
                  </span>
                </li>
                <li className="flex gap-3">
                  <Chrome className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <span>
                    Go to{" "}
                    <code className="bg-muted px-1 py-0.5 rounded">
                      chrome://extensions/
                    </code>
                  </span>
                </li>
                <li className="flex gap-3">
                  <Settings className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <span>
                    Enable <strong>Developer mode</strong> (top right toggle)
                  </span>
                </li>
                <li className="flex gap-3">
                  <Terminal className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <span>
                    Click <strong>Load unpacked</strong> and select the cloned
                    folder
                  </span>
                </li>
              </ol>

              <div className="mt-4 p-3 rounded bg-secondary/50 text-xs">
                <p className="font-medium mb-1">Final Step:</p>
                <p>
                  Click the Echo icon in your browser toolbar and paste the API
                  token you generated in Step 1.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center pt-4">
          <Button
            size="lg"
            className="gap-2"
            onClick={handleComplete}
            disabled={completing}
          >
            {completing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Finishing...
              </>
            ) : (
              <>
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <AuthProvider>
      <OnboardingContent />
    </AuthProvider>
  );
}
