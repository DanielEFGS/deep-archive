export const creatorLinks = [
  { label: 'GITHUB', href: import.meta.env.VITE_GITHUB_URL || 'https://github.com/DanielEFGS' },
  {
    label: 'LINKEDIN',
    href: import.meta.env.VITE_LINKEDIN_URL || 'https://www.linkedin.com/in/daniel-garcia-silva-695086213/',
  },
].filter((link): link is { label: string; href: string } => Boolean(link.href));
