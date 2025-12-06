import { Link } from "wouter";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function Logo({ size = "md", showText = true }: LogoProps) {
  const sizeClasses = {
    sm: "h-8",
    md: "h-10",
    lg: "h-12",
  };

  return (
    <Link href="/" className="flex items-center space-x-3">
      <img 
        src="/logo-icon.png" 
        alt="Shaun Critzer Logo" 
        className={`${sizeClasses[size]} w-auto`}
      />
      {showText && (
        <div className="flex flex-col">
          <span className="text-xl font-bold leading-tight">Shaun Critzer</span>
        </div>
      )}
    </Link>
  );
}
