import React, { useState, useEffect } from "react";
import { Download, X, Monitor, Apple, Cpu } from "lucide-react";
import { DESKTOP_VERSION as VERSION, DESKTOP_RELEASES_BASE as RELEASES_BASE } from "../lib/releases";

const STORAGE_KEY = "aether.hero.getDesktop.dismissed";

// One-time dismissible conversion card. Shown on the Dashboard until the
// user either clicks Download or explicitly dismisses it; afterwards
// localStorage remembers the decision and the card stays hidden.
export const GetDesktopHeroCard = () => {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch (_) {
      setDismissed(false);
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch (_) { /* localStorage blocked — non-fatal */ }
    setDismissed(true);
  };

  const openWindows = () => {
    window.open(`${RELEASES_BASE}/Aether_${VERSION}_x64_en-US.msi`, "_blank", "noopener");
    dismiss();
  };

  if (dismissed) return null;

  return (
    <div
      data-testid="get-desktop-hero"
      className="relative overflow-hidden bg-gradient-to-br from-[#00FF41]/[0.06] via-transparent to-transparent border border-[#00FF41]/30"
    >
      {/* scan-line grain */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(0,255,65,0.5) 0px, rgba(0,255,65,0.5) 1px, transparent 1px, transparent 3px)",
        }}
      />
      <button
        data-testid="get-desktop-hero-dismiss"
        onClick={dismiss}
        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-white/30 hover:text-white/70 transition-colors z-10"
        title="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Mobile-first: stack vertically on <md, side-by-side on md+ */}
      <div className="relative px-4 py-4 md:px-5 flex flex-col md:flex-row md:items-center gap-4 md:gap-5">
        <div className="flex items-start md:items-center gap-3 md:gap-5 flex-1 min-w-0">
          <div className="hidden sm:flex w-11 h-11 md:w-12 md:h-12 border border-[#00FF41]/40 bg-black flex-shrink-0 items-center justify-center">
            <Cpu className="w-5 h-5 md:w-6 md:h-6 text-[#00FF41]" />
          </div>

          <div className="flex-1 min-w-0 pr-8 md:pr-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
              <span className="font-mono text-[9px] tracking-[0.32em] uppercase text-[#00FF41]/80 whitespace-nowrap">
                Native build · v{VERSION}
              </span>
              <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-white/30 whitespace-nowrap">
                Tauri 2 · WebView2
              </span>
            </div>
            <h3 className="font-mono text-sm tracking-[0.2em] uppercase text-white mb-1">
              Get Aether for Windows
            </h3>
            <p className="font-mono text-[11px] text-white/60 leading-relaxed">
              Skip Demo Mode. The native installer talks to MTK BROM, Qualcomm
              Sahara / Firehose, Apple DFU and Samsung KG directly over USB —
              no browser, no bridge process.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 flex-shrink-0 w-full md:w-auto">
          <button
            data-testid="get-desktop-hero-windows"
            onClick={openWindows}
            className="h-9 px-4 bg-[#00FF41] hover:bg-[#00CC33] text-black font-mono text-[11px] tracking-[0.22em] uppercase font-semibold flex items-center justify-center md:justify-start gap-2 transition-colors w-full md:w-auto"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">Download .msi (Windows)</span>
          </button>
          <div className="flex items-center gap-2 justify-center md:justify-end">
            <a
              data-testid="get-desktop-hero-mac"
              href={`${RELEASES_BASE}/Aether_${VERSION}_universal.dmg`}
              target="_blank"
              rel="noreferrer"
              onClick={dismiss}
              className="font-mono text-[10px] tracking-[0.18em] uppercase text-white/50 hover:text-[#00FF41] flex items-center gap-1 transition-colors"
            >
              <Apple className="w-3 h-3" /> .dmg
            </a>
            <span className="font-mono text-[10px] text-white/20">·</span>
            <a
              data-testid="get-desktop-hero-linux"
              href={`${RELEASES_BASE}/aether-desktop_${VERSION}_amd64.AppImage`}
              target="_blank"
              rel="noreferrer"
              onClick={dismiss}
              className="font-mono text-[10px] tracking-[0.18em] uppercase text-white/50 hover:text-[#00FF41] flex items-center gap-1 transition-colors"
            >
              <Monitor className="w-3 h-3" /> .AppImage
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

