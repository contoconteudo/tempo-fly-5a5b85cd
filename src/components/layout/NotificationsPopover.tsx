import { Bell, AlertTriangle, Info, CheckCircle, XCircle, Users, Target, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, AppNotification } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

const typeIcons = {
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle,
  error: XCircle,
};

const typeColors = {
  warning: "text-warning bg-warning/10",
  info: "text-primary bg-primary/10",
  success: "text-success bg-success/10",
  error: "text-destructive bg-destructive/10",
};

const categoryIcons = {
  leads: Users,
  clients: Handshake,
  objectives: Target,
  goals: Target,
};

export function NotificationsPopover() {
  const { notifications, unreadCount } = useNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h4 className="font-semibold text-foreground">Notificações</h4>
          <span className="text-xs text-muted-foreground">
            {unreadCount} alerta{unreadCount !== 1 ? "s" : ""}
          </span>
        </div>
        
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle className="h-10 w-10 text-success mb-2" />
              <p className="text-sm font-medium text-foreground">Tudo em dia!</p>
              <p className="text-xs text-muted-foreground">
                Nenhum alerta no momento
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} />
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

function NotificationItem({ notification }: { notification: AppNotification }) {
  const TypeIcon = typeIcons[notification.type];
  const CategoryIcon = categoryIcons[notification.category];

  return (
    <div className="flex gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
      <div className={cn("flex h-8 w-8 items-center justify-center rounded-full shrink-0", typeColors[notification.type])}>
        <TypeIcon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-medium text-foreground truncate">
            {notification.title}
          </p>
          <CategoryIcon className="h-3 w-3 text-muted-foreground shrink-0" />
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {notification.message}
        </p>
      </div>
    </div>
  );
}
