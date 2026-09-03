import { safeExternalUrl } from "../utils/security";

export const creatorPortfolioUrl =
  safeExternalUrl(import.meta.env.VITE_PORTFOLIO_URL || "https://daniel-gs.dev/") ??
  "https://daniel-gs.dev/";

export const creatorLinks = [
  {
    label: "PORTFOLIO",
    href: creatorPortfolioUrl,
  },
  {
    label: "GITHUB",
    href: import.meta.env.VITE_GITHUB_URL || "https://github.com/DanielEFGS",
  },
  {
    label: "LINKEDIN",
    href:
      import.meta.env.VITE_LINKEDIN_URL ||
      "https://www.linkedin.com/in/daniel-garcia-silva-695086213/",
  },
]
  .map((link) => ({ ...link, href: safeExternalUrl(link.href) }))
  .filter((link): link is { label: string; href: string } =>
    Boolean(link.href),
  );
