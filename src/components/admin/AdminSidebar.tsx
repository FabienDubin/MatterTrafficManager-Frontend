import * as React from "react"
import { useLocation, Link } from "react-router-dom"
import {
  Database,
  Activity,
  Users,
  Home,
  ChevronRight,
  LogOut,
  Settings,
  RefreshCw,
  Calendar,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useAuthStore } from "@/store/auth.store"
import { Button } from "@/components/ui/button"

// Navigation data for admin - organized structure
const adminNavigation = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: Home,
  },
  {
    title: "Configuration",
    url: "#",
    icon: Settings,
    items: [
      {
        title: "Connexion Notion",
        url: "/admin/configuration/notion-connection",
      },
      {
        title: "Mapping Bases",
        url: "/admin/configuration/mapping-bases",
      },
      {
        title: "Configuration Calendrier",
        url: "/admin/configuration/calendar",
      },
    ],
  },
  {
    title: "Monitoring",
    url: "#",
    icon: Activity,
    items: [
      {
        title: "Vue Globale",
        url: "/admin/monitoring/global",
      },
      {
        title: "Health & Memory",
        url: "/admin/monitoring/health-memory",
      },
      {
        title: "Cache Analytics",
        url: "/admin/monitoring/cache",
      },
    ],
  },
  {
    title: "Synchronisation",
    url: "#",
    icon: RefreshCw,
    items: [
      {
        title: "Contrôle Sync",
        url: "/admin/synchronisation/sync-control",
      },
      {
        title: "Gestion Conflits",
        url: "/admin/synchronisation/conflicts",
      },
      {
        title: "Logs Webhook",
        url: "/admin/synchronisation/webhook-logs",
      },
    ],
  },
  {
    title: "Utilisateurs",
    url: "/admin/users/list",
    icon: Users,
  },
]

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    await logout()
    // Redirect will be handled by the auth guard
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Database className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">Admin Panel</span>
            <span className="truncate text-xs text-muted-foreground">Matter Traffic</span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Administration</SidebarGroupLabel>
          <SidebarMenu>
            {adminNavigation.map((item) => {
              const isActive = item.items 
                ? item.items.some(subItem => location.pathname === subItem.url)
                : location.pathname === item.url

              if (item.items) {
                return (
                  <Collapsible
                    key={item.title}
                    asChild
                    defaultOpen={isActive}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton 
                          tooltip={item.title}
                          className={isActive ? "bg-sidebar-accent" : ""}
                        >
                          {item.icon && <item.icon className="size-4" />}
                          <span>{item.title}</span>
                          <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 size-4" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton 
                                asChild
                                className={location.pathname === subItem.url ? "bg-sidebar-accent" : ""}
                              >
                                <Link to={subItem.url}>
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                )
              }

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    tooltip={item.title}
                    className={isActive ? "bg-sidebar-accent" : ""}
                  >
                    <Link to={item.url}>
                      {item.icon && <item.icon className="size-4" />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Retour au calendrier">
              <Link to="/calendar" className="gap-2">
                <Calendar className="size-4" />
                <span>Retour au calendrier</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <div className="flex items-center justify-between px-2 py-1.5">
              <div className="flex items-center gap-2">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-muted">
                  <Users className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate text-xs font-medium">{user?.name || 'Admin'}</span>
                  <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleLogout}
                title="Déconnexion"
              >
                <LogOut className="size-4" />
              </Button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  )
}