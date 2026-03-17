
import Link from "next/link";
import { cn } from "@/lib/utils";

const Logo = ({ variant = "default", size = "md", showTagline = false, hideText = false, useImage = false }) => {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-4xl",
  };

  const colorClass = variant === "white" ? "text-white" : "text-primary";

  if (useImage) {
    return (
      <Link href="/" className="flex items-center gap-2 group transition-all duration-300" target="_blank" rel="noopener noreferrer">
        <div className={cn(
          "relative flex items-center justify-center transition-all duration-300",
          hideText ? "w-10 h-10" : "w-auto h-8"
        )}>
          {hideText ? (
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center p-1.5 shadow-sm group-hover:scale-110 group-hover:bg-white/10 transition-all duration-300 ring-1 ring-white/5 ring-offset-0 group-hover:ring-primary/20">
              <img
                src="/favicon.ico"
                alt="F"
                className="w-7 h-7 object-contain"
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 group-hover:translate-x-1 transition-transform duration-300">
              <div className="relative w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center p-1.5 shadow-sm">
                <img
                  src="/favicon.ico"
                  alt="F"
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex flex-col">
                <span className={cn("font-heading font-extrabold tracking-tighter text-xs leading-none flex items-center", colorClass)}>
                  <span className="opacity-100">Work</span>
                  <span className="opacity-60 font-medium">space</span>
                </span>
                {/* <span className="text-[7px] uppercase tracking-[0.3em] font-bold opacity-30 -mt-0.5 whitespace-nowrap">Control Center</span> */}
              </div>
            </div>
          )}
        </div>
      </Link>
    );
  }

  return (
    <Link href="/" className="flex items-center gap-2 group" target="_blank" rel="noopener noreferrer">
      <div className={cn(
        "w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-300",
        size === "lg" && "w-10 h-10 text-2xl"
      )}>
        F
      </div>
      {!hideText && (
        <div className="flex flex-col">
          <span className={cn("font-heading font-bold tracking-tight leading-none", sizeClasses[size], colorClass)}>
            Fakhri
          </span>
          {showTagline && (
            <span className="text-[10px] text-muted-foreground/60 font-medium tracking-wide">
              IT Services
            </span>
          )}
        </div>
      )}
    </Link>
  );
};

export default Logo;
