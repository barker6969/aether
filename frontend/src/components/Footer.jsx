import React from "react";
import { Link } from "react-router-dom";

export const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer
      data-testid="app-footer"
      className="h-9 flex-shrink-0 bg-black border-t border-white/10 flex items-center justify-between px-4 font-mono text-[10px] tracking-[0.18em] uppercase text-white/40"
    >
      <div className="flex items-center gap-4">
        <span>© {year} Aether Labs</span>
        <span className="text-white/20">·</span>
        <span className="hidden md:inline">For licensed technicians</span>
      </div>
      <nav className="flex items-center gap-4">
        <Link data-testid="footer-docs" to="/docs" className="hover:text-[#00FF41] transition-colors">
          Docs
        </Link>
        <span className="text-white/20">·</span>
        <Link data-testid="footer-terms" to="/terms" className="hover:text-[#00FF41] transition-colors">
          Terms of Service
        </Link>
        <span className="text-white/20">·</span>
        <Link data-testid="footer-privacy" to="/privacy" className="hover:text-[#00FF41] transition-colors">
          Privacy Policy
        </Link>
      </nav>
    </footer>
  );
};
