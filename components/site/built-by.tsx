// "Built by Aathil" footer credit — portfolio link + social icons. Used in the
// site footers (home, status). External links open in a new tab and use
// rel="noopener noreferrer" so the target page can't touch window.opener.

type Social = { label: string; href: string; path: string; size?: number };

const SOCIALS: Social[] = [
  {
    label: "GitHub",
    href: "https://github.com/AathilFelix/",
    path: "M12 .5C5.37.5 0 5.78 0 12.292c0 5.211 3.438 9.63 8.205 11.188.6.111.82-.254.82-.567 0-.28-.01-1.022-.015-2.005-3.338.711-4.042-1.582-4.042-1.582-.546-1.361-1.335-1.725-1.335-1.725-1.087-.731.084-.716.084-.716 1.205.082 1.838 1.215 1.838 1.215 1.07 1.803 2.809 1.282 3.495.981.108-.763.417-1.282.76-1.577-2.665-.295-5.466-1.309-5.466-5.827 0-1.287.465-2.339 1.235-3.164-.135-.298-.54-1.497.105-3.121 0 0 1.005-.316 3.3 1.209.96-.262 1.98-.392 3-.397 1.02.005 2.04.135 3 .397 2.28-1.525 3.285-1.209 3.285-1.209.645 1.624.24 2.823.12 3.121.765.825 1.23 1.877 1.23 3.164 0 4.53-2.805 5.527-5.475 5.817.42.354.81 1.077.81 2.182 0 1.578-.015 2.846-.015 3.229 0 .309.21.678.825.561C20.565 21.917 24 17.495 24 12.292 24 5.78 18.627.5 12 .5z",
  },
  {
    label: "X",
    href: "https://x.com/AathilOfficial",
    path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
    size: 14,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/aathilfelix/",
    path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  },
];

export function BuiltBy() {
  return (
    <div className="flex items-center gap-2.5">
      <p className="body-xs text-text-tertiary">
        Built by{" "}
        <a
          href="https://aathil.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-text-secondary underline-offset-2 transition-colors hover:text-text-primary hover:underline"
        >
          Aathil
        </a>
      </p>
      <span aria-hidden="true" className="text-text-quaternary">
        ·
      </span>
      <div className="flex items-center gap-0.5">
        {SOCIALS.map((s) => (
          <a
            key={s.label}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Aathil on ${s.label}`}
            className="grid place-items-center rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-surface-elevated hover:text-text-primary"
          >
            <svg viewBox="0 0 24 24" width={s.size ?? 15} height={s.size ?? 15} fill="currentColor" aria-hidden="true">
              <path d={s.path} />
            </svg>
          </a>
        ))}
      </div>
    </div>
  );
}
