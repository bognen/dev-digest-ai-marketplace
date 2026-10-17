// Lucide icons at stroke-width 1.5, as the design system asks. Decorative:
// every icon sits next to text or inside a labelled control.
import type { ReactNode } from 'react';

function Icon({ size = 16, width = 1.5, className, children }: { size?: number; width?: number; className?: string; children: ReactNode }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

type P = { size?: number; className?: string };

export const SearchIcon = (p: P) => <Icon {...p}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></Icon>;
export const CloseIcon = (p: P) => <Icon {...p}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></Icon>;
export const MenuIcon = (p: P) => <Icon {...p}><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="18" y2="18" /></Icon>;
export const ArrowRightIcon = (p: P) => <Icon {...p}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></Icon>;
export const CheckIcon = (p: P) => <Icon {...p} width={2}><path d="M20 6 9 17l-5-5" /></Icon>;
export const ChevronDownIcon = (p: P) => <Icon {...p}><path d="m6 9 6 6 6-6" /></Icon>;
export const InfoIcon = (p: P) => <Icon {...p}><circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" /></Icon>;
export const StarIcon = (p: P) => <Icon {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></Icon>;
export const CopyIcon = (p: P) => <Icon {...p}><rect width="14" height="14" x="8" y="8" rx="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></Icon>;
export const MonitorIcon = (p: P) => <Icon {...p}><rect width="20" height="14" x="2" y="3" rx="2" /><line x1="8" x2="16" y1="21" y2="21" /><line x1="12" x2="12" y1="17" y2="21" /></Icon>;
export const SunIcon = (p: P) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
  </Icon>
);
export const GridIcon = (p: P) => <Icon {...p}><rect width="7" height="7" x="3" y="3" /><rect width="7" height="7" x="14" y="3" /><rect width="7" height="7" x="14" y="14" /><rect width="7" height="7" x="3" y="14" /></Icon>;
export const ListIcon = (p: P) => <Icon {...p}><line x1="8" x2="21" y1="6" y2="6" /><line x1="8" x2="21" y1="12" y2="12" /><line x1="8" x2="21" y1="18" y2="18" /><line x1="3" x2="3.01" y1="6" y2="6" /><line x1="3" x2="3.01" y1="12" y2="12" /><line x1="3" x2="3.01" y1="18" y2="18" /></Icon>;
export const FilterIcon = (p: P) => <Icon {...p}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></Icon>;
export const MoonIcon = (p: P) => <Icon {...p}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></Icon>;

/** The design system's "+" registration marks; the parent needs class "blueprint". */
export function Corners() {
  return (
    <>
      <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
    </>
  );
}
