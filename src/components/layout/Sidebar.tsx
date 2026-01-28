import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Target,
  Users,
  Briefcase,
  Settings,
  ChevronDown,
  Building2,
  Plus,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProject } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Estratégia", href: "/estrategia", icon: Target },
  { name: "CRM", href: "/crm", icon: Users },
  { name: "Clientes", href: "/clientes", icon: Briefcase },
  { name: "Configurações", href: "/configuracoes", icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const { currentProject, projects, userRole, refreshProjects } = useProject();
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{ name: newProjectName, description: newProjectDescription }])
        .select()
        .single();

      if (error) throw error;

      // Add the current user to the project with admin role if they are admin, or with default permissions if not
      if (userRole === 'admin') {
        await supabase
          .from('user_projects')
          .insert([{ user_id: (await supabase.auth.getUser()).data.user?.id, project_id: data.id, permissions: ['read', 'write', 'delete'] }]);
      } else {
        await supabase
          .from('user_projects')
          .insert([{ user_id: (await supabase.auth.getUser()).data.user?.id, project_id: data.id, permissions: ['read'] }]);
      }

      await refreshProjects();
      setShowCreateProject(false);
      setNewProjectName("");
      setNewProjectDescription("");
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border">
      <div className="flex h-full flex-col">
        {/* Logo and Project Dropdown */}
        <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-border">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-auto p-0 justify-start">
                <div className="flex flex-col items-start">
                  <span className="text-lg font-bold text-sidebar-foreground">Conto</span>
                  <span className="ml-1 text-xs text-sidebar-foreground/50">
                    {currentProject?.name || 'Select Project'}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-sidebar-foreground/50 ml-auto" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
              {projects.map((project) => (
                <DropdownMenuItem
                  key={project.id}
                  onClick={() => {
                    // In a real app, you would set the current project in the context
                    // and possibly redirect to the project's dashboard
                    console.log('Switching to project:', project.name);
                  }}
                >
                  <FolderOpen className="mr-2 h-4 w-4" />
                  {project.name}
                </DropdownMenuItem>
              ))}
              {userRole === 'admin' && (
                <>
                  <DropdownMenuItem onClick={() => setShowCreateProject(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Project
                  </DropdownMenuItem>
                  <DropdownMenuItem divider />
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "sidebar-item",
                  isActive && "sidebar-item-active"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-sidebar-border p-3">
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent transition-colors">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-sm font-medium text-sidebar-primary">
              AR
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-sidebar-foreground">Arone</p>
              <p className="text-xs text-sidebar-foreground/50">{userRole === 'admin' ? 'Admin' : 'User'}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-sidebar-foreground/50" />
          </button>
        </div>
      </div>

      {/* Create Project Dialog */}
      <Dialog open={showCreateProject} onOpenChange={setShowCreateProject}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="name" className="text-right">
                Name
              </label>
              <Input
                id="name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="description" className="text-right">
                Description
              </label>
              <Textarea
                id="description"
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowCreateProject(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProject}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}