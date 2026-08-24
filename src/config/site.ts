export const creatorLinks = [
  { label: 'GITHUB', href: import.meta.env.VITE_GITHUB_URL },
  { label: 'LINKEDIN', href: import.meta.env.VITE_LINKEDIN_URL },
  { label: 'PORTFOLIO', href: import.meta.env.VITE_PORTFOLIO_URL },
].filter((link): link is { label: string; href: string } => Boolean(link.href));
