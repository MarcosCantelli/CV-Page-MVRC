import type { CV } from './types';
import { certUrls, courseUrls, links, tags } from './shared';

// Fonte: docs/cv/Marcos_Cantelli_CV_PT.docx. Não adicionar nada que não esteja no currículo.
// Exceção pedida pelo Marcos: em "Linux e scripts", C/C++ foi trocado por Node.js e Java.
export const cv: CV = {
  name: 'Marcos Vinícius Rodrigues Cantelli',
  headline: 'Analista de BI | Dados, CI/CD e Cloud (Azure)',
  tags,
  about:
    'Engenheiro da Computação formado pela FIAP, mais de 4 anos no Departamento de Varejo do Bradesco, iniciando como estagiário e sendo efetivado como Analista de Suporte de TI. Na atualidade, já conquistando mais reconhecimento e promoção, atuo como Analista de BI na equipe de Sistemas de Informação e Relatórios Gerenciais. Dentro das atividades, tenho em destaque, análise de dados em SQL Server e Databricks sendo responsável pelo versionamento e publicação das aplicações da área dentro das regras de compliance. Tenho foco em infraestrutura e automação em ambientes Linux, com projetos em Jenkins, VMware vSphere, Terraform e Vagrant, e estou ganhando competências em OLVM. Sou Certificado Microsoft AZ-900, em preparação para o AZ-104. Busco fazer a transição para DevOps, aliando minha experiência com dados e com entregas em produção.',
  education: [{ degree: 'Engenharia da Computação', school: 'FIAP' }],
  experience: [
    {
      company: 'Bradesco',
      unit: 'Departamento de Varejo',
      logo: 'bradesco',
      period: 'fev/2022 – atual',
      roles: [
        {
          title: 'Analista de BI I',
          detail: 'Sistemas de Informação e Relatórios Gerenciais',
          period: 'jun/2026 – atual',
          items: [
            'Atendimento a clientes internos, como diretores, gerentes e a rede de agências, com relatórios gerenciais e aplicações desenvolvidas pela área.',
            'Tratamento e análise de dados em SQL Server e Databricks.',
            'Responsável pelo versionamento com Git e GitHub e pela publicação das aplicações da área, executando o processo de deploy pelas esteiras de CI/CD no GitHub Actions.',
            'Acompanhamento das aplicações em ambiente de produção para garantir alta disponibilidade.',
          ],
        },
        {
          title: 'Analista de Suporte de TI Jr.',
          detail: 'efetivado após o estágio',
          period: 'jan/2024 – mai/2026',
          items: [
            'Operação de transmissões e reuniões remotas para diretorias e gerências (Webex, Teams, Stream, Zoom).',
            'Suporte de infraestrutura a departamentos, diretorias e gerências regionais e apoio à aquisição de recursos de TI.',
            'Governança de processos de pré-auditoria e controles; atendimento a projetos dos segmentos Varejo, Prime e Expresso.',
            'Convidado pelo gestor a integrar a equipe de Sistemas de Informação e Relatórios Gerenciais, passando a atuar com análise de dados e BI.',
          ],
        },
        {
          title: 'Estagiário de TI',
          period: 'fev/2022 – dez/2023',
          items: [
            'Suporte a transmissões remotas, a projetos dos segmentos e à infraestrutura de departamentos e diretorias; apoio à governança de pré-auditoria.',
          ],
        },
      ],
    },
    {
      company: 'Rádio Jovem Pan',
      logo: 'jovem-pan',
      period: 'dez/2020 – jan/2022',
      roles: [
        {
          title: 'Estagiário, Analista de Suporte',
          period: 'dez/2020 – jan/2022',
          items: [
            'Suporte ao cliente interno, gestão de acessos a sistemas e manutenção preventiva e corretiva da infraestrutura de TI.',
          ],
        },
      ],
    },
  ],
  certifications: [
    {
      name: 'Microsoft Azure Fundamentals (AZ-900)',
      short: 'AZ-900',
      issuer: 'Microsoft',
      badge: 'az-900',
      status: 'earned',
      url: certUrls.az900,
    },
    {
      name: 'Cisco CCNA – Introduction to Networks',
      short: 'CCNA – Introduction to Networks',
      issuer: 'Cisco Networking Academy',
      badge: 'ccna-itn',
      status: 'earned',
      url: certUrls.ccna,
    },
    {
      name: 'Microsoft Azure Administrator (AZ-104)',
      short: 'AZ-104',
      issuer: 'Microsoft',
      badge: 'az-104',
      status: 'in-progress',
    },
  ],
  skills: [
    {
      title: 'Dados',
      items: [
        { label: 'SQL Server', icon: 'sqlserver' },
        { label: 'Databricks', icon: 'databricks' },
        { label: 'Tratamento e análise de dados' },
        { label: 'Relatórios gerenciais' },
      ],
    },
    {
      title: 'CI/CD e versionamento',
      items: [
        { label: 'Jenkins', icon: 'jenkins' },
        { label: 'GitHub Actions', icon: 'githubactions' },
        { label: 'Git', icon: 'git' },
        { label: 'GitHub', icon: 'github' },
      ],
    },
    {
      title: 'Cloud e IaC',
      items: [
        { label: 'Azure', icon: 'azure' },
        { label: 'Terraform', icon: 'terraform' },
        { label: 'Vagrant', icon: 'vagrant' },
        { label: 'Ansible', icon: 'ansible' },
      ],
    },
    {
      title: 'Virtualização',
      items: [
        { label: 'VMware ESXi', icon: 'vmware' },
        { label: 'vCenter', icon: 'vmware' },
        { label: 'vSphere', icon: 'vmware' },
        { label: 'OLVM (em aprendizado)' },
      ],
    },
    {
      title: 'Linux e scripts',
      items: [
        { label: 'Linux', icon: 'linux' },
        { label: 'Bash', icon: 'bash' },
        { label: 'Python', icon: 'python' },
        { label: 'Node.js', icon: 'nodejs' },
        { label: 'Java', icon: 'java' },
      ],
    },
    {
      title: 'Redes',
      items: [{ label: 'Fundamentos (Cisco CCNA – Introduction to Networks)', icon: 'cisco' }],
    },
    {
      title: 'Idiomas',
      items: [{ label: 'Inglês intermediário (em evolução)' }],
    },
  ],
  projects: [
    {
      title: 'Pipeline de banco de dados',
      description:
        'Em publicação no GitHub, em adaptação para MySQL, PostgreSQL, SQL Server e Oracle.',
      tags: ['mysql', 'postgresql', 'sqlserver', 'database'],
      url: links.github,
      todo: 'TODO: link do repositório específico',
    },
    {
      title: 'HomeLab',
      description: 'Servidor de virtualização com IA local (Python).',
      tags: ['python', 'server'],
      url: links.github,
      todo: 'TODO: link do repositório específico',
    },
    {
      title: 'Terraform + vCenter',
      description: 'Criação de VMs a partir de template com infraestrutura como código.',
      tags: ['terraform', 'vmware'],
      url: links.github,
      todo: 'TODO: link do repositório específico',
    },
    {
      title: 'Vagrant + vSphere',
      description: 'Criação reproduzível de VMs em servidor vSphere.',
      tags: ['vagrant', 'vmware'],
      url: links.github,
      todo: 'TODO: link do repositório específico',
    },
  ],
  projectsNote: { text: 'Repositórios em github.com/MarcosCantelli', url: links.github },
  academicProjects: [
    {
      year: '2020',
      title: 'Bosch Brasil',
      note: '3º lugar, IoT Supply Chain',
      description: 'Automação de estoque com RFID, Firebase e Raspberry Pi.',
    },
    {
      year: '2021',
      title: 'Shopping do Cidadão',
      description: 'Site de pedidos de documentos com chatbot IBM Watson.',
    },
    {
      year: '2022',
      title: 'Ford Motor',
      description: 'Multimídia inteligente integrada ao Google Assistant.',
    },
    {
      year: '2023',
      title: 'Toledo do Brasil',
      description:
        'Redução de fraudes em pesagem de caminhões com visão computacional (Python e OpenCV).',
    },
    {
      year: '2024',
      title: 'TCC',
      description:
        'Plataforma para orquestração de scripts legados, executados de forma automatizada sem depender de terceiros.',
    },
  ],
  courses: [
    {
      name: 'Ansible para SysAdmin',
      provider: 'Udemy',
      url: courseUrls.ansible,
      link: 'certificate',
      icon: 'udemy',
    },
    {
      name: 'Cursos de tecnologia',
      provider: 'Alura',
      url: courseUrls.alura,
      link: 'profile',
      icon: 'book',
    },
  ],
  links,
};
