"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
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
  AlertTriangle,
  Check,
} from "lucide-react";

export function TokenView() {
  const { regenerateToken } = useAuth();
  const [showToken, setShowToken] = useState(false);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);

  const copyToken = async () => {
    // Only allow copying the new token if it exists.
    // The session token (from useAuth) should NOT be copied/displayed as it's not the API token.
    if (newToken) {
      await navigator.clipboard.writeText(newToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const freshToken = await regenerateToken();
      setNewToken(freshToken);
      setShowToken(true);
    } catch (error) {
      console.error("Failed to regenerate token:", error);
    } finally {
      setRegenerating(false);
    }
  };

  // Only display the token if it's a newly generated API token.
  // Otherwise show a placeholder or nothing, as we don't have access to the raw API token anymore.
  const displayToken = newToken ? newToken : "••••••••••••••••••••••••••••••••";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">API Token</h2>
        <p className="text-muted-foreground">
          Use this token in your Chrome extension to track your activity.
        </p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Key className="h-5 w-5" />
            Your Bearer Token
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            This token authenticates your extension with the API. Keep it
            secure.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type={showToken && newToken ? "text" : "password"}
                value={displayToken}
                readOnly
                className="pr-10 font-mono text-sm bg-secondary border-border text-foreground"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                disabled={!newToken}
              >
                {showToken ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <Button
              variant="secondary"
              onClick={copyToken}
              className="gap-2"
              disabled={!newToken}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
          </div>

          {!newToken && (
            <div className="p-3 rounded-lg bg-secondary border border-border">
              <p className="text-sm text-foreground">
                Your API token is hidden for security. Regenerate to view a new
                one.
              </p>
            </div>
          )}

          {newToken && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                New token generated! Copy it now. It will not be shown again.
              </p>
            </div>
          )}

          <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Regenerating will invalidate your previous token
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Your Chrome extension will stop working until you update it with
                the new token.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={handleRegenerate}
            disabled={regenerating}
            className="gap-2 bg-transparent"
          >
            {regenerating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Regenerate Token
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Extension Setup</CardTitle>
          <CardDescription className="text-muted-foreground">
            How to configure your Chrome extension
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="list-decimal list-inside space-y-2 text-sm text-foreground">
            <li>Install the Echo Chrome extension</li>
            <li>Click the extension icon and go to Settings</li>
            <li>Paste your API token in the token field</li>
            <li>
              The extension will automatically track your browsing activity
            </li>
          </ol>

          <div className="p-3 rounded-lg bg-secondary">
            <p className="text-xs text-muted-foreground mb-2">API Endpoint:</p>
            <code className="text-sm text-foreground font-mono">
              POST {typeof window !== "undefined" ? window.location.origin : ""}
              /api/log
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
