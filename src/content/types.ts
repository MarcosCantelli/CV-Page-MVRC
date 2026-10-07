export type Locale = 'pt' | 'en';

/** Key of an icon in src/icons/index.ts. */
export type IconKey = string;

export interface Role {
  title: string;
  /** Subtitle shown after the title (team, note). */
  detail?: string;
  period: string;
  items: string[];
}

export interface Experience {
  company: string;
  /** Department / unit, shown next to the company name. */
  unit?: string;
  /** Base file name of the logo in src/assets/logos/ (without extension). */
  logo: string;
  period: string;
  roles: Role[];
}

export interface Certification {
  name: string;
  /** Short label used in the hero summary (e.g. AZ-900). */
  short: string;
  issuer: string;
  /** Base file name of the badge in src/assets/badges/ (without extension). */
  badge: string;
  status: 'earned' | 'in-progress';
  url?: string;
}

export interface SkillGroup {
  title: string;
  items: { label: string; icon?: IconKey }[];
}

export interface Project {
  title: string;
  description: string;
  tags: IconKey[];
  url?: string;
  /** TODO marker for content still missing from the CV. */
  todo?: string;
}

export interface AcademicProject {
  year: string;
  title: string;
  /** Highlight such as an award. */
  note?: string;
  description: string;
}

export interface Course {
  name: string;
  provider: string;
  url: string;
  /** Whether the link points to a certificate or to a profile page. */
  link: 'certificate' | 'profile';
  icon: IconKey;
}

export interface CV {
  name: string;
  headline: string;
  tags: { label: string; icon?: IconKey }[];
  about: string;
  education: { degree: string; school: string }[];
  experience: Experience[];
  certifications: Certification[];
  skills: SkillGroup[];
  projects: Project[];
  projectsNote: { text: string; url: string };
  academicProjects: AcademicProject[];
  courses: Course[];
  links: { github: string; linkedin: string };
}
