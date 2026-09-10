require('dotenv').config();

const bcrypt = require('bcryptjs');
const { prisma } = require('../src/config/prisma');

const DEMO_POSTS = [
  {
    title: 'Planejamento do bimestre',
    description: 'Metas, eixos e calendário de avaliações para o 3º bimestre.',
    created_at: new Date(2026, 6, 14, 9, 15, 0),
  },
  {
    title: 'Combinados da sala',
    description: 'Acordos de convivência para manter o clima de estudo na turma.',
    created_at: new Date(2026, 6, 16, 11, 0, 0),
  },
  {
    title: 'Rotina de leitura',
    description: 'Quinze minutos diários de leitura compartilhada no início da aula.',
    created_at: new Date(2026, 6, 20, 8, 40, 0),
  },
  {
    title: 'Avaliação diagnóstica',
    description: 'Como ler os resultados e reorganizar os grupos de aprendizagem.',
    created_at: new Date(2026, 6, 22, 14, 20, 0),
  },
  {
    title: 'Projeto interdisciplinar',
    description: 'Roteiro para unir História, Geografia e Língua Portuguesa.',
    created_at: new Date(2026, 6, 28, 10, 5, 0),
  },
  {
    title: 'Uso do laboratório',
    description: 'Normas de segurança e agendamento das práticas da semana.',
    created_at: new Date(2026, 7, 3, 9, 30, 0),
  },
  {
    title: 'Feira de ciências',
    description: 'Etapas de orientação dos grupos até o dia da mostra.',
    created_at: new Date(2026, 7, 8, 16, 10, 0),
  },
  {
    title: 'Reunião de pais',
    description: 'Pauta objetiva: frequência, aprendizagem e próximos combinados.',
    created_at: new Date(2026, 7, 12, 18, 0, 0),
  },
  {
    title: 'Oficina de escrita',
    description: 'Sequência de produção textual com revisão entre pares.',
    created_at: new Date(2026, 7, 15, 10, 45, 0),
  },
  {
    title: 'Matemática no cotidiano',
    description: 'Problemas com receitas, medidas e dinheiro para 6º ano.',
    created_at: new Date(2026, 7, 18, 13, 25, 0),
  },
  {
    title: 'História local',
    description: 'Passeio pelo bairro e registro das memórias da comunidade.',
    created_at: new Date(2026, 7, 21, 9, 0, 0),
  },
  {
    title: 'Educação ambiental',
    description: 'Coleta seletiva na escola e horta como laboratório vivo.',
    created_at: new Date(2026, 7, 25, 11, 35, 0),
  },
  {
    title: 'Semana da pátria',
    description: 'Atividades cívicas com ênfase em cidadania e respeito.',
    created_at: new Date(2026, 8, 1, 8, 50, 0),
  },
  {
    title: 'Jogos cooperativos',
    description: 'Circuito de Educação Física para fortalecer o trabalho em equipe.',
    created_at: new Date(2026, 8, 4, 15, 10, 0),
  },
  {
    title: 'Biblioteca itinerante',
    description: 'Empréstimo de livros em sala e indicação de leituras da semana.',
    created_at: new Date(2026, 8, 8, 10, 20, 0),
  },
  {
    title: 'Recuperação paralela',
    description: 'Horários e materiais de reforço para quem ficou abaixo da média.',
    created_at: new Date(2026, 8, 11, 14, 0, 0),
  },
  {
    title: 'Conselho de classe',
    description: 'Síntese por turma e encaminhamentos combinados com a coordenação.',
    created_at: new Date(2026, 8, 15, 17, 30, 0),
  },
  {
    title: 'Mostra cultural',
    description: 'Ensaio, palco e atribuições das turmas no dia da apresentação.',
    created_at: new Date(2026, 8, 18, 9, 40, 0),
  },
  {
    title: 'Tecnologia na aula',
    description: 'Uso responsável do laboratório de informática e dos tablets.',
    created_at: new Date(2026, 8, 22, 11, 15, 0),
  },
  {
    title: 'Inclusão e acessibilidade',
    description: 'Adaptações simples de material para garantir participação de todos.',
    created_at: new Date(2026, 8, 25, 13, 50, 0),
  },
  {
    title: 'Encerramento do trimestre',
    description: 'Checklist de notas, portfólio e devolutiva aos estudantes.',
    created_at: new Date(2026, 8, 28, 16, 5, 0),
  },
  {
    title: 'Devolutiva às famílias',
    description: 'Modelo de recado com avanços, dificuldades e próximos passos.',
    created_at: new Date(2026, 8, 30, 10, 0, 0),
  },
];

async function upsertAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@teacherlesson.local';
  const password = process.env.ADMIN_PASSWORD || 'Admin@123';
  const name = process.env.ADMIN_NAME || 'Administrator';

  const existingAdmin = await prisma.user.findUnique({
    where: { email },
  });

  if (existingAdmin) {
    console.log(`Admin already exists: ${email}`);
    return existingAdmin;
  }

  const admin = await prisma.user.create({
    data: {
      name,
      email,
      password: await bcrypt.hash(password, 10),
      role: 'ADMIN',
    },
  });

  console.log(`Admin seeded successfully: ${admin.email} (id=${admin.id})`);
  return admin;
}

async function seedDemoPosts(preferredAdmin) {
  const admin = preferredAdmin ?? await prisma.user.findFirst({
    where: { role: 'ADMIN', deleted_at: null },
    orderBy: { id: 'asc' },
  });

  if (!admin) {
    console.log('No admin user found; skipping demo posts.');
    return;
  }

  const existing = await prisma.post.count({
    where: { deleted_at: null },
  });

  if (existing >= 20) {
    console.log(`Demo posts already present (${existing}).`);
    return;
  }

  await prisma.post.createMany({
    data: DEMO_POSTS.map((post) => ({
      title: post.title,
      description: post.description,
      created_at: post.created_at,
      updated_at: post.created_at,
      user_id: admin.id,
      status: 'PUBLISHED',
    })),
  });

  const total = existing + DEMO_POSTS.length;
  console.log(`Seeded ${DEMO_POSTS.length} demo posts for ${admin.email}. Total posts: ${total}.`);
}

async function seedDemoUsers() {
  const existing = await prisma.user.count({
    where: { deleted_at: null },
  });

  if (existing >= 15) {
    console.log(`Demo users already present (${existing}).`);
    return;
  }

  const password = await bcrypt.hash('Aluno@123', 10);
  const names = [
    ['Ana Souza', 'ana.souza@teacherlesson.local'],
    ['Bruno Lima', 'bruno.lima@teacherlesson.local'],
    ['Carla Mendes', 'carla.mendes@teacherlesson.local'],
    ['Diego Martins', 'diego.martins@teacherlesson.local'],
    ['Elisa Rocha', 'elisa.rocha@teacherlesson.local'],
    ['Fábio Nunes', 'fabio.nunes@teacherlesson.local'],
    ['Gabriela Pinto', 'gabriela.pinto@teacherlesson.local'],
    ['Henrique Alves', 'henrique.alves@teacherlesson.local'],
    ['Isabela Freitas', 'isabela.freitas@teacherlesson.local'],
    ['João Pedro Ramos', 'joao.ramos@teacherlesson.local'],
    ['Larissa Castro', 'larissa.castro@teacherlesson.local'],
    ['Marcelo Vieira', 'marcelo.vieira@teacherlesson.local'],
    ['Natália Correia', 'natalia.correia@teacherlesson.local'],
    ['Otávio Borges', 'otavio.borges@teacherlesson.local'],
    ['Patrícia Gomes', 'patricia.gomes@teacherlesson.local'],
    ['Renato Barros', 'renato.barros@teacherlesson.local'],
  ];

  await prisma.user.createMany({
    data: names.map(([name, email], index) => ({
      name,
      email,
      password,
      role: 'USER',
      created_at: new Date(2026, 6, 10 + index, 9, 0, 0),
      updated_at: new Date(2026, 6, 10 + index, 9, 0, 0),
    })),
    skipDuplicates: true,
  });

  const total = await prisma.user.count({ where: { deleted_at: null } });
  console.log(`Seeded community members. Total users: ${total}.`);
}

async function seedDemoComments() {
  const existing = await prisma.comment.count({
    where: { deleted_at: null },
  });

  if (existing >= 8) {
    console.log(`Demo comments already present (${existing}).`);
    return;
  }

  const post = await prisma.post.findFirst({
    where: { deleted_at: null },
    orderBy: { created_at: 'desc' },
    select: { id: true, title: true },
  });

  if (!post) {
    console.log('No posts found; skipping demo comments.');
    return;
  }

  const members = await prisma.user.findMany({
    where: { deleted_at: null },
    orderBy: { id: 'asc' },
    take: 6,
    select: { id: true, name: true },
  });

  if (members.length === 0) {
    console.log('No users found; skipping demo comments.');
    return;
  }

  const notes = [
    'Gostei da sequência. Vou aplicar na terça com o 6º ano.',
    'O combinado da leitura compartilhada funcionou bem na minha turma.',
    'Dá para adaptar o roteiro para o 8º ano sem perder o objetivo.',
    'Valeu o lembrete do tempo de fala. A turma ficou mais organizada.',
    'Posso usar o mesmo planejamento na oficina de escrita?',
    'A devolutiva para as famílias ficou objetiva. Obrigada pelo modelo.',
  ];

  await prisma.comment.createMany({
    data: notes.map((content, index) => {
      const author = members[index % members.length];
      return {
        content,
        post_id: post.id,
        user_id: author.id,
        created_at: new Date(2026, 8, 1 + index, 10 + index, 15, 0),
        updated_at: new Date(2026, 8, 1 + index, 10 + index, 15, 0),
      };
    }),
  });

  const total = await prisma.comment.count({ where: { deleted_at: null } });
  console.log(`Seeded comments on “${post.title}”. Total comments: ${total}.`);
}

async function main() {
  const admin = await upsertAdmin();
  await seedDemoUsers();
  await seedDemoPosts(admin);
  await seedDemoComments();
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
