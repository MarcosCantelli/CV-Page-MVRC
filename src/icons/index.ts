// Brand icons come from simple-icons and are inlined at build time (no CDN).
// Brands missing from simple-icons (SQL Server, Azure, LinkedIn) use generic glyphs.
import {
  siAnsible,
  siCisco,
  siCplusplus,
  siDatabricks,
  siGit,
  siGithub,
  siGithubactions,
  siGnubash,
  siJenkins,
  siLinux,
  siMysql,
  siPostgresql,
  siPython,
  siTerraform,
  siUdemy,
  siVagrant,
  siVmware,
} from 'simple-icons';

export interface Icon {
  title: string;
  /** SVG path data for a 24x24 viewBox. */
  path: string;
  /** Stroke-based icons (generic glyphs) are drawn with stroke instead of fill. */
  stroke?: boolean;
}

const brand = (i: { title: string; path: string }): Icon => ({ title: i.title, path: i.path });

const generic = {
  database: {
    title: 'Database',
    stroke: true,
    path: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3Zm0 0v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
  },
  cloud: {
    title: 'Cloud',
    stroke: true,
    path: 'M7 18a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 8.5a4.75 4.75 0 0 1-.25 9.5Z',
  },
  server: {
    title: 'Server',
    stroke: true,
    path: 'M4 4h16v6H4zM4 14h16v6H4zM8 7h.01M8 17h.01',
  },
  linkedin: {
    title: 'LinkedIn',
    stroke: true,
    path: 'M4 4h16v16H4zM8 10v6M8 7.5v.01M12 16v-6m0 2.5c0-1.4 1-2.5 2.25-2.5S16.5 11.1 16.5 12.5V16',
  },
  // UI icons
  sun: {
    title: 'Sun',
    stroke: true,
    path: 'M12 4V2m0 20v-2m8-8h2M2 12h2m13.66-5.66 1.41-1.41M4.93 19.07l1.41-1.41m0-11.32L4.93 4.93m14.14 14.14-1.41-1.41M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  },
  moon: {
    title: 'Moon',
    stroke: true,
    path: 'M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z',
  },
  menu: { title: 'Menu', stroke: true, path: 'M4 6h16M4 12h16M4 18h16' },
  close: { title: 'Close', stroke: true, path: 'M6 6l12 12M18 6 6 18' },
  download: { title: 'Download', stroke: true, path: 'M12 4v11m0 0-4-4m4 4 4-4M5 20h14' },
  mail: { title: 'Mail', stroke: true, path: 'M3 6h18v12H3zM3 7l9 6 9-6' },
  external: {
    title: 'External link',
    stroke: true,
    path: 'M14 4h6v6m0-6-9 9M18 14v6H4V6h6',
  },
  award: {
    title: 'Award',
    stroke: true,
    path: 'M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12Zm-3.5-1.1L7 22l5-3 5 3-1.5-8.1',
  },
  hourglass: {
    title: 'In progress',
    stroke: true,
    path: 'M6 3h12M6 21h12M7 3c0 5 10 5 10 9s-10 4-10 9M17 3c0 5-10 5-10 9',
  },
  book: {
    title: 'Course',
    stroke: true,
    path: 'M4 5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2V5Zm0 16a2 2 0 0 1 2-2h14',
  },
  school: {
    title: 'Education',
    stroke: true,
    path: 'M2 9l10-5 10 5-10 5-10-5Zm4 2v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5M22 9v6',
  },
  globe: {
    title: 'Language',
    stroke: true,
    path: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-9-9h18M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9s1-6.5 3.5-9Z',
  },
} satisfies Record<string, Icon>;

export const icons: Record<string, Icon> = {
  ...generic,
  sqlserver: { ...generic.database, title: 'SQL Server' },
  azure: { ...generic.cloud, title: 'Microsoft Azure' },
  ansible: brand(siAnsible),
  cisco: brand(siCisco),
  cplusplus: brand(siCplusplus),
  databricks: brand(siDatabricks),
  git: brand(siGit),
  github: brand(siGithub),
  githubactions: brand(siGithubactions),
  bash: brand(siGnubash),
  jenkins: brand(siJenkins),
  linux: brand(siLinux),
  mysql: brand(siMysql),
  postgresql: brand(siPostgresql),
  python: brand(siPython),
  terraform: brand(siTerraform),
  udemy: brand(siUdemy),
  vagrant: brand(siVagrant),
  vmware: brand(siVmware),
};
