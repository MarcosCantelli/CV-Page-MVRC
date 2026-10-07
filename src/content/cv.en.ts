import type { CV } from './types';
import { certUrls, courseUrls, links, tags } from './shared';

// Source: docs/cv/Marcos_Cantelli_CV_EN.docx. Do not add anything that is not in the CV.
export const cv: CV = {
  name: 'Marcos Vinícius Rodrigues Cantelli',
  headline: 'BI Analyst | Data, CI/CD & Cloud (Azure)',
  tags,
  about:
    'Computer Engineering graduate (FIAP) with over 4 years in the Retail Department at Bradesco: I started as an intern, was hired as an IT Support Analyst and now work as a BI Analyst on the Information Systems and Management Reporting team. I analyze data in SQL Server and Databricks and I am responsible for version control and deployment of the applications built by the area. I focus on infrastructure and automation in Linux environments, with projects in Jenkins, VMware vSphere, Terraform and Vagrant, and I am learning OLVM. Microsoft AZ-900 certified, preparing for the AZ-104. I am looking to move into DevOps, combining my experience with data and with delivering to production.',
  education: [{ degree: 'B.Sc. in Computer Engineering', school: 'FIAP' }],
  experience: [
    {
      company: 'Bradesco',
      unit: 'Retail Department',
      logo: 'bradesco',
      period: 'Feb 2022 – Present',
      roles: [
        {
          title: 'BI Analyst I',
          detail: 'Information Systems and Management Reporting',
          period: 'Jun 2026 – Present',
          items: [
            'Serve internal clients such as directors, managers and the branch network with management reports and applications built by the area.',
            'Data cleaning and analysis in SQL Server and Databricks.',
            'Responsible for version control with Git and GitHub and for deploying the area’s applications, running the release process through the existing CI/CD pipelines in GitHub Actions.',
            'Monitoring of the applications in the production environment to ensure high availability.',
          ],
        },
        {
          title: 'IT Support Analyst Jr.',
          detail: 'hired full-time after the internship',
          period: 'Jan 2024 – May 2026',
          items: [
            'Operated remote broadcasts and meetings for directors and managers (Webex, Teams, Stream, Zoom).',
            'Provided infrastructure support to departments, boards and regional management, and helped procure IT resources.',
            'Handled pre-audit and controls governance processes; supported projects for the Retail, Prime and Express segments.',
            'Invited by my manager to join the Information Systems and Management Reporting team, moving into data analysis and BI.',
          ],
        },
        {
          title: 'IT Intern',
          period: 'Feb 2022 – Dec 2023',
          items: [
            'Supported remote broadcasts, segment projects and the infrastructure of departments and boards; assisted with pre-audit governance.',
          ],
        },
      ],
    },
    {
      company: 'Rádio Jovem Pan',
      logo: 'jovem-pan',
      period: 'Dec 2020 – Jan 2022',
      roles: [
        {
          title: 'Support Analyst Intern',
          period: 'Dec 2020 – Jan 2022',
          items: [
            'Internal customer support, system access management, and preventive and corrective maintenance of IT infrastructure.',
          ],
        },
      ],
    },
  ],
  certifications: [
    {
      name: 'Microsoft Azure Fundamentals (AZ-900)',
      issuer: 'Microsoft',
      badge: 'az-900',
      status: 'earned',
      url: certUrls.az900,
    },
    {
      name: 'Cisco CCNA – Introduction to Networks',
      issuer: 'Cisco Networking Academy',
      badge: 'ccna-itn',
      status: 'earned',
      url: certUrls.ccna,
    },
    {
      name: 'Microsoft Azure Administrator (AZ-104)',
      issuer: 'Microsoft',
      badge: 'az-104',
      status: 'in-progress',
    },
  ],
  skills: [
    {
      title: 'Data',
      items: [
        { label: 'SQL Server', icon: 'sqlserver' },
        { label: 'Databricks', icon: 'databricks' },
        { label: 'Data cleaning and analysis' },
        { label: 'Management reporting' },
      ],
    },
    {
      title: 'CI/CD & version control',
      items: [
        { label: 'Jenkins', icon: 'jenkins' },
        { label: 'GitHub Actions', icon: 'githubactions' },
        { label: 'Git', icon: 'git' },
        { label: 'GitHub', icon: 'github' },
      ],
    },
    {
      title: 'Cloud & IaC',
      items: [
        { label: 'Azure', icon: 'azure' },
        { label: 'Terraform', icon: 'terraform' },
        { label: 'Vagrant', icon: 'vagrant' },
        { label: 'Ansible', icon: 'ansible' },
      ],
    },
    {
      title: 'Virtualization',
      items: [
        { label: 'VMware ESXi', icon: 'vmware' },
        { label: 'vCenter', icon: 'vmware' },
        { label: 'vSphere', icon: 'vmware' },
        { label: 'OLVM (learning)' },
      ],
    },
    {
      title: 'Linux & scripting',
      items: [
        { label: 'Linux', icon: 'linux' },
        { label: 'Bash', icon: 'bash' },
        { label: 'Python', icon: 'python' },
        { label: 'C/C++', icon: 'cplusplus' },
      ],
    },
    {
      title: 'Networking',
      items: [{ label: 'Fundamentals (Cisco CCNA – Introduction to Networks)', icon: 'cisco' }],
    },
    {
      title: 'Languages',
      items: [{ label: 'Portuguese (native)' }, { label: 'English (intermediate, improving)' }],
    },
  ],
  projects: [
    {
      title: 'Database pipeline',
      description:
        'Being published on GitHub, in the process of being adapted for MySQL, PostgreSQL, SQL Server and Oracle.',
      tags: ['mysql', 'postgresql', 'sqlserver', 'database'],
      url: links.github,
      todo: 'TODO: specific repository link',
    },
    {
      title: 'HomeLab',
      description: 'Virtualization server with a local AI model (Python).',
      tags: ['python', 'server'],
      url: links.github,
      todo: 'TODO: specific repository link',
    },
    {
      title: 'Terraform + vCenter',
      description: 'VM provisioning from a template using infrastructure as code.',
      tags: ['terraform', 'vmware'],
      url: links.github,
      todo: 'TODO: specific repository link',
    },
    {
      title: 'Vagrant + vSphere',
      description: 'Reproducible VM creation on a vSphere server.',
      tags: ['vagrant', 'vmware'],
      url: links.github,
      todo: 'TODO: specific repository link',
    },
  ],
  projectsNote: { text: 'Repositories at github.com/MarcosCantelli', url: links.github },
  academicProjects: [
    {
      year: '2020',
      title: 'Bosch Brazil',
      note: '3rd place, IoT Supply Chain',
      description: 'Inventory automation with RFID, Firebase and Raspberry Pi.',
    },
    {
      year: '2021',
      title: 'Shopping do Cidadão',
      description: 'Document request website with an IBM Watson chatbot.',
    },
    {
      year: '2022',
      title: 'Ford Motor',
      description: 'Smart in-car multimedia integrated with Google Assistant.',
    },
    {
      year: '2023',
      title: 'Toledo do Brasil',
      description: 'Truck weighing fraud reduction using computer vision (Python and OpenCV).',
    },
    {
      year: '2024',
      title: 'Capstone project (TCC)',
      description:
        'Platform that orchestrates legacy scripts and runs them automatically, with no third-party dependency.',
    },
  ],
  courses: [
    {
      name: 'Ansible for SysAdmins',
      provider: 'Udemy',
      url: courseUrls.ansible,
      link: 'certificate',
      icon: 'udemy',
    },
    {
      name: 'Technology courses',
      provider: 'Alura',
      url: courseUrls.alura,
      link: 'profile',
      icon: 'book',
    },
  ],
  links,
};
