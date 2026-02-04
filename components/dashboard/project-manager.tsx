"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import useSWR, { mutate } from "swr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, FolderOpen, Globe, Link, Loader2, ChevronDown, ChevronUp, X } from "lucide-react"

interface ProjectRule {
  type: "domain" | "url_contains" | "manual_url"
  value: string
}

interface Project {
  id: string
  name: string
  color: string
  rules: ProjectRule[]
  createdAt: string
  updatedAt: string
}

const COLORS = [
  "#4ade80",
  "#818cf8",
  "#f59e0b",
  "#ec4899",
  "#38bdf8",
  "#a78bfa",
  "#fb923c",
  "#22d3d8",
  "#f472b6",
  "#84cc16",
]

function getRuleIcon(type: string) {
  switch (type) {
    case "domain":
      return <Globe className="h-4 w-4" />
    case "url_contains":
      return <Link className="h-4 w-4" />
    case "manual_url":
      return <Globe className="h-4 w-4" />
    default:
      return null
  }
}

function getRuleLabel(type: string) {
  switch (type) {
    case "domain":
      return "Domain:"
    case "url_contains":
      return "URL contains:"
    case "manual_url":
      return "URL:"
    default:
      return ""
  }
}

export function ProjectManager() {
  const { token } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [expandedProject, setExpandedProject] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [color, setColor] = useState(COLORS[0])
  const [rules, setRules] = useState<ProjectRule[]>([])
  const [newRuleType, setNewRuleType] = useState<"domain" | "url_contains" | "manual_url">("domain")
  const [newRuleValue, setNewRuleValue] = useState("")
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [addingUrl, setAddingUrl] = useState<string | null>(null)
  const [newUrl, setNewUrl] = useState("")

  const fetcher = async (url: string) => {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error("Failed to fetch")
    return res.json()
  }

  const { data, isLoading } = useSWR<{ projects: Project[] }>(
    token ? "/api/projects" : null,
    fetcher
  )

  const addRule = () => {
    if (newRuleValue.trim()) {
      setRules([...rules, { type: newRuleType, value: newRuleValue.trim() }])
      setNewRuleValue("")
    }
  }

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index))
  }

  const createProject = async () => {
    if (!name.trim()) return

    setLoading(true)
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, color, rules }),
      })

      if (res.ok) {
        mutate("/api/projects")
        setIsOpen(false)
        setName("")
        setColor(COLORS[0])
        setRules([])
      }
    } finally {
      setLoading(false)
    }
  }

  const deleteProject = async (id: string) => {
    setDeleting(id)
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        mutate("/api/projects")
        setExpandedProject(null)
      }
    } finally {
      setDeleting(null)
    }
  }

  const addUrlToProject = async (projectId: string) => {
    if (!newUrl.trim()) return

    setAddingUrl(projectId)
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          addRule: { type: "manual_url", value: newUrl.trim() },
        }),
      })

      if (res.ok) {
        mutate("/api/projects")
        setNewUrl("")
      }
    } finally {
      setAddingUrl(null)
    }
  }

  const removeUrlFromProject = async (projectId: string, ruleIndex: number) => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ removeRuleIndex: ruleIndex }),
      })

      if (res.ok) {
        mutate("/api/projects")
      }
    } catch (error) {
      console.error("Failed to remove URL:", error)
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-foreground">Projects</CardTitle>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Create Project</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Create a project to automatically categorize your browsing activity.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-foreground">Project Name</Label>
                <Input
                  placeholder="e.g., Work, Side Project, Learning"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-secondary border-border text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Color</Label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`h-8 w-8 rounded-md transition-all ${
                        color === c ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : ""
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Matching Rules</Label>
                <p className="text-xs text-muted-foreground">
                  URLs matching these rules will be assigned to this project. You can also add URLs manually later.
                </p>

                {rules.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {rules.map((rule, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 rounded-md bg-secondary"
                      >
                        {getRuleIcon(rule.type)}
                        <span className="text-xs text-muted-foreground">
                          {getRuleLabel(rule.type)}
                        </span>
                        <span className="text-sm text-foreground flex-1 truncate">{rule.value}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRule(index)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 mt-2">
                  <Select
                    value={newRuleType}
                    onValueChange={(v) => setNewRuleType(v as "domain" | "url_contains" | "manual_url")}
                  >
                    <SelectTrigger className="w-40 bg-secondary border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="domain">Domain</SelectItem>
                      <SelectItem value="url_contains">URL Contains</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder={newRuleType === "domain" ? "github.com" : "/my-project/"}
                    value={newRuleValue}
                    onChange={(e) => setNewRuleValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addRule()}
                    className="flex-1 bg-secondary border-border text-foreground"
                  />
                  <Button variant="secondary" onClick={addRule}>
                    Add
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createProject} disabled={loading || !name.trim()}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Project"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : data?.projects && data.projects.length > 0 ? (
          <div className="space-y-2">
            {data.projects.map((project) => (
              <div
                key={project.id}
                className="rounded-lg bg-secondary/50 overflow-hidden"
              >
                <div className="flex items-center gap-3 p-3 hover:bg-secondary transition-colors cursor-pointer"
                  onClick={() => setExpandedProject(expandedProject === project.id ? null : project.id)}>
                  <div
                    className="h-4 w-4 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: project.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{project.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {project.rules.length} rule{project.rules.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteProject(project.id)
                    }}
                    disabled={deleting === project.id}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    {deleting === project.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                  {expandedProject === project.id ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>

                {expandedProject === project.id && (
                  <div className="border-t border-border bg-background/50 p-3 space-y-3">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Rules</p>
                      {project.rules.length > 0 ? (
                        <div className="space-y-1">
                          {project.rules.map((rule, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 p-2 rounded-md bg-secondary/50 text-xs"
                            >
                              {getRuleIcon(rule.type)}
                              <span className="text-muted-foreground">{getRuleLabel(rule.type)}</span>
                              <span className="text-foreground flex-1 truncate">{rule.value}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeUrlFromProject(project.id, index)}
                                className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">No rules added yet</p>
                      )}
                    </div>

                    <div className="space-y-2 pt-2 border-t border-border">
                      <p className="text-xs font-medium text-muted-foreground">Add URL</p>
                      <div className="flex gap-2">
                        <Input
                          placeholder="https://example.com"
                          value={newUrl}
                          onChange={(e) => setNewUrl(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && addUrlToProject(project.id)}
                          className="bg-secondary border-border text-foreground text-xs"
                        />
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => addUrlToProject(project.id)}
                          disabled={addingUrl === project.id || !newUrl.trim()}
                        >
                          {addingUrl === project.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Plus className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FolderOpen className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No projects yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Create a project to categorize your activity
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
