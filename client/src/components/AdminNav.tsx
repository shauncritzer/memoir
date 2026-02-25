import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Brain,
  Zap,
  FileEdit,
  Video,
  Database,
  Settings,
} from "lucide-react";

const adminPages = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/mission-control", label: "Mission Control", icon: Brain },
  { href: "/admin/pipeline", label: "Content Pipeline", icon: Zap },
  { href: "/admin/blog-editor", label: "Blog Editor", icon: FileEdit },
  { href: "/admin/videos", label: "Videos", icon: Video },
  { href: "/admin/seed", label: "Seed DB", icon: Database },
  { href: "/admin/migrate", label: "Migrate", icon: Settings },
];

export default function AdminNav() {
  const [location] = useLocation();

  return (
    <nav className="flex items-center gap-1 flex-wrap mb-6 pb-4 border-b">
      {adminPages.map(({ href, label, icon: Icon }) => {
        const isActive = location === href;
        return (
          <Link key={href} href={href}>
            <Button
              variant={isActive ? "default" : "ghost"}
              size="sm"
              className={isActive ? "" : "text-muted-foreground"}
            >
              <Icon className="h-4 w-4 mr-1.5" />
              {label}
            </Button>
          </Link>
        );
      })}
    </nav>
  );
}
