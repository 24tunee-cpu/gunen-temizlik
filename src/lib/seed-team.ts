/**
 * Kanonik ekip üyeleri — seedKey ile upsert; panelden eklenen kayıtlarda seedKey kullanılmaz.
 */
import type { PrismaClient } from '@prisma/client';

export type TeamMemberSeedRow = {
  seedKey: string;
  name: string;
  role: string;
  bio: string;
  image: string | null;
  phone: string | null;
  email: string | null;
  linkedin: string | null;
  order: number;
  isActive: boolean;
};

const IMG_PATRON = 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400';
const IMG_MANAGER = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400';
const IMG_SOCIAL = 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400';

export const TEAM_SEED_DATA: TeamMemberSeedRow[] = [
  {
    seedKey: 'gunen-team-01',
    name: 'Ökkeş Günen',
    role: 'Kurucu & firma sahibi',
    bio: 'Günen Temizlik’in kurucusu; İstanbul genelinde operasyon ve müşteri memnuniyetinden sorumlu.',
    image: IMG_PATRON,
    phone: null,
    email: null,
    linkedin: null,
    order: 1,
    isActive: true,
  },
  {
    seedKey: 'gunen-team-02',
    name: 'Tunay Günen',
    role: 'Yönetici',
    bio: 'Günlük operasyon, ekip koordinasyonu ve hizmet kalitesi standartlarının yürütülmesinden sorumlu.',
    image: IMG_MANAGER,
    phone: null,
    email: null,
    linkedin: null,
    order: 2,
    isActive: true,
  },
  {
    seedKey: 'gunen-team-03',
    name: 'Vedat Günen',
    role: 'Sosyal medya sorumlusu',
    bio: 'Dijital iletişim, içerik ve sosyal medya kanallarının yönetimi.',
    image: IMG_SOCIAL,
    phone: null,
    email: null,
    linkedin: null,
    order: 3,
    isActive: true,
  },
  {
    seedKey: 'gunen-team-04',
    name: 'Serkan Yıldız',
    role: 'Saha ekibi',
    bio: 'Saha temizlik operasyonlarında görev alan ekip üyesi.',
    image: null,
    phone: null,
    email: null,
    linkedin: null,
    order: 4,
    isActive: true,
  },
  {
    seedKey: 'gunen-team-05',
    name: 'Emine Koç',
    role: 'Saha ekibi',
    bio: 'Konut ve iş yeri temizlik hizmetlerinde saha personeli.',
    image: null,
    phone: null,
    email: null,
    linkedin: null,
    order: 5,
    isActive: true,
  },
  {
    seedKey: 'gunen-team-06',
    name: 'Murat Şen',
    role: 'Saha ekibi',
    bio: 'Profesyonel temizlik süreçlerinde destek personeli.',
    image: null,
    phone: null,
    email: null,
    linkedin: null,
    order: 6,
    isActive: true,
  },
  {
    seedKey: 'gunen-team-07',
    name: 'Gül Öztürk',
    role: 'Saha ekibi',
    bio: 'Operasyonel temizlik görevlerinde görevli personel.',
    image: null,
    phone: null,
    email: null,
    linkedin: null,
    order: 7,
    isActive: true,
  },
  {
    seedKey: 'gunen-team-08',
    name: 'Hasan Erdoğan',
    role: 'Saha ekibi',
    bio: 'Saha temizlik ekibinde görev alan personel.',
    image: null,
    phone: null,
    email: null,
    linkedin: null,
    order: 8,
    isActive: true,
  },
  {
    seedKey: 'gunen-team-09',
    name: 'Sevim Kılıç',
    role: 'Saha ekibi',
    bio: 'İç mekan temizlik operasyonlarında görevli.',
    image: null,
    phone: null,
    email: null,
    linkedin: null,
    order: 9,
    isActive: true,
  },
  {
    seedKey: 'gunen-team-10',
    name: 'Orhan Aktaş',
    role: 'Saha ekibi',
    bio: 'Temizlik hizmetlerinde saha destek personeli.',
    image: null,
    phone: null,
    email: null,
    linkedin: null,
    order: 10,
    isActive: true,
  },
];

export async function upsertCanonicalTeamMembers(prisma: PrismaClient): Promise<number> {
  for (const row of TEAM_SEED_DATA) {
    const { seedKey, ...fields } = row;
    const existing = await prisma.teamMember.findFirst({ where: { seedKey } });
    if (existing) {
      await prisma.teamMember.update({
        where: { id: existing.id },
        data: {
          name: fields.name,
          role: fields.role,
          bio: fields.bio,
          image: fields.image,
          phone: fields.phone,
          email: fields.email,
          linkedin: fields.linkedin,
          order: fields.order,
          isActive: fields.isActive,
        },
      });
    } else {
      await prisma.teamMember.create({
        data: { seedKey, ...fields },
      });
    }
  }

  await prisma.teamMember.deleteMany({
    where: {
      seedKey: null,
      name: { in: ['Ahmet Yilmaz', 'Ayse Kaya', 'Mehmet Demir'] },
    },
  });

  return TEAM_SEED_DATA.length;
}
