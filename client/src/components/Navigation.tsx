import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown } from "lucide-react";

type NavItem = {
  label: string;
  href?: string;
  children?: { label: string; href: string; description?: string }[];
};

const navItems: NavItem[] = [
  {
    label: "About",
    children: [
      { label: "Shaun's Story", href: "/about", description: "From trauma to transformation" },
      { label: "The REWIRED Method", href: "/rewired-method", description: "The science behind recovery" },
      { label: "The Memoir", href: "/memoir", description: "Bent, Not Broken" },
    ],
  },
  {
    label: "Programs",
    children: [
      { label: "7-Day Rewired Reset", href: "/7-day-reset", description: "Quick-start your recovery — $47" },
      { label: "30-Day Course", href: "/products", description: "From Broken to Whole — Coming Soon" },
      { label: "Monthly Community", href: "/products", description: "Bent Not Broken Circle — Coming Soon" },
    ],
  },
  {
    label: "Resources",
    children: [
      { label: "Blog", href: "/blog", description: "Articles on recovery & healing" },
      { label: "AI Recovery Coach", href: "/ai-coach", description: "24/7 support powered by AI" },
      { label: "Free Resources", href: "/resources", description: "Guides, worksheets & tools" },
    ],
  },
  {
    label: "Shop",
    href: "/products",
  },
];

function DesktopDropdown({ item }: { item: NavItem }) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  };

  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!item.children) {
    return (
      <Link
        href={item.href || "/"}
        className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors py-2"
      >
        {item.label}
      </Link>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        className="flex items-center gap-1 text-sm font-medium text-foreground/80 hover:text-primary transition-colors py-2"
        onClick={() => setOpen(!open)}
      >
        {item.label}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 pt-2 z-50">
          <div className="bg-white rounded-lg shadow-xl border border-gray-100 py-2 min-w-[280px]">
            {item.children.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                className="block px-5 py-3 hover:bg-gray-50 transition-colors"
                onClick={() => setOpen(false)}
              >
                <span className="block text-sm font-semibold text-gray-900">
                  {child.label}
                </span>
                {child.description && (
                  <span className="block text-xs text-gray-500 mt-0.5">
                    {child.description}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MobileAccordion({ item, onClose }: { item: NavItem; onClose: () => void }) {
  const [expanded, setExpanded] = useState(false);

  if (!item.children) {
    return (
      <Link
        href={item.href || "/"}
        className="block py-3 text-base font-medium text-foreground hover:text-primary transition-colors"
        onClick={onClose}
      >
        {item.label}
      </Link>
    );
  }

  return (
    <div>
      <button
        className="flex items-center justify-between w-full py-3 text-base font-medium text-foreground hover:text-primary transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {item.label}
        <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && (
        <div className="pl-4 pb-2 space-y-1">
          {item.children.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              className="block py-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              onClick={onClose}
            >
              {child.label}
              {child.description && (
                <span className="block text-xs text-gray-400">{child.description}</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 fixed top-0 left-0 right-0 z-50 shadow-lg">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-3">
          <img
            src="/logo-icon.png"
            alt="Shaun Critzer Logo"
            className="h-10 w-auto"
          />
          <span className="text-xl font-bold leading-tight">Shaun Critzer</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-8">
          {navItems.map((item) => (
            <DesktopDropdown key={item.label} item={item} />
          ))}
          <Link href="/products">
            <Button size="sm" className="bg-primary hover:bg-primary/90 px-6">
              Get Started
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden p-2 hover:bg-accent rounded-md transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t bg-background">
          <div className="container py-4 space-y-1">
            {navItems.map((item) => (
              <MobileAccordion
                key={item.label}
                item={item}
                onClose={() => setMobileMenuOpen(false)}
              />
            ))}
            <Link href="/products" onClick={() => setMobileMenuOpen(false)}>
              <Button className="w-full bg-primary hover:bg-primary/90 mt-4">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
