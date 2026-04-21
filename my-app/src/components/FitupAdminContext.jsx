import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  isMemberAssignedToCoach,
  memberInCoachBranch,
} from '../utils/coachClientScope';

const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;

const createGymAccountId = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const token = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `GYM-${date}-${token}`;
};

const nextFitupUserId = (users) => {
  const maxN = users.reduce((max, u) => {
    const m = String(u.fitupUserId || '').match(/FTU-(\d+)/);
    const n = m ? Number(m[1]) : 0;
    return n > max ? n : max;
  }, 0);
  return `FTU-${String(maxN + 1).padStart(4, '0')}`;
};

const nextEmployeeCode = (employees) => {
  const rows = Array.isArray(employees) ? employees : [];
  const maxN = rows.reduce((max, e) => {
    const m = String(e.employeeCode || '').match(/EMP-(\d+)/);
    const n = m ? Number(m[1]) : 0;
    return n > max ? n : max;
  }, 0);
  return `EMP-${String(maxN + 1).padStart(4, '0')}`;
};

const createOrgCoachId = (gymId = '', seq = 1) => {
  const gymToken = String(gymId || 'GYM')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6) || 'GYM';
  return `FCO-${gymToken}-${String(Math.max(1, Number(seq) || 1)).padStart(3, '0')}`;
};

const nextOrgCoachId = (users, gymId = '') => {
  const gymToken = String(gymId || 'GYM')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6) || 'GYM';
  const rows = Array.isArray(users) ? users : [];
  const maxN = rows.reduce((max, u) => {
    const coachId = String(u?.profile?.coachId || '').trim().toUpperCase();
    const match = coachId.match(new RegExp(`^FCO-${gymToken}-(\\d+)$`));
    const n = match ? Number(match[1]) : 0;
    return n > max ? n : max;
  }, 0);
  return createOrgCoachId(gymId, maxN + 1);
};

const normalizeUsersCoachIds = (rows) => {
  const list = Array.isArray(rows) ? rows : [];
  const coachMap = new Map();
  let seq = 1;
  return list.map((u) => {
    const p = u && typeof u === 'object' ? u.profile || {} : {};
    const emailKey = String(p.coachEmail || '').trim().toLowerCase();
    const nameKey = String(p.coachName || '').trim().toLowerCase();
    const gymKey = String(u?.registeredGymId || '').trim().toUpperCase();
    const key = emailKey || `${nameKey}__${gymKey}` || String(p.coachId || '').trim().toLowerCase();
    if (!key || (!p.coachName && !p.coachEmail && !p.coachId)) return u;
    if (!coachMap.has(key)) {
      coachMap.set(key, String(p.coachId || '').trim() || createOrgCoachId(u?.registeredGymId, seq++));
    }
    const coachId = coachMap.get(key);
    return {
      ...u,
      profile: {
        ...p,
        coachId,
      },
    };
  });
};

/** People who created an account on the FITUP marketing site (leads / demo CRM — not gym members). */
const initialUsers = [
  {
    id: 'u1',
    fitupUserId: 'FTU-0001',
    name: 'Alex Rivera',
    email: 'alex@example.com',
    registeredGymId: 'g1',
    partnerGymId: 'pg-1',
    profile: {
      phone: '+1 512 555 0101',
      city: 'Austin',
      coachId: 'COA-1001',
      coachName: 'Maya Cole',
      coachEmail: 'maya.cole@fitupcoaches.com',
      coachPhone: '+1 512 555 2001',
      coachSpecialty: 'Strength',
      coachSessionsPerWeek: 28,
      coachRating: 4.9,
      coachTotalSessions: 342,
      coachBio: 'Focuses on strength progression and safe form for all levels.',
      coachExperience: '8 years',
      coachAvailability: 'Weekdays',
      coachImage: 'https://images.unsplash.com/photo-1549476464-37392f717541?auto=format&fit=crop&w=300&q=80',
      coachCertifications: [
        { id: 'cert-1', name: 'NASM-CPT', imageUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=500&q=80' },
        { id: 'cert-2', name: 'CrossFit L1', imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=500&q=80' },
      ],
      membershipPricePaid: 129,
      membershipCurrency: 'USD',
      joinedFrom: 'Gym onboarding',
      trainingRoutine:
        'Mon: Upper push (bench, OHP, accessories)\nWed: Lower (squat, RDL, core)\nFri: Full body + 20 min easy cardio',
      nutritionProgram:
        'Protein ~140g/day · 2.5L water · 2 cups veg per meal · Limit sugary drinks',
      programsUpdatedAt: '2026-04-01T12:00:00Z',
      programsUpdatedByCoachName: 'Maya Cole',
      programsNeedReview: false,
    },
    status: 'active',
    createdAt: '2025-11-02T10:00:00Z',
    signedInOnSite: true,
    lastSiteVisitAt: '2026-04-04T18:22:00Z',
    lastPageViewed: '/platform',
    sitePageViews7d: 42,
  },
  {
    id: 'u2',
    fitupUserId: 'FTU-0002',
    name: 'Jordan Lee',
    email: 'jordan@example.com',
    registeredGymId: 'g3',
    partnerGymId: 'pg-3',
    profile: {
      phone: '+1 303 555 0112',
      city: 'Denver',
      coachId: 'COA-1002',
      coachName: 'Ryan Ford',
      coachEmail: 'ryan.ford@fitupcoaches.com',
      coachPhone: '+1 303 555 2002',
      coachSpecialty: 'Fat loss',
      coachSessionsPerWeek: 24,
      coachRating: 4.7,
      coachTotalSessions: 280,
      coachBio: 'Builds sustainable fat-loss plans with strength and conditioning.',
      coachExperience: '6 years',
      coachAvailability: 'Weekdays + Saturday',
      coachImage: 'https://images.unsplash.com/photo-1566753323558-f4e0952af115?auto=format&fit=crop&w=300&q=80',
      coachCertifications: [{ id: 'cert-3', name: 'ACE CPT', imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=500&q=80' }],
      membershipPricePaid: 79,
      membershipCurrency: 'USD',
      joinedFrom: 'Website signup',
    },
    status: 'active',
    createdAt: '2025-12-18T14:30:00Z',
    signedInOnSite: false,
    lastSiteVisitAt: '2026-04-03T09:10:00Z',
    lastPageViewed: '/for-gyms',
    sitePageViews7d: 8,
  },
  {
    id: 'u3',
    fitupUserId: 'FTU-0003',
    name: 'Sam Patel',
    email: 'sam@example.com',
    registeredGymId: null,
    partnerGymId: null,
    profile: {
      phone: '+1 212 555 0190',
      city: 'New York',
      coachId: '',
      coachName: '',
      coachEmail: '',
      coachPhone: '',
      coachSpecialty: '',
      coachSessionsPerWeek: 0,
      coachRating: 0,
      coachTotalSessions: 0,
      coachBio: '',
      coachExperience: '',
      coachAvailability: '',
      coachImage: '',
      coachCertifications: [],
      membershipPricePaid: 0,
      membershipCurrency: 'USD',
      joinedFrom: 'Partnership contact',
    },
    status: 'disabled',
    createdAt: '2026-01-05T09:15:00Z',
    signedInOnSite: false,
    lastSiteVisitAt: '2026-03-20T16:00:00Z',
    lastPageViewed: '/about',
    sitePageViews7d: 0,
  },
  {
    id: 'u4',
    fitupUserId: 'FTU-0004',
    name: 'Casey Nguyen',
    email: 'casey@example.com',
    registeredGymId: 'g2',
    partnerGymId: 'pg-2',
    profile: {
      phone: '+1 206 555 0123',
      city: 'Seattle',
      coachId: 'COA-1003',
      coachName: 'Liam West',
      coachEmail: 'liam.west@fitupcoaches.com',
      coachPhone: '+1 206 555 2003',
      coachSpecialty: 'Mobility',
      coachSessionsPerWeek: 22,
      coachRating: 4.8,
      coachTotalSessions: 310,
      coachBio: 'Helps members improve mobility, posture, and recovery.',
      coachExperience: '7 years',
      coachAvailability: 'Evenings',
      coachImage: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=300&q=80',
      coachCertifications: [{ id: 'cert-4', name: 'FRC Mobility Specialist', imageUrl: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&w=500&q=80' }],
      membershipPricePaid: 99,
      membershipCurrency: 'USD',
      joinedFrom: 'Gym invite',
    },
    status: 'active',
    createdAt: '2026-03-28T11:00:00Z',
    signedInOnSite: true,
    lastSiteVisitAt: '2026-04-04T17:55:00Z',
    lastPageViewed: '/contact',
    sitePageViews7d: 15,
  },
  {
    id: 'u5',
    fitupUserId: 'FTU-0005',
    name: 'Lina Haddad',
    email: 'lina@example.com',
    registeredGymId: 'g1',
    partnerGymId: 'pg-1',
    profile: {
      phone: '+1 646 555 0171',
      city: 'New York',
      coachId: 'COA-1004',
      coachName: 'Sara Nabil',
      coachEmail: 'sara.nabil@fitupcoaches.com',
      coachPhone: '+1 646 555 2004',
      coachSpecialty: 'Nutrition',
      coachSessionsPerWeek: 18,
      coachRating: 4.6,
      coachTotalSessions: 190,
      coachBio: 'Integrates nutrition coaching with personalized training plans.',
      coachExperience: '5 years',
      coachAvailability: 'Flexible',
      coachImage: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=300&q=80',
      coachCertifications: [{ id: 'cert-5', name: 'Precision Nutrition L1', imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=500&q=80' }],
      membershipPricePaid: 149,
      membershipCurrency: 'USD',
      joinedFrom: 'Gym invite',
    },
    status: 'active',
    createdAt: '2026-04-05T10:20:00Z',
    signedInOnSite: true,
    lastSiteVisitAt: '2026-04-06T08:12:00Z',
    lastPageViewed: '/join-us',
    sitePageViews7d: 11,
  },
  {
    id: 'u6',
    fitupUserId: 'FTU-0006',
    name: 'Omar Saleh',
    email: 'omar@example.com',
    registeredGymId: 'g3',
    partnerGymId: 'pg-3',
    profile: {
      phone: '+1 718 555 0148',
      city: 'Seattle',
      coachId: 'COA-1005',
      coachName: 'Noah Kim',
      coachEmail: 'noah.kim@fitupcoaches.com',
      coachPhone: '+1 718 555 2005',
      coachSpecialty: 'Cross training',
      coachSessionsPerWeek: 20,
      coachRating: 4.5,
      coachTotalSessions: 165,
      coachBio: 'Supports hybrid athletes with conditioning and strength cycles.',
      coachExperience: '4 years',
      coachAvailability: 'Weekends',
      coachImage: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&w=300&q=80',
      coachCertifications: [{ id: 'cert-6', name: 'CSCS', imageUrl: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=500&q=80' }],
      membershipPricePaid: 89,
      membershipCurrency: 'USD',
      joinedFrom: 'Website signup',
    },
    status: 'active',
    createdAt: '2026-04-06T09:45:00Z',
    signedInOnSite: false,
    lastSiteVisitAt: '2026-04-06T09:47:00Z',
    lastPageViewed: '/platform',
    sitePageViews7d: 5,
  },
  {
    id: 'u7',
    fitupUserId: 'FTU-0008',
    name: 'Sarah Wilson',
    email: 'sarah.wilson@example.com',
    registeredGymId: 'g1',
    partnerGymId: 'pg-1',
    profile: {
      phone: '+1 512 555 0182',
      city: 'Austin',
      coachId: 'FCO-G1-001',
      coachName: 'John Smith',
      coachEmail: 'john.smith@fitzone.example',
      coachPhone: '',
      coachSpecialty: '',
      coachSessionsPerWeek: 0,
      coachRating: 0,
      coachTotalSessions: 0,
      coachBio: '',
      coachExperience: '',
      coachAvailability: '',
      coachImage: '',
      coachCertifications: [],
      membershipPricePaid: 99,
      membershipCurrency: 'USD',
      joinedFrom: 'Front desk',
      trainingRoutine: '',
      nutritionProgram: '',
      programsUpdatedAt: '',
      programsUpdatedByCoachName: '',
      programsNeedReview: true,
    },
    status: 'active',
    createdAt: '2026-03-10T11:00:00Z',
    signedInOnSite: true,
    lastSiteVisitAt: '2026-04-08T07:30:00Z',
    lastPageViewed: '/platform',
    sitePageViews7d: 6,
  },
];

/** Recent sessions on the marketing site without a logged-in account (from analytics). */
const initialAnonymousSiteSessions = [
  {
    id: 'anon-1',
    lastPath: '/contact',
    pagesInSession: 4,
    lastAt: '2026-04-04T18:40:00Z',
    referrer: 'Direct',
    device: 'Desktop · Chrome',
  },
  {
    id: 'anon-2',
    lastPath: '/for-gyms',
    pagesInSession: 2,
    lastAt: '2026-04-04T18:12:00Z',
    referrer: 'Google',
    device: 'Mobile · Safari',
  },
  {
    id: 'anon-3',
    lastPath: '/',
    pagesInSession: 1,
    lastAt: '2026-04-04T17:30:00Z',
    referrer: 'Instagram',
    device: 'Mobile · Chrome',
  },
  {
    id: 'anon-4',
    lastPath: '/platform',
    pagesInSession: 6,
    lastAt: '2026-04-04T16:05:00Z',
    referrer: 'Direct',
    device: 'Desktop · Firefox',
  },
];

const initialGyms = [
  {
    id: 'g1',
    name: 'Iron Forge',
    location: 'Austin, TX',
    branches: 3,
    status: 'active',
    createdAt: '2025-10-01T12:00:00Z',
  },
  {
    id: 'g2',
    name: 'Pulse Studio',
    location: 'Denver, CO',
    branches: 1,
    status: 'pending',
    createdAt: '2026-02-10T16:00:00Z',
  },
  {
    id: 'g3',
    name: 'Summit Fitness',
    location: 'Seattle, WA',
    branches: 5,
    status: 'active',
    createdAt: '2026-01-22T11:00:00Z',
  },
];

const initialMessages = [
  {
    id: 'm1',
    userId: 'u1',
    userName: 'Alex Rivera',
    userEmail: 'alex@example.com',
    message:
      'We run three locations — can FITUP white-label the member app with our branding?',
    status: 'unread',
    replyStatus: 'not_sent',
    replyHistory: [],
    createdAt: '2026-04-03T08:00:00Z',
  },
  {
    id: 'm2',
    userId: 'u2',
    userName: 'Jordan Lee',
    userEmail: 'jordan@example.com',
    message: 'Thanks for the platform overview deck. Scheduling a call with our CTO next week.',
    status: 'read',
    replyStatus: 'not_sent',
    replyHistory: [],
    createdAt: '2026-04-02T19:20:00Z',
  },
];

const initialPartnerships = [
  {
    id: 'p1',
    gymName: 'Northwind Athletics',
    locations: 4,
    email: 'partners@northwind.example',
    reason: 'We want to onboard 12 locations next quarter.',
    status: 'pending',
    createdAt: '2026-03-28T11:00:00Z',
  },
  {
    id: 'p2',
    gymName: 'Harbor Fit',
    locations: 1,
    email: 'hello@harborfit.example',
    reason: 'Single boutique gym exploring FITUP.',
    status: 'reviewed',
    createdAt: '2026-04-01T15:30:00Z',
  },
  {
    id: 'p3',
    gymName: 'Metro Strength Co.',
    locations: 8,
    email: 'growth@metrostrength.example',
    reason: 'Franchise rollout — partnership for branding and lead flow.',
    status: 'pending',
    createdAt: '2026-04-03T09:45:00Z',
  },
];

/** Submissions from the /contact partner application form (POST body → your API → store here). */
const initialPartnerApplicationSubmissions = [
  {
    id: 'pas-1',
    submittedAt: '2026-04-04T14:32:00Z',
    status: 'new',
    fields: {
      companyName: 'Riverside Athletic Club',
      companySize: '51–200 employees',
      website: 'https://riversideathletic.example',
      fullName: 'Alex Rivera',
      jobTitle: 'Director of Operations',
      email: 'alex@riversideathletic.example',
      phone: '+1 512 555 0198',
      description:
        'We operate three locations in Texas and want a white-labeled member app for booking, class packs, and AR warmups. FITUP’s platform matches our roadmap for Q3.',
      expectedPartnershipValue: 'Technology integration',
    },
  },
  {
    id: 'pas-2',
    submittedAt: '2026-04-03T09:15:00Z',
    status: 'reviewing',
    fields: {
      companyName: 'Harbor Fit',
      companySize: '1–10 employees',
      website: 'https://harborfit.example',
      fullName: 'Jordan Lee',
      jobTitle: 'Owner',
      email: 'jordan@harborfit.example',
      phone: '+1 303 555 0144',
      description:
        'Single boutique studio — exploring branded app for members and lead capture from Instagram.',
      expectedPartnershipValue: 'Co-marketing',
    },
  },
  {
    id: 'pas-3',
    submittedAt: '2026-03-29T16:40:00Z',
    status: 'accepted',
    fields: {
      companyName: 'Metro Strength Co.',
      companySize: '201+ employees',
      website: 'https://metrostrength.example',
      fullName: 'Sam Patel',
      jobTitle: 'VP Growth',
      email: 'growth@metrostrength.example',
      phone: '+1 212 555 0177',
      description:
        'Franchise rollout across 8 cities. Need scalable app template per brand with central reporting.',
      expectedPartnershipValue: 'Lead generation',
    },
  },
];

const initialPartnerGyms = [
  {
    id: 'pg-1',
    linkedGymId: 'g1',
    gymAccountId: 'GYM-20260401-A7K2Q',
    sourceSubmissionId: 'pas-3',
    legalName: 'FitZone Downtown LLC',
    brandName: 'Downtown Branch',
    branchAddress: '123 Fitness Street, Downtown',
    branchMembers: 842,
    branchCoaches: 12,
    website: 'https://fitzone.example',
    contactName: 'Downtown Desk',
    contactEmail: 'downtown@fitzone.com',
    contactPhone: '+1 234 567 8900',
    companySize: '201+ employees',
    locationsPlanned: 8,
    billingAmount: 6400,
    billingCurrency: 'USD',
    billingCycle: 'monthly',
    paymentMethod: 'bank_transfer',
    paymentStatus: 'paid',
    hasEms: true,
    contractSigned: true,
    contractSignedAt: '2026-03-29T09:20:00Z',
    contractStart: '2026-04-01',
    contractEnd: '2027-03-31',
    contractFileName: 'fitzone-downtown-contract.pdf',
    contractFileDataUrl: '',
    contractDraft: 'FitZone Downtown — FITUP platform agreement.',
    onboardingStatus: 'active',
    managerName: 'John Smith',
    openingHours: 'Mon-Fri: 6AM-10PM, Sat-Sun: 8AM-8PM',
    monthlyRevenue: 85000,
    facilities: 'Cardio zone, strength floor, group studio, sauna, locker rooms',
    branchEquipment:
      'Treadmills, ellipticals, rowers, squat racks, cable stations, free weights, kettlebells',
    gymSpaceSqft: 18500,
    classroomCount: 4,
    classroomSpaceSqft: 3200,
    capacity: 1000,
    yearEstablished: 2018,
    notes: 'Flagship location.',
    paymentHistory: [
      {
        id: 'pay-1',
        amount: 6400,
        currency: 'USD',
        paidAt: '2026-04-02',
        method: 'bank_transfer',
        referenceText: 'INV-2026-0402-001',
        referenceImageUrl: '',
        note: 'Initial monthly platform fee',
      },
    ],
    createdAt: '2026-04-01T12:00:00Z',
  },
  {
    id: 'pg-2',
    linkedGymId: 'g2',
    gymAccountId: 'GYM-20260403-Z9P4L',
    sourceSubmissionId: 'pas-1',
    legalName: 'FitZone Westside LLC',
    brandName: 'Westside Branch',
    branchAddress: '456 Health Avenue, Westside',
    branchMembers: 654,
    branchCoaches: 9,
    website: 'https://fitzone.example',
    contactName: 'Westside Desk',
    contactEmail: 'westside@fitzone.com',
    contactPhone: '+1 234 567 8901',
    companySize: '51–200 employees',
    locationsPlanned: 3,
    billingAmount: 2850,
    billingCurrency: 'USD',
    billingCycle: 'monthly',
    paymentMethod: 'card',
    paymentStatus: 'paid',
    hasEms: true,
    contractSigned: true,
    contractSignedAt: '2026-04-03T11:30:00Z',
    contractStart: '2026-04-10',
    contractEnd: '2027-04-09',
    contractFileName: 'fitzone-westside-contract.pdf',
    contractFileDataUrl: '',
    contractDraft: 'FitZone Westside — FITUP agreement.',
    onboardingStatus: 'active',
    managerName: 'Emma Davis',
    openingHours: 'Mon-Fri: 5AM-11PM, Sat-Sun: 7AM-9PM',
    monthlyRevenue: 64000,
    facilities: 'Indoor pool, HIIT studio, free weights, spin room, cafe',
    branchEquipment: 'Spin bikes, assault runners, sled track, dumbbells to 120 lb, Smith machines',
    gymSpaceSqft: 14200,
    classroomCount: 3,
    classroomSpaceSqft: 2400,
    capacity: 780,
    yearEstablished: 2020,
    notes: 'Strong class attendance.',
    paymentHistory: [
      {
        id: 'pay-2',
        amount: 2850,
        currency: 'USD',
        paidAt: '2026-04-04',
        method: 'card',
        referenceText: 'INV-2026-0404-002',
        referenceImageUrl: '',
        note: 'Initial payment',
      },
    ],
    createdAt: '2026-04-03T12:00:00Z',
  },
  {
    id: 'pg-3',
    linkedGymId: 'g3',
    gymAccountId: 'GYM-20260405-Q3M1X',
    sourceSubmissionId: 'pas-2',
    legalName: 'FitZone North LLC',
    brandName: 'North Branch',
    branchAddress: '789 Wellness Road, North District',
    branchMembers: 521,
    branchCoaches: 8,
    website: 'https://fitzone.example',
    contactName: 'North Desk',
    contactEmail: 'north@fitzone.com',
    contactPhone: '+1 234 567 8902',
    companySize: '1–10 employees',
    locationsPlanned: 1,
    billingAmount: 950,
    billingCurrency: 'USD',
    billingCycle: 'monthly',
    paymentMethod: 'bank_transfer',
    paymentStatus: 'pending',
    hasEms: false,
    contractSigned: false,
    contractSignedAt: '',
    contractStart: '',
    contractEnd: '',
    contractFileName: '',
    contractFileDataUrl: '',
    contractDraft: 'FitZone North — pending legal review.',
    onboardingStatus: 'pending',
    managerName: 'Noor Ahmed',
    openingHours: 'Mon-Fri: 7AM-9PM, Sat-Sun: 8AM-7PM',
    monthlyRevenue: 42000,
    facilities: 'Open gym floor, functional turf, small group studio',
    branchEquipment: 'Rigs, bumper plates, bikes, rowers, resistance bands',
    gymSpaceSqft: 9800,
    classroomCount: 2,
    classroomSpaceSqft: 1400,
    capacity: 620,
    yearEstablished: 2022,
    notes: 'Growing membership base.',
    paymentHistory: [],
    createdAt: '2026-04-05T10:00:00Z',
  },
];

const defaultContentSeo = () => ({
  metaTitle: '',
  metaDescription: '',
  keywords: '',
});

/** Build empty Arabic mirror matching English shape (strings → ""). */
function emptyMirror(en) {
  if (en === null || en === undefined) return '';
  const t = typeof en;
  if (t === 'string') return '';
  if (t === 'number') return 0;
  if (t === 'boolean') return false;
  if (Array.isArray(en)) return en.map((item) => emptyMirror(item));
  if (t === 'object') {
    return Object.fromEntries(
      Object.keys(en).map((k) => [k, emptyMirror(en[k])])
    );
  }
  return '';
}

/** Keep Arabic values when English structure updates; fill new keys with empty defaults. */
function mergeLocaleMirror(en, ar) {
  if (Array.isArray(en)) {
    const src = Array.isArray(ar) ? ar : [];
    return en.map((item, i) => mergeLocaleMirror(item, src[i]));
  }
  if (en && typeof en === 'object') {
    const base = ar && typeof ar === 'object' && !Array.isArray(ar) ? ar : {};
    return Object.fromEntries(
      Object.keys(en).map((k) => [k, mergeLocaleMirror(en[k], base[k])])
    );
  }
  if (typeof en === 'string') return typeof ar === 'string' ? ar : '';
  if (typeof en === 'number') return typeof ar === 'number' ? ar : 0;
  if (typeof en === 'boolean') return typeof ar === 'boolean' ? ar : false;
  return '';
}

function defaultPartnerApplicationFormData() {
  return {
    headline: 'Partner with FITUP',
    subtext:
      'Join an exclusive network of elite fitness technology partners. Application review typically takes 3–5 business days.',
    processSteps: [
      { title: 'Submit Application', icon: '📄' },
      { title: 'Review Process', icon: '🔄' },
      { title: 'Onboarding', icon: '🚀' },
    ],
    submitActionUrl: '',
    companySectionTitle: 'Company information',
    contactSectionTitle: 'Contact person',
    partnershipSectionTitle: 'Partnership details',
    companyFields: [
      {
        name: 'companyName',
        inputType: 'text',
        required: true,
        label: 'Company Name',
        placeholder: 'Enter your company name',
        selectOptions: '',
      },
      {
        name: 'companySize',
        inputType: 'select',
        required: true,
        label: 'Company Size',
        placeholder: 'Company size',
        selectOptions: '1–10 employees,11–50 employees,51–200 employees,201+ employees',
      },
      {
        name: 'website',
        inputType: 'url',
        required: true,
        label: 'Website URL',
        placeholder: 'https://www.example.com',
        selectOptions: '',
      },
    ],
    contactFields: [
      {
        name: 'fullName',
        inputType: 'text',
        required: true,
        label: 'Full Name',
        placeholder: 'Enter your full name',
        selectOptions: '',
      },
      {
        name: 'jobTitle',
        inputType: 'text',
        required: true,
        label: 'Job Title',
        placeholder: 'CEO, Founder, etc.',
        selectOptions: '',
      },
      {
        name: 'email',
        inputType: 'email',
        required: true,
        label: 'Email Address',
        placeholder: 'john@company.com',
        selectOptions: '',
      },
      {
        name: 'phone',
        inputType: 'tel',
        required: true,
        label: 'Phone Number',
        placeholder: '011782356748232',
        selectOptions: '',
      },
    ],
    partnershipFields: [
      {
        name: 'description',
        inputType: 'textarea',
        required: true,
        label:
          "Tell us about your company and why you'd like to partner with FITUP",
        placeholder:
          'Describe your business, and how a partnership with FITUP would create mutual value.',
        selectOptions: '',
      },
      {
        name: 'expectedPartnershipValue',
        inputType: 'select',
        required: false,
        label: 'Expected Partnership Value',
        placeholder: 'Select value',
        selectOptions:
          'Lead generation,Technology integration,Co-marketing,Other',
      },
    ],
    qualificationTitle: 'Qualification Requirements',
    qualificationBody:
      'FITUP partners are selected on a selective basis. We prioritize organizations aligned with our quality and member-safety standards. You will receive a response within the stated review window.',
    submitButtonLabel: 'Submit Application',
    legalNotice:
      'By submitting, you agree to our partnership terms and conditions.',
  };
}

const partnerFormFieldTemplate = {
  name: '',
  inputType: 'text',
  required: true,
  label: '',
  placeholder: '',
  selectOptions: '',
};

function mergeFormFieldArrays(defaults, incoming) {
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return defaults.map((d) => ({ ...d }));
  }
  const tpl = defaults[0]
    ? { ...partnerFormFieldTemplate, ...defaults[0] }
    : { ...partnerFormFieldTemplate };
  return incoming.map((row, i) => ({
    ...tpl,
    ...(defaults[i] && typeof defaults[i] === 'object' ? defaults[i] : {}),
    ...(row && typeof row === 'object' ? row : {}),
  }));
}

function normalizeContentRow(row) {
  const seo = {
    ...defaultContentSeo(),
    ...(row.seo && typeof row.seo === 'object' ? row.seo : {}),
  };
  const seoAr = {
    ...defaultContentSeo(),
    ...(row.seoAr && typeof row.seoAr === 'object' ? row.seoAr : {}),
  };
  let dataJson = row.dataJson;
  if (
    row.page === 'platform' &&
    row.section === 'platform_categories' &&
    dataJson &&
    typeof dataJson === 'object' &&
    Array.isArray(dataJson.categoryChips)
  ) {
    dataJson = {
      ...dataJson,
      categoryChips: dataJson.categoryChips.map((c) =>
        c && typeof c === 'object' ? { ...c, imageUrl: c.imageUrl ?? '' } : c
      ),
    };
  }
  if (
    row.page === 'platform' &&
    row.section === 'latest_news' &&
    dataJson &&
    typeof dataJson === 'object' &&
    Array.isArray(dataJson.cards)
  ) {
    dataJson = {
      ...dataJson,
      cards: dataJson.cards.map((c) => {
        if (!c || typeof c !== 'object') return c;
        const linkHref = c.linkHref ?? c.href ?? '';
        const { href, ...rest } = c;
        return {
          ...rest,
          linkHref,
          linkType: c.linkType === 'external' ? 'external' : 'internal',
        };
      }),
    };
  }
  if (
    row.page === 'platform' &&
    row.section === 'recommended_for_you' &&
    dataJson &&
    typeof dataJson === 'object' &&
    Array.isArray(dataJson.tiles)
  ) {
    dataJson = {
      ...dataJson,
      tiles: dataJson.tiles.map((t) => {
        if (!t || typeof t !== 'object') return t;
        const linkHref = t.linkHref ?? t.href ?? '';
        const { href, ...rest } = t;
        return {
          ...rest,
          linkHref,
          linkType: t.linkType === 'external' ? 'external' : 'internal',
        };
      }),
    };
  }
  if (
    row.section === 'partner_application_form' &&
    dataJson &&
    typeof dataJson === 'object'
  ) {
    const def = defaultPartnerApplicationFormData();
    dataJson = {
      ...def,
      ...dataJson,
      processSteps: Array.isArray(dataJson.processSteps)
        ? dataJson.processSteps.map((s, i) => ({
            title: '',
            icon: '',
            ...(def.processSteps[i] && typeof def.processSteps[i] === 'object'
              ? def.processSteps[i]
              : {}),
            ...(s && typeof s === 'object' ? s : {}),
          }))
        : def.processSteps,
      companyFields: mergeFormFieldArrays(def.companyFields, dataJson.companyFields),
      contactFields: mergeFormFieldArrays(def.contactFields, dataJson.contactFields),
      partnershipFields: mergeFormFieldArrays(
        def.partnershipFields,
        dataJson.partnershipFields
      ),
    };
  }
  const dataJsonAr =
    row.dataJsonAr && typeof row.dataJsonAr === 'object'
      ? mergeLocaleMirror(dataJson, row.dataJsonAr)
      : emptyMirror(dataJson);
  return { ...row, dataJson, seo, seoAr, dataJsonAr };
}

const initialContent = [
  /* —— global (shared on every page) —— */
  {
    id: 'c-gl-01',
    page: 'global',
    section: 'footer',
    enabled: true,
    dataJson: {
      brandName: 'FIT UP',
      tagline: 'Fitness technology for gyms that want to lead—not follow.',
      phone: '+1 (555) 010-2030',
      email: 'hello@fitup.example',
      appBadges: [
        { label: 'App Store', href: '' },
        { label: 'Play Store', href: '' },
      ],
      newsletterTitle: 'Newsletter',
      newsletterPlaceholder: 'Enter Email',
      newsletterButton: 'Subscribe',
      copyright: '© FIT UP. All rights reserved.',
      social: ['instagram', 'facebook', 'linkedin', 'x'],
    },
  },
  /* —— about (marketing About page) —— */
  {
    id: 'c-a-01',
    page: 'about',
    section: 'hero',
    enabled: true,
    dataJson: {
      headline: 'We Built FITUP to Remove Friction From Fitness.',
      headlineAccentWords: ['FITUP', 'Friction From Fitness.'],
      subtext:
        'Technology should simplify fitness — not complicate it. FITUP connects gyms, coaches, and members through one intelligent system.',
    },
  },
  {
    id: 'c-a-02',
    page: 'about',
    section: 'pain_points',
    enabled: true,
    dataJson: {
      sectionTitle: 'Fitness Is Powerful. The Experience Isn\'t.',
      sectionTitleAccentWords: ['The Experience Isn\'t.'],
      cards: [
        { iconUrl: '', title: 'Disconnected systems', description: '' },
        { iconUrl: '', title: 'Manual bookings', description: '' },
        { iconUrl: '', title: 'Missed sessions', description: '' },
        { iconUrl: '', title: 'Overcrowded gyms', description: '' },
        { iconUrl: '', title: 'Frustrated members', description: '' },
      ],
      closingLine: 'We knew fitness deserved better infrastructure.',
    },
  },
  {
    id: 'c-a-03',
    page: 'about',
    section: 'our_mission',
    enabled: true,
    dataJson: {
      sectionTitle: 'Why We Built FITUP',
      sectionTitleAccentWords: ['FITUP'],
      body:
        'FITUP was created to give gyms clarity, coaches focus, and members confidence. We believe fitness should flow — from booking to training to progress — without friction.',
      bodyAccentWords: ['clarity', 'focus', 'confidence', 'flow'],
    },
  },
  {
    id: 'c-a-04',
    page: 'about',
    section: 'our_vision',
    enabled: true,
    dataJson: {
      tagline: 'The Vision',
      headline:
        'A world where gyms don\'t manage chaos, coaches don\'t chase schedules, and members feel in control of their fitness journey.',
      headlineAccentWords: ['fitness journey.'],
      subtext: 'FITUP is built for scale, longevity, and trust.',
      subtextAccentWords: ['scale, longevity,', 'trust.'],
    },
  },
  {
    id: 'c-a-05',
    page: 'about',
    section: 'roadmap',
    enabled: true,
    dataJson: {
      sectionTitle: 'The Roadmap',
      sectionSubtitle: '2025 & Beyond',
      phases: [
        {
          phaseLabel: 'Now',
          isActive: true,
          iconUrl: '',
          items: ['Gym control dashboards', 'Secure payments', 'Smart booking'],
        },
        {
          phaseLabel: '2026',
          isActive: false,
          iconUrl: '',
          items: [
            'Predictive capacity planning',
            'AI-assisted scheduling',
            'Advanced AR training',
          ],
        },
        {
          phaseLabel: 'Beyond',
          isActive: false,
          iconUrl: '',
          items: [
            'Global expansion',
            'Personalized training intelligence',
            'Cross-gym fitness ecosystem',
          ],
        },
      ],
    },
  },
  {
    id: 'c-a-06',
    page: 'about',
    section: 'about_closing',
    enabled: true,
    dataJson: {
      headline: 'FITUP isn\'t here to disrupt gyms. It\'s here to support them.',
      headlineAccentWords: ['It\'s here to support them.'],
      primaryButton: { label: 'Partner With FITUP →', href: '/for-gyms' },
      secondaryButton: { label: 'Explore the Platform', href: '/join-us' },
      footerLine: 'Join 500+ fitness partners building the future of wellness.',
    },
  },
  /* —— contact (Partner with FITUP — full application form; footer lives under Global) —— */
  {
    id: 'c-c-form',
    page: 'contact',
    section: 'partner_application_form',
    enabled: true,
    dataJson: defaultPartnerApplicationFormData(),
  },
  /* —— partnership (marketing Partnership / gateway page) —— */
  {
    id: 'c-pt-01',
    page: 'partnership',
    section: 'hero',
    enabled: true,
    dataJson: {
      badgeLabel: 'The Gateway',
      headline: 'Let\'s Build the Future of Fitness Together',
      headlineAccentWords: ['Fitness Together'],
      subtext:
        'Whether you’re a gym or exploring partnership, this is where it starts.',
      primaryButton: { label: 'Partner With FITUP →', href: '/for-gyms' },
      secondaryButton: { label: 'Partner application', href: '/contact' },
    },
  },
  {
    id: 'c-pt-02',
    page: 'partnership',
    section: 'why_partner',
    enabled: true,
    dataJson: {
      sectionTitle: 'Why Partner with FITUP',
      sectionTitleAccentWords: ['FITUP'],
      cards: [
        {
          iconUrl: '',
          title: 'Smart Operations',
          description: 'Automated booking, scheduling, and capacity control.',
        },
        {
          iconUrl: '',
          title: 'Modern Member Experience',
          description: 'Seamless booking and communication for your clients.',
        },
        {
          iconUrl: '',
          title: 'Built to Scale',
          description: 'Designed for single gyms and multi-branch operations.',
        },
      ],
    },
  },
  {
    id: 'c-pt-03',
    page: 'partnership',
    section: 'partnership_inquiry',
    enabled: true,
    dataJson: {
      iconUrl: '',
      headline: 'Start a Partnership Inquiry',
      subtext:
        'We work with gyms that are serious about improving operations and member experience.',
      outlineButton: {
        label: 'Start a Partnership Application',
        href: '/contact',
      },
    },
  },
  {
    id: 'c-pt-04',
    page: 'partnership',
    section: 'partnership_contact',
    enabled: true,
    dataJson: {
      sectionTitle: 'General Contact',
      sectionSubtitle: 'Have a question or need support? Send us a message.',
      nameLabel: 'Name',
      namePlaceholder: 'Enter your name',
      emailLabel: 'Email',
      emailPlaceholder: 'Enter your email',
      messageLabel: 'Message',
      messagePlaceholder: 'Enter your message',
      submitLabel: 'Send Message',
      footnotes: [
        { text: 'We review every partnership request carefully' },
        { text: 'Your information is secure and never shared' },
      ],
    },
  },
  /* —— platform (video hero, categories, news, recommendations; search UI is fixed in code) —— */
  {
    id: 'c-pl-01',
    page: 'platform',
    section: 'hero',
    enabled: true,
    dataJson: {
      heroVideoUrl: '',
    },
  },
  {
    id: 'c-pl-03',
    page: 'platform',
    section: 'platform_categories',
    enabled: true,
    dataJson: {
      categoryChips: [
        { label: 'Gyms Near me', imageUrl: '' },
        { label: 'Specialties', imageUrl: '' },
        { label: 'Gym New Equipment', imageUrl: '' },
        { label: 'Latest Fitness News', imageUrl: '' },
        { label: 'Fit Up News', imageUrl: '' },
        { label: 'Blogs', imageUrl: '' },
      ],
    },
  },
  {
    id: 'c-pl-04',
    page: 'platform',
    section: 'latest_news',
    enabled: true,
    dataJson: {
      sectionTitle: 'Latest News',
      cards: [
        {
          backgroundImageUrl: '',
          title: 'Safety First',
          description: 'Movements are guided within safe ranges to reduce injury risk.',
          linkType: 'internal',
          linkHref: '/articles/safety-first',
        },
        {
          backgroundImageUrl: '',
          title: 'Coach-Approved Workouts',
          description: 'All AR exercises are approved by gym coaches and trainers.',
          linkType: 'internal',
          linkHref: '/articles/coach-approved',
        },
        {
          backgroundImageUrl: '',
          title: 'Performance Optimization',
          description: 'Better form leads to better results every session.',
          linkType: 'external',
          linkHref: '',
        },
      ],
    },
  },
  {
    id: 'c-pl-05',
    page: 'platform',
    section: 'recommended_for_you',
    enabled: true,
    dataJson: {
      sectionTitle: 'Recommended For You',
      tiles: [
        { imageUrl: '', title: '', linkType: 'internal', linkHref: '' },
        { imageUrl: '', title: '', linkType: 'internal', linkHref: '' },
        { imageUrl: '', title: '', linkType: 'internal', linkHref: '' },
        { imageUrl: '', title: '', linkType: 'internal', linkHref: '' },
      ],
    },
  },
  {
    id: 'c-pl-06',
    page: 'platform',
    section: 'coming_soon_banner',
    enabled: true,
    dataJson: {
      iconUrl: '',
      headline: 'Coming Soon',
      subtext: 'Custom Program & Dieting App',
      primaryButton: { label: 'Download the app', href: '/download' },
    },
  },
  /* —— for gyms (gym-owner landing; mirrors marketing “For gyms” page) —— */
  {
    id: 'c-p-01',
    page: 'for_gyms',
    section: 'hero',
    enabled: true,
    dataJson: {
      headline: 'Transform Your Gym with FITUP',
      subtext:
        'Enterprise-grade technology for membership, scheduling, coaching, and growth—built for owners who want less admin and happier members.',
      primaryCta: { label: 'Become a Partner', href: '/for-gyms#apply' },
      backgroundImageUrl: '',
    },
  },
  {
    id: 'c-p-02',
    page: 'for_gyms',
    section: 'challenges',
    enabled: true,
    dataJson: {
      sectionTitle: 'Challenges Gyms Face',
      cards: [
        { title: 'Manual Management', subtitle: 'Time-consuming operations' },
        { title: 'Fragmented Data', subtitle: 'Unable to make data-driven decisions' },
        { title: 'Poor Member Experience', subtitle: 'Member dissatisfaction and churn' },
      ],
    },
  },
  {
    id: 'c-p-03',
    page: 'for_gyms',
    section: 'solutions',
    enabled: true,
    dataJson: {
      sectionTitle: 'FITUP Comprehensive Solution',
      cards: [
        {
          iconUrl: '',
          title: 'Membership Management',
          description: 'Profiles, plans, and billing in one place.',
        },
        {
          iconUrl: '',
          title: 'Booking & Schedule',
          description: 'Classes and floor time without spreadsheet chaos.',
        },
        {
          iconUrl: '',
          title: 'Coach Management',
          description: 'Rosters, availability, and performance at a glance.',
        },
        {
          iconUrl: '',
          title: 'Announcements System',
          description: 'Reach members where they already are—in the app.',
        },
        {
          iconUrl: '',
          title: 'Capacity Tracking',
          description: 'Know occupancy before it becomes a problem.',
        },
        {
          iconUrl: '',
          title: 'AI Training Tools',
          description: 'Smarter programming and member guidance at scale.',
        },
      ],
    },
  },
  {
    id: 'c-p-04',
    page: 'for_gyms',
    section: 'operational_benefits',
    enabled: true,
    dataJson: {
      sectionTitle: 'Operational Benefits',
      cards: [
        {
          iconUrl: '',
          title: 'Enterprise Security',
          description: 'Controls and practices designed for multi-location operators.',
        },
        {
          iconUrl: '',
          title: 'Instant Updates',
          description: 'Ship announcements, schedule changes, and policies without friction.',
        },
        {
          iconUrl: '',
          title: 'Analytics Dashboard',
          description: 'Clear KPIs for owners—not buried in exports.',
        },
      ],
    },
  },
  {
    id: 'c-p-05',
    page: 'for_gyms',
    section: 'revenue_impact',
    enabled: true,
    dataJson: {
      sectionTitle: 'Revenue Growth & Retention',
      stats: [
        { value: '+35%', iconUrl: '', description: 'Average revenue increase' },
        { value: '+42%', iconUrl: '', description: 'Retention improvement' },
        { value: '-60%', iconUrl: '', description: 'Admin time reduced' },
        { value: '+28%', iconUrl: '', description: 'Member satisfaction' },
      ],
    },
  },
  {
    id: 'c-p-06',
    page: 'for_gyms',
    section: 'partner_cta',
    enabled: true,
    dataJson: {
      headline: 'Ready to Partner with FITUP?',
      subtext:
        'Tell us about your gym—we’ll walk through fit, rollout, and what success looks like for your team.',
      primaryButton: { label: 'Apply for a Gym Partner', href: '/for-gyms#apply' },
    },
  },
  {
    id: 'c-p-07',
    page: 'for_gyms',
    section: 'form_copy',
    enabled: true,
    dataJson: {
      intro: 'Tell us about your locations and goals.',
      privacyNote: 'We never sell your data.',
    },
  },
  {
    id: 'c-p-08',
    page: 'for_gyms',
    section: 'resources',
    enabled: true,
    dataJson: {
      title: 'Resources',
      links: [
        { label: 'Brand guidelines', url: '' },
        { label: 'Security & trust', url: '/security' },
      ],
    },
  },
  {
    id: 'c-p-09',
    page: 'for_gyms',
    section: 'trust_badges',
    enabled: true,
    dataJson: { badges: ['SOC2 in progress', 'GDPR-ready flows'] },
  },
  /* —— app experience (member app landing) —— */
  {
    id: 'c-ax-01',
    page: 'app_experience',
    section: 'hero',
    enabled: true,
    dataJson: {
      headline: 'The Ultimate Fitness App Experience',
      headlineAccentWords: ['Ultimate', 'Fitness', 'App'],
      subtext: 'Everything you need to achieve your fitness goals',
      backgroundImageUrl: '',
    },
  },
  {
    id: 'c-ax-02',
    page: 'app_experience',
    section: 'intro_features',
    enabled: true,
    dataJson: {
      sectionTitle: 'Built for your daily routine',
      cards: [
        {
          iconUrl: '',
          title: 'Personal Dashboard',
          description: 'Daily schedule, progress tracking, and reminders.',
        },
        {
          iconUrl: '',
          title: 'Smart Booking',
          description: 'Book classes, personal training, and equipment instantly.',
        },
        {
          iconUrl: '',
          title: 'Progress Tracking',
          description: 'Visualize your fitness journey.',
        },
        {
          iconUrl: '',
          title: 'Coach Communication',
          description: 'Direct messaging with your trainer.',
        },
        {
          iconUrl: '',
          title: 'AR Training Access',
          description: 'Interactive guidance for workouts.',
        },
      ],
    },
  },
  {
    id: 'c-ax-03',
    page: 'app_experience',
    section: 'progress_tracking',
    enabled: true,
    dataJson: {
      sectionTitle: 'Track Your Progress, Not Just Your Workouts',
      sectionSubtitle: 'Keep track of your progress with easy-to-use tools and features.',
      highlights: [
        { title: 'Workout Assessment History' },
        { title: 'Attendance Tracking' },
        { title: 'Class Attendance & Member Interaction' },
        { title: 'Program Timeline' },
        { title: 'Assessment Results (Monthly/Weekly)' },
        { title: 'All Your Performance Data Is Synced In Real Time' },
      ],
    },
  },
  {
    id: 'c-ax-04',
    page: 'app_experience',
    section: 'booking_experience',
    enabled: true,
    dataJson: {
      sectionTitle: 'Simple, Transparent Booking',
      cards: [
        {
          title: 'What You Can Book',
          iconUrl: '',
          bullets: [
            'Gym classes',
            'PT sessions',
            'Wellness sessions',
            'Any available services (sauna, pool, etc.)',
          ],
        },
        {
          title: 'Booking Flow',
          iconUrl: '',
          bullets: [
            'Choose a service',
            "See trainer's availability",
            'Select date and time',
            'Simple payment',
            'Confirm booking',
          ],
        },
        {
          title: 'Booking Management',
          iconUrl: '',
          bullets: [
            'Rescheduling',
            'Viewing upcoming classes',
            'Booking status (Scheduled, Completed, Cancelled)',
          ],
        },
      ],
    },
  },
  {
    id: 'c-ax-05',
    page: 'app_experience',
    section: 'coach_communication',
    enabled: true,
    dataJson: {
      sectionTitle: 'Direct Communication With Your Coach',
      sectionSubtitle:
        'Message, plan, and stay aligned with your trainer—all inside the app, without switching tools.',
      items: [
        { n: '01', title: 'Chat with your coach' },
        { n: '02', title: 'Video calls and live tracking' },
        { n: '03', title: 'Personalized meal planning' },
        { n: '04', title: 'Goal setting and guidance' },
      ],
    },
  },
  {
    id: 'c-ax-06',
    page: 'app_experience',
    section: 'ar_app_cta',
    enabled: true,
    dataJson: {
      iconUrl: '',
      headline: 'Train Smarter With AR Guidance',
      subtext:
        'Augmented cues and form feedback help you train safely and effectively—right on the gym floor.',
      primaryButton: { label: 'Download Our App', href: '/download' },
      secondaryButton: { label: 'Request A Demo', href: '/partnership' },
    },
  },
  /* —— AR training (AR experience landing) —— */
  {
    id: 'c-ar-01',
    page: 'ar_training',
    section: 'hero',
    enabled: true,
    dataJson: {
      headline: 'AR Training Experience',
      subtext: 'The future of fitness training is here',
      primaryCta: { label: 'Explore AR Training', href: '/download' },
      heroStrip: [
        { iconUrl: '', label: 'Real-time feedback' },
        { iconUrl: '', label: 'Form correction' },
        { iconUrl: '', label: 'Data tracking' },
      ],
    },
  },
  {
    id: 'c-ar-02',
    page: 'ar_training',
    section: 'core_features',
    enabled: true,
    dataJson: {
      sectionTitle: 'Core capabilities',
      cards: [
        {
          iconUrl: '',
          title: 'Real-Time Motion Tracking',
          description: 'Leg tracking with high precision and low latency.',
        },
        {
          iconUrl: '',
          title: 'AR Overlays',
          description: 'Virtual overlays provide guidance in your environment.',
        },
      ],
    },
  },
  {
    id: 'c-ar-03',
    page: 'ar_training',
    section: 'what_is_ar',
    enabled: true,
    dataJson: {
      iconUrl: '',
      title: 'What is AR Training?',
      body:
        'AR training blends your real environment with live guidance—so you see cues, alignment hints, and form feedback while you move. FITUP uses your device camera securely to keep coaching contextual, measurable, and consistent session to session.',
    },
  },
  {
    id: 'c-ar-04',
    page: 'ar_training',
    section: 'ar_timeline',
    enabled: true,
    dataJson: {
      sectionTitle: 'How AR Training Works',
      steps: [
        {
          n: '1',
          label: 'Step 1',
          body: 'Open the AR feature inside the FITUP app.',
          badgeSide: 'left',
        },
        {
          n: '2',
          label: 'Step 2',
          body: 'Align your camera using on-screen guidance.',
          badgeSide: 'right',
        },
        {
          n: '3',
          label: 'Step 3',
          body: 'Real-time overlays guide posture and movement.',
          badgeSide: 'left',
        },
        {
          n: '4',
          label: 'Step 4',
          body: 'Review session feedback and track improvement over time.',
          badgeSide: 'right',
        },
      ],
    },
  },
  {
    id: 'c-ar-05',
    page: 'ar_training',
    section: 'safety_highlights',
    enabled: true,
    dataJson: {
      sectionTitle: 'Designed for Safety and Performance',
      cards: [
        {
          backgroundImageUrl: '',
          title: 'Safety First',
          description: 'Movements are guided within safe ranges to reduce injury risk.',
        },
        {
          backgroundImageUrl: '',
          title: 'Coach-Approved Workouts',
          description: 'All AR exercises are approved by gym coaches and trainers.',
        },
        {
          backgroundImageUrl: '',
          title: 'Performance Optimization',
          description: 'Better form leads to better results every session.',
        },
      ],
    },
  },
  /* —— Join us (members + gyms booking / control landing) —— */
  {
    id: 'c-ju-01',
    page: 'join_us',
    section: 'hero',
    enabled: true,
    dataJson: {
      pills: [{ label: 'For Members' }, { label: 'For Gyms' }],
      headline: 'Simple Booking for Members. Total Control for Gyms.',
      subtext:
        'Connect with your members, manage class schedules, and track leads—all in one app.',
      primaryCta: { label: 'Go to Booking Portal', href: '/booking' },
      secondaryButton: { label: 'Watch Demo Video', href: '/demo' },
    },
  },
  {
    id: 'c-ju-02',
    page: 'join_us',
    section: 'how_clients_book',
    enabled: true,
    dataJson: {
      sectionTitle: 'How Clients Book',
      sectionSubtitle: 'A guided flow from browse to confirmed session.',
      cards: [
        {
          n: '1',
          iconUrl: '',
          title: 'Choose a Class',
          description: 'Browse what’s running this week and pick the format that fits your goal.',
        },
        {
          n: '2',
          iconUrl: '',
          title: 'Select Session',
          description: 'See open seats and formats side by side before you commit.',
        },
        {
          n: '3',
          iconUrl: '',
          title: 'Pick Time & Coach',
          description: 'Match your calendar with coach availability in a few taps.',
        },
        {
          n: '4',
          iconUrl: '',
          title: 'Confirm & Pay',
          description: 'Lock the spot and pay securely—confirmation lands in-app instantly.',
        },
      ],
    },
  },
  {
    id: 'c-ju-03',
    page: 'join_us',
    section: 'member_app_showcase',
    enabled: true,
    dataJson: {
      sectionTitle: 'What The User Sees',
      sectionSubtitle: 'The member view stays fast, clear, and personal.',
      features: [
        { iconUrl: '', title: 'Live availability' },
        { iconUrl: '', title: 'Instant confirmation' },
        { iconUrl: '', title: 'Personalized schedule of content' },
      ],
      stats: [
        { value: '0s', description: 'Real-Time' },
        { value: '100%', description: 'Accuracy' },
      ],
    },
  },
  {
    id: 'c-ju-04',
    page: 'join_us',
    section: 'gym_control',
    enabled: true,
    dataJson: {
      sectionTitle: 'How Gyms Stay In Control',
      sectionSubtitle: 'One dashboard for members, sessions, and front-desk operations.',
      tabs: [
        { label: 'Member Management' },
        { label: 'Session Management' },
        { label: 'Direct Sales and Inventory' },
      ],
      metrics: [
        { label: 'Active Members', value: '42' },
        { label: 'Member Growth', value: '15%' },
        { label: 'Monthly Revenue', value: '$1,112' },
      ],
      activityItems: [
        { text: 'Alex M. booked Personal Training — Today 2:14 PM' },
        { text: 'New member signup — Studio A — Today 11:02 AM' },
        { text: 'Class “HIIT 45” reached capacity — Tomorrow 6:00 AM' },
        { text: 'Payment received — Annual plan — Yesterday 4:51 PM' },
      ],
    },
  },
  {
    id: 'c-ju-05',
    page: 'join_us',
    section: 'solution_pillars',
    enabled: true,
    dataJson: {
      sectionTitle: 'Comprehensive solution',
      cards: [
        { iconUrl: '', title: 'Centralized member data', description: '' },
        { iconUrl: '', title: 'Financial Tracking', description: '' },
        { iconUrl: '', title: 'Smart Booking', description: '' },
        { iconUrl: '', title: 'Full Training Access', description: '' },
        { iconUrl: '', title: 'Direct Communication', description: '' },
      ],
    },
  },
  {
    id: 'c-ju-06',
    page: 'join_us',
    section: 'automation_flow',
    enabled: true,
    dataJson: {
      sectionTitle: 'Automation & Smart Logic',
      sectionSubtitle: 'From first tap to post-session follow-up—without manual busywork.',
      flowSteps: [
        { iconUrl: '', label: 'Booking' },
        { iconUrl: '', label: 'Payment' },
        { iconUrl: '', label: 'Confirmation' },
        { iconUrl: '', label: 'Reminder' },
        { iconUrl: '', label: 'Notification' },
      ],
      stats: [
        { value: '<1s', description: 'Average Response Time' },
        { value: '100%', description: 'Auto-capture' },
        { value: '0', description: 'Manual errors' },
      ],
    },
  },
  /* —— Security & trust landing —— */
  {
    id: 'c-st-01',
    page: 'security_trust',
    section: 'hero',
    enabled: true,
    dataJson: {
      badgeLabel: 'Enterprise-Grade Security',
      badgeIconUrl: '',
      headline: 'Security & Trust Built Into Everything',
      headlineAccentWords: ['Built Into Everything'],
      subtext: 'Your data, your privacy, your peace of mind — protected at every level.',
      trustIndicators: [
        { label: 'GDPR Ready' },
        { label: 'Bank-Level Encryption' },
        { label: '99.9% Uptime' },
      ],
    },
  },
  {
    id: 'c-st-02',
    page: 'security_trust',
    section: 'data_protection',
    enabled: true,
    dataJson: {
      sectionTitle: 'Your Data Is Always Locked.',
      sectionTitleAccentWords: ['Always'],
      description: 'All sensitive data is protected using modern security standards.',
      cards: [
        {
          iconUrl: '',
          title: 'End-to-end encryption (SSL / AES)',
          description: 'Traffic and payloads use industry-standard encryption end to end.',
        },
        {
          iconUrl: '',
          title: 'Data encrypted in transit and at rest',
          description: 'Whether moving between services or stored, data stays protected.',
        },
        {
          iconUrl: '',
          title: 'Secure cloud infrastructure',
          description: 'Hardened hosting, monitoring, and access controls by design.',
        },
      ],
    },
  },
  {
    id: 'c-st-03',
    page: 'security_trust',
    section: 'payment_security',
    enabled: true,
    dataJson: {
      sectionTitle: 'Payment Security',
      subtext: 'Every transaction is protected with industry-leading standards.',
      cards: [
        {
          iconUrl: '',
          title: 'Secure Payment Gateways',
          description: 'Payments are processed through certified providers.',
        },
        {
          iconUrl: '',
          title: 'No Card Storage',
          description: 'FITUP never stores payment card details.',
        },
        {
          iconUrl: '',
          title: 'Fraud Protection',
          description: 'Advanced monitoring protects every transaction.',
        },
      ],
      compliancePill: {
        beforeLink: 'All payment processing adheres to',
        linkLabel: 'PCI DSS compliance standards',
        href: '/privacy',
      },
    },
  },
  {
    id: 'c-st-04',
    page: 'security_trust',
    section: 'privacy_first',
    enabled: true,
    dataJson: {
      sectionTitle: 'Privacy First. Always.',
      sectionTitleAccentWords: ['Always'],
      description:
        'User data belongs to users. FITUP never sells, shares, or misuses personal information.',
      checklist: [
        { label: 'GDPR-ready' },
        { label: 'Transparent data policies' },
        { label: 'User-controlled permissions' },
      ],
      bottomPill: 'Your trust is our foundation. We earn it every day.',
    },
  },
  {
    id: 'c-st-05',
    page: 'security_trust',
    section: 'trust_closing',
    enabled: true,
    dataJson: {
      headline: 'When trust is built in, growth follows.',
      headlineAccentWords: ['growth follows'],
      primaryButton: { label: 'Partner With FITUP', href: '/for-gyms' },
      secondaryButton: { label: 'View Privacy Policy', href: '/privacy' },
      socialProofBadge: 'Trusted by 500+ fitness partners worldwide',
    },
  },
];

const initialSeo = [
  {
    id: 's2',
    page: '/about',
    title: 'About FITUP',
    description:
      'Why we built FITUP—less friction for gyms, coaches, and members. Mission, vision, and roadmap.',
    keywords: 'about FITUP, fitness technology, gym software, mission',
    ogImage: '',
  },
  {
    id: 's-contact',
    page: '/contact',
    title: 'Partner with FITUP | Application',
    description:
      'Apply to partner with FITUP—company details, contact person, and partnership goals. Applications are reviewed in 3–5 business days.',
    keywords:
      'partner FITUP, gym partnership application, fitness technology partner, contact FITUP',
    ogImage: '',
  },
  {
    id: 's4',
    page: '/for-gyms',
    title: 'For gyms | FITUP',
    description:
      'Transform your gym with enterprise-grade membership, scheduling, coaching tools, and analytics.',
    keywords: 'for gyms, gym partner, FITUP, gym software, membership management',
    ogImage: '',
  },
  {
    id: 's5',
    page: '/app-experience',
    title: 'App experience | FITUP',
    description:
      'Personal dashboard, smart booking, progress tracking, coach messaging, and AR-guided training in one member app.',
    keywords: 'FITUP app, fitness app, gym app, booking, AR training',
    ogImage: '',
  },
  {
    id: 's6',
    page: '/ar-training',
    title: 'AR training | FITUP',
    description:
      'Real-time motion tracking, AR overlays, and coach-approved guidance for safer, smarter workouts.',
    keywords: 'AR training, augmented reality fitness, form correction, FITUP',
    ogImage: '',
  },
  {
    id: 's7',
    page: '/join-us',
    title: 'Join us | FITUP',
    description:
      'Simple booking for members and total control for gyms—scheduling, leads, and operations in one app.',
    keywords: 'join FITUP, gym booking, member app, gym dashboard',
    ogImage: '',
  },
  {
    id: 's8',
    page: '/security',
    title: 'Security & trust | FITUP',
    description:
      'Enterprise-grade security, payment protection, and privacy-first practices—encryption, compliance, and uptime you can rely on.',
    keywords: 'FITUP security, GDPR, PCI DSS, encryption, privacy',
    ogImage: '',
  },
  {
    id: 's9',
    page: '/partnership',
    title: 'Partnership | FITUP',
    description:
      'Partner with FITUP—smart operations, modern member experience, and scale. Start an inquiry or reach the team.',
    keywords: 'FITUP partnership, gym partner, fitness technology partner',
    ogImage: '',
  },
  {
    id: 's10',
    page: '/platform',
    title: 'Platform | FITUP',
    description:
      'Explore gyms, news, and recommendations—search, categories, and the FITUP platform hub.',
    keywords: 'FITUP platform, gym search, fitness news, FIT UP',
    ogImage: '',
  },
];

const initialAnalytics = {
  visits: 128400,
  bounceRate: 38.2,
  conversionRate: 3.4,
  topPages: [
    { path: '/platform', views: 42000 },
    { path: '/for-gyms', views: 19000 },
    { path: '/about', views: 12000 },
  ],
  trafficSeries: [
    { date: 'Mar 28', views: 1200 },
    { date: 'Mar 29', views: 1350 },
    { date: 'Mar 30', views: 1280 },
    { date: 'Mar 31', views: 1500 },
    { date: 'Apr 1', views: 1620 },
    { date: 'Apr 2', views: 1580 },
    { date: 'Apr 3', views: 1710 },
  ],
  partnershipsSeries: [
    { label: 'Mon', requests: 2 },
    { label: 'Tue', requests: 5 },
    { label: 'Wed', requests: 3 },
    { label: 'Thu', requests: 6 },
    { label: 'Fri', requests: 8 },
    { label: 'Sat', requests: 4 },
    { label: 'Sun', requests: 3 },
  ],
};

const initialSettings = {
  adminName: 'Admin',
  email: 'admin@fitup.example',
  adminPassword: 'admin123',
  demoAccounts: [
    {
      id: 'fitup',
      label: 'FITUP Demo',
      role: 'fitup',
      email: 'fitup.demo@fitup.example',
      password: 'fitup123',
    },
    {
      id: 'gym',
      label: 'Gym Demo',
      role: 'gym',
      gymId: 'GYM-DEMO-001',
      email: 'gym.demo@fitup.example',
      password: 'gym123',
    },
    {
      id: 'coach',
      label: 'Coach Demo',
      role: 'coach',
      email: 'coach.demo@fitup.example',
      password: 'coach123',
      coachId: 'FCO-G1-001',
      coachName: 'John Smith',
      coachEmail: 'john.smith@fitzone.example',
      partnerGymId: 'pg-1',
      registeredGymId: 'g1',
    },
  ],
  passwordHint: '••••••••',
  notifications: { email: true, browser: true },
  /** Default contract text + optional master file for all gyms (Contracts page). */
  contractMasterDraft:
    'FITUP platform partnership agreement (draft)\n\n1. Services: …\n2. Fees: …\n3. Term: …\n',
  contractMasterFileName: '',
  contractMasterFileDataUrl: '',
};

const initialEmployees = [
  {
    id: 'emp-1',
    employeeCode: 'EMP-0001',
    name: 'Admin',
    email: 'admin@fitup.example',
    role: 'super_admin',
    status: 'active',
    canManageDashboard: true,
    createdAt: '2026-04-01T09:00:00Z',
    lastActiveAt: '2026-04-09T08:45:00Z',
  },
  {
    id: 'emp-2',
    employeeCode: 'EMP-0002',
    name: 'Gym Operations',
    email: 'ops@fitup.example',
    role: 'manager',
    status: 'active',
    canManageDashboard: true,
    createdAt: '2026-04-02T10:30:00Z',
    lastActiveAt: '2026-04-09T07:20:00Z',
  },
];

const initialEmployeeActivity = [
  {
    id: 'ea-1',
    employeeId: 'emp-1',
    employeeName: 'Admin',
    action: 'Updated gym settings',
    detail: 'Updated notifications and security preferences.',
    at: '2026-04-09T08:40:00Z',
  },
  {
    id: 'ea-2',
    employeeId: 'emp-2',
    employeeName: 'Gym Operations',
    action: 'Replied to member message',
    detail: 'Sent reply via chat from dashboard messages.',
    at: '2026-04-09T07:18:00Z',
  },
];

const initialEquipmentInventory = [
  {
    id: 'eq-1',
    branchId: 'pg-1',
    name: 'Treadmill',
    quantity: 6,
    hasEquipment: true,
    underMaintenance: false,
    needOneMore: true,
    needChange: false,
    complaint: false,
    complaintText: '',
    updatedAt: '2026-04-09T08:00:00Z',
  },
  {
    id: 'eq-2',
    branchId: 'pg-1',
    name: 'Leg Press Machine',
    quantity: 2,
    hasEquipment: true,
    underMaintenance: true,
    needOneMore: false,
    needChange: false,
    complaint: true,
    complaintText: 'Noise reported during peak hours.',
    updatedAt: '2026-04-09T08:05:00Z',
  },
  {
    id: 'eq-3',
    branchId: 'pg-2',
    name: 'Bench Press',
    quantity: 4,
    hasEquipment: true,
    underMaintenance: false,
    needOneMore: false,
    needChange: false,
    complaint: false,
    complaintText: '',
    updatedAt: '2026-04-09T08:10:00Z',
  },
];

const initialGymFacilities = [
  {
    id: 'fac-1',
    branchId: 'pg-1',
    name: 'Juice Bar',
    schedule: 'Daily 07:00 - 21:00',
    price: 12,
    currency: 'USD',
    status: 'active',
    notes: 'Protein shakes and healthy snacks.',
  },
  {
    id: 'fac-2',
    branchId: 'pg-1',
    name: 'Sauna',
    schedule: 'Daily 09:00 - 22:00',
    price: 25,
    currency: 'USD',
    status: 'active',
    notes: '45-minute sessions.',
  },
  {
    id: 'fac-3',
    branchId: 'pg-2',
    name: 'Jacuzzi',
    schedule: 'Mon-Sat 10:00 - 20:00',
    price: 30,
    currency: 'USD',
    status: 'maintenance',
    notes: 'Closed for filter replacement.',
  },
];

const initialFacilityBookingRequests = [
  {
    id: 'fbr-1',
    branchId: 'pg-1',
    facilityId: 'fac-2',
    memberName: 'Sarah Wilson',
    memberUserId: 'FTU-0008',
    requestedSlot: '2026-04-10 18:30',
    status: 'pending',
    paymentMethod: 'cash',
    paidOnline: false,
    note: 'Post workout recovery',
    createdAt: '2026-04-09T08:30:00Z',
  },
  {
    id: 'fbr-2',
    branchId: 'pg-1',
    facilityId: 'fac-1',
    memberName: 'Kevin Lee',
    memberUserId: 'FTU-0007',
    requestedSlot: '2026-04-10 12:00',
    status: 'approved',
    paymentMethod: 'online',
    paidOnline: true,
    note: 'Meal plan shake',
    createdAt: '2026-04-09T07:15:00Z',
  },
];

const initialBookings = [
  {
    id: 'b1',
    day: 'Mon',
    time: '09:00',
    title: 'Sarah Wilson',
    coach: 'John Smith',
    coachId: 'FCO-G1-001',
    type: 'private',
    memberUserId: 'FTU-0008',
  },
  {
    id: 'b2',
    day: 'Thu',
    time: '09:00',
    title: 'HIIT Training',
    coach: 'John Smith',
    coachId: 'FCO-G1-001',
    type: 'class',
    classCapacity: 18,
    classBooked: 12,
    classPrice: 30,
    classEnrolled: [
      { id: 'FTU-0001', name: 'Alex Rivera', payment: 'Card' },
      { id: 'FTU-0004', name: 'Casey Nguyen', payment: 'Cash' },
    ],
  },
  { id: 'b3', day: 'Tue', time: '10:00', title: 'Tom Anderson', coach: 'Mike Johnson', coachId: 'FCO-G1-003', type: 'ems' },
  {
    id: 'b4',
    day: 'Mon',
    time: '14:00',
    title: 'Yoga Class',
    coach: 'Emma Davis',
    coachId: 'FCO-G1-002',
    type: 'class',
    classCapacity: 15,
    classBooked: 10,
    classPrice: 25,
    classEnrolled: [
      { id: 'FTU-0002', name: 'Jordan Lee', payment: 'Transfer' },
      { id: 'FTU-0005', name: 'Lina Haddad', payment: 'Card' },
    ],
  },
  { id: 'b5', day: 'Wed', time: '15:00', title: 'Kevin Lee', coach: 'Lisa Brown', coachId: 'FCO-G1-004', type: 'private' },
  { id: 'b6', day: 'Fri', time: '16:00', title: 'Maria Garcia', coach: 'Emma Davis', coachId: 'FCO-G1-002', type: 'private' },
  { id: 'b7', day: 'Mon', time: '09:00', title: 'EMS Session', coach: 'Lina Haddad', coachId: 'FCO-G3-001', type: 'ems' },
  { id: 'b8', day: 'Tue', time: '10:00', title: 'HIIT Group A', coach: 'John Smith', coachId: 'FCO-G1-001', type: 'class', classCapacity: 18, classBooked: 14, classPrice: 30 },
  { id: 'b9', day: 'Tue', time: '10:00', title: 'HIIT Group B', coach: 'Emma Davis', coachId: 'FCO-G1-002', type: 'class', classCapacity: 18, classBooked: 16, classPrice: 30 },
  { id: 'b10', day: 'Wed', time: '11:00', title: 'Core Blast', coach: 'Sarah Wilson', coachId: 'FCO-G2-001', type: 'class', classCapacity: 14, classBooked: 9, classPrice: 22 },
  { id: 'b11', day: 'Thu', time: '15:00', title: 'Mobility Reset', coach: 'Emma Davis', coachId: 'FCO-G1-002', type: 'ems' },
  { id: 'b12', day: 'Fri', time: '18:00', title: 'Spinning Night', coach: 'Mike Johnson', coachId: 'FCO-G1-003', type: 'class', classCapacity: 20, classBooked: 18, classPrice: 20 },
  { id: 'b13', day: 'Sat', time: '10:00', title: 'Pilates Flow', coach: 'Lisa Brown', coachId: 'FCO-G1-004', type: 'class', classCapacity: 12, classBooked: 8, classPrice: 22 },
  { id: 'b14', day: 'Sun', time: '12:00', title: 'Recovery EMS', coach: 'Lina Haddad', coachId: 'FCO-G3-001', type: 'ems' },
];

const initialGymClasses = [
  {
    id: 'c1',
    name: 'Morning Yoga',
    description: 'Start your day with energizing yoga poses',
    coach: 'Emma Davis',
    room: 'Studio A',
    schedule: 'Mon, Wed, Fri - 9:00 AM',
    duration: '60 min',
    enrolled: 12,
    capacity: 15,
    price: 25,
  },
  {
    id: 'c2',
    name: 'HIIT Training',
    description: 'High-intensity interval training for maximum results',
    coach: 'John Smith',
    room: 'Training Area',
    schedule: 'Tue, Thu - 2:00 PM',
    duration: '45 min',
    enrolled: 8,
    capacity: 10,
    price: 30,
  },
  {
    id: 'c3',
    name: 'Pilates',
    description: 'Core strengthening and flexibility',
    coach: 'Lisa Brown',
    room: 'Studio B',
    schedule: 'Mon, Wed, Fri - 5:00 PM',
    duration: '60 min',
    enrolled: 10,
    capacity: 12,
    price: 22,
  },
  {
    id: 'c4',
    name: 'Spinning',
    description: 'Indoor cycling with energetic music',
    coach: 'Mike Johnson',
    room: 'Cycling Studio',
    schedule: 'Daily - 6:00 PM',
    duration: '50 min',
    enrolled: 18,
    capacity: 20,
    price: 20,
  },
  {
    id: 'c5',
    name: 'Functional Strength',
    description: 'Full-body compound movement session',
    coach: 'Sarah Wilson',
    room: 'Studio C',
    schedule: 'Tue, Thu - 7:00 PM',
    duration: '55 min',
    enrolled: 13,
    capacity: 16,
    price: 28,
  },
  {
    id: 'c6',
    name: 'EMS Recovery',
    description: 'Low-impact EMS recovery and activation',
    coach: 'Lina Haddad',
    room: 'EMS Zone',
    schedule: 'Daily - 12:00 PM',
    duration: '35 min',
    enrolled: 9,
    capacity: 12,
    price: 35,
  },
];

const FitupAdminContext = createContext(null);

function readStoredCoachSession() {
  try {
    if (typeof window === 'undefined' || window.sessionStorage.getItem('fitup_admin_auth') !== '1') {
      return { role: 'admin', coachSession: null };
    }
    const role = window.sessionStorage.getItem('fitup_auth_role') || 'admin';
    const raw = window.sessionStorage.getItem('fitup_coach_session');
    const coachSession = raw ? JSON.parse(raw) : null;
    return { role, coachSession };
  } catch {
    return { role: 'admin', coachSession: null };
  }
}

export function FitupAdminProvider({ children }) {
  const storedCoach = readStoredCoachSession();
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return (
        typeof window !== 'undefined' &&
        window.sessionStorage.getItem('fitup_admin_auth') === '1'
      );
    } catch {
      return false;
    }
  });
  const [authUser, setAuthUser] = useState(() => {
    try {
      return (
        (typeof window !== 'undefined' &&
          window.sessionStorage.getItem('fitup_admin_user')) ||
        ''
      );
    } catch {
      return '';
    }
  });
  const [authRole, setAuthRole] = useState(() => storedCoach.role);
  const [coachSession, setCoachSession] = useState(() => storedCoach.coachSession);
  const [users, setUsers] = useState(() => normalizeUsersCoachIds(initialUsers));
  const [anonymousSiteSessions] = useState(initialAnonymousSiteSessions);
  const [gyms, setGyms] = useState(initialGyms);
  const [messages, setMessages] = useState(initialMessages);
  const [employees, setEmployees] = useState(initialEmployees);
  const [employeeActivity, setEmployeeActivity] = useState(initialEmployeeActivity);
  const [equipmentInventory, setEquipmentInventory] = useState(initialEquipmentInventory);
  const [gymFacilities, setGymFacilities] = useState(initialGymFacilities);
  const [facilityBookingRequests, setFacilityBookingRequests] = useState(
    initialFacilityBookingRequests
  );
  const [partnerships, setPartnerships] = useState(initialPartnerships);
  const [partnerApplicationSubmissions, setPartnerApplicationSubmissions] =
    useState(initialPartnerApplicationSubmissions);
  const [partnerGyms, setPartnerGyms] = useState(initialPartnerGyms);

  useEffect(() => {
    setPartnerGyms((prev) => {
      if (!prev.length) return prev;
      const tallies = new Map();
      prev.forEach((pg) => tallies.set(pg.id, { members: 0, coaches: 0 }));
      users.forEach((u) => {
        let bid = u.partnerGymId;
        if (!bid) {
          const pg = prev.find((g) => g.linkedGymId === u.registeredGymId);
          bid = pg?.id;
        }
        if (!bid || !tallies.has(bid)) return;
        const p = u.profile || {};
        if (p.coachName || p.coachEmail) tallies.get(bid).coaches += 1;
        else tallies.get(bid).members += 1;
      });
      let changed = false;
      const next = prev.map((pg) => {
        const t = tallies.get(pg.id);
        if (!t) return pg;
        if (pg.branchMembers === t.members && pg.branchCoaches === t.coaches) return pg;
        changed = true;
        return { ...pg, branchMembers: t.members, branchCoaches: t.coaches };
      });
      return changed ? next : prev;
    });
  }, [users]);

  const [bookings, setBookings] = useState(initialBookings);
  const [gymClasses, setGymClasses] = useState(initialGymClasses);
  const [content, setContent] = useState(() =>
    initialContent.map(normalizeContentRow)
  );
  useEffect(() => {
    setContent((prev) => prev.map(normalizeContentRow));
  }, []);
  const [seo, setSeo] = useState(initialSeo);
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const [settings, setSettings] = useState(initialSettings);
  const [contentSaveStatus, setContentSaveStatus] = useState('idle');

  const updateUser = useCallback((id, patch) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...patch } : u))
    );
  }, []);

  const deleteUser = useCallback((id) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }, []);

  const restrictUser = useCallback((id, reason = '') => {
    const note = String(reason || '').trim();
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u;
        const profile = u.profile || {};
        const memberActionHistory = Array.isArray(profile.memberActionHistory)
          ? profile.memberActionHistory
          : [];
        return {
          ...u,
          status: 'restricted',
          profile: {
            ...profile,
            memberActionHistory: [
              {
                id: uid(),
                type: 'restricted',
                note: note || 'Restricted by FITUP admin',
                at: new Date().toISOString(),
              },
              ...memberActionHistory,
            ],
          },
        };
      })
    );
  }, []);

  const unrestrictUser = useCallback((id, reason = '') => {
    const note = String(reason || '').trim();
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u;
        const profile = u.profile || {};
        const memberActionHistory = Array.isArray(profile.memberActionHistory)
          ? profile.memberActionHistory
          : [];
        return {
          ...u,
          status: 'active',
          profile: {
            ...profile,
            memberActionHistory: [
              {
                id: uid(),
                type: 'unrestricted',
                note: note || 'Restriction removed by FITUP admin',
                at: new Date().toISOString(),
              },
              ...memberActionHistory,
            ],
          },
        };
      })
    );
  }, []);

  const fileUserComplaint = useCallback((id, complaintText) => {
    const text = String(complaintText || '').trim();
    if (!text) return;
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u;
        const profile = u.profile || {};
        const memberComplaints = Array.isArray(profile.memberComplaints)
          ? profile.memberComplaints
          : [];
        const memberActionHistory = Array.isArray(profile.memberActionHistory)
          ? profile.memberActionHistory
          : [];
        return {
          ...u,
          profile: {
            ...profile,
            memberComplaints: [
              { id: uid(), text, status: 'open', createdAt: new Date().toISOString() },
              ...memberComplaints,
            ],
            memberActionHistory: [
              {
                id: uid(),
                type: 'complaint_filed',
                note: text,
                at: new Date().toISOString(),
              },
              ...memberActionHistory,
            ],
          },
        };
      })
    );
  }, []);

  const moderateCoach = useCallback((coachKey, action, payload = {}) => {
    const key = String(coachKey || '').trim().toLowerCase();
    if (!key) return;
    setUsers((prev) =>
      prev.map((u) => {
        const profile = u.profile || {};
        const candidateKeys = [
          String(profile.coachId || '').trim().toLowerCase(),
          String(profile.coachEmail || '').trim().toLowerCase(),
          String(profile.coachName || '').trim().toLowerCase(),
        ].filter(Boolean);
        if (!candidateKeys.includes(key)) return u;
        const coachActionHistory = Array.isArray(profile.coachActionHistory)
          ? profile.coachActionHistory
          : [];
        const coachComplaints = Array.isArray(profile.coachComplaints)
          ? profile.coachComplaints
          : [];
        if (action === 'restrict') {
          return {
            ...u,
            profile: {
              ...profile,
              coachRestricted: true,
              coachActionHistory: [
                {
                  id: uid(),
                  type: 'restricted',
                  note: String(payload.reason || 'Restricted by FITUP admin'),
                  at: new Date().toISOString(),
                },
                ...coachActionHistory,
              ],
            },
          };
        }
        if (action === 'unrestrict') {
          return {
            ...u,
            profile: {
              ...profile,
              coachRestricted: false,
              coachActionHistory: [
                {
                  id: uid(),
                  type: 'unrestricted',
                  note: String(payload.reason || 'Restriction removed by FITUP admin'),
                  at: new Date().toISOString(),
                },
                ...coachActionHistory,
              ],
            },
          };
        }
        if (action === 'complaint') {
          const text = String(payload.text || '').trim();
          if (!text) return u;
          return {
            ...u,
            profile: {
              ...profile,
              coachComplaints: [
                { id: uid(), text, status: 'open', createdAt: new Date().toISOString() },
                ...coachComplaints,
              ],
              coachActionHistory: [
                {
                  id: uid(),
                  type: 'complaint_filed',
                  note: text,
                  at: new Date().toISOString(),
                },
                ...coachActionHistory,
              ],
            },
          };
        }
        if (action === 'delete') {
          return {
            ...u,
            profile: {
              ...profile,
              coachId: '',
              coachName: '',
              coachEmail: '',
              coachPhone: '',
              coachSpecialty: '',
              coachSessionsPerWeek: 0,
              coachRating: 0,
              coachTotalSessions: 0,
              coachBio: '',
              coachExperience: '',
              coachAvailability: '',
              coachCertifications: [],
              coachRestricted: false,
              coachActionHistory: [
                {
                  id: uid(),
                  type: 'deleted',
                  note: String(payload.reason || 'Coach removed by FITUP admin'),
                  at: new Date().toISOString(),
                },
                ...coachActionHistory,
              ],
            },
          };
        }
        return u;
      })
    );
  }, []);

  const updateCoachProfile = useCallback((coachKey, patch = {}) => {
    const key = String(coachKey || '').trim().toLowerCase();
    if (!key) return;
    setUsers((prev) =>
      prev.map((u) => {
        const profile = u.profile || {};
        const candidateKeys = [
          String(profile.coachId || '').trim().toLowerCase(),
          String(profile.coachEmail || '').trim().toLowerCase(),
          String(profile.coachName || '').trim().toLowerCase(),
        ].filter(Boolean);
        if (!candidateKeys.includes(key)) return u;
        return {
          ...u,
          profile: {
            ...profile,
            ...patch,
          },
        };
      })
    );
  }, []);

  /**
   * Gym dashboard action: adding a member auto-creates FITUP user data row + FITUP ID.
   */
  const addGymMemberToFitup = useCallback((registeredGymId, payload) => {
    const p = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
    const name = String(p.name || '').trim();
    const email = String(p.email || '').trim();
    if (!name || !email) return null;
    const partnerGymId = String(p.partnerGymId || '').trim() || null;
    const linkedFromPartner =
      partnerGymId && partnerGyms.find((g) => g.id === partnerGymId)?.linkedGymId;
    const regGym =
      String(linkedFromPartner || registeredGymId || '').trim() || null;
    let created = null;
    setUsers((prev) => {
      const row = {
        id: uid(),
        fitupUserId: nextFitupUserId(prev),
        name,
        email,
        registeredGymId: regGym,
        partnerGymId,
        profile: {
          phone: String(p.phone || '').trim(),
          city: String(p.city || '').trim(),
          address: String(p.address || '').trim(),
          dateOfBirth: String(p.dateOfBirth || '').trim(),
          emergencyContact: String(p.emergencyContact || '').trim(),
          emergencyPhone: String(p.emergencyPhone || '').trim(),
          goals: String(p.goals || '').trim(),
          medicalNotes: String(p.medicalNotes || '').trim(),
          weight: String(p.weight || '').trim(),
          height: String(p.height || '').trim(),
          coachId: String(p.coachId || '').trim(),
          coachName: String(p.coachName || '').trim(),
          coachEmail: String(p.coachEmail || '').trim(),
          coachPhone: String(p.coachPhone || '').trim(),
          coachSpecialty: String(p.coachSpecialty || '').trim(),
          coachSessionsPerWeek: Number(p.coachSessionsPerWeek) || 0,
          coachRating: Number(p.coachRating) || 0,
          coachTotalSessions: Number(p.coachTotalSessions) || 0,
          coachBio: String(p.coachBio || '').trim(),
          coachExperience: String(p.coachExperience || '').trim(),
          coachAvailability: String(p.coachAvailability || '').trim(),
          coachCertifications: Array.isArray(p.coachCertifications)
            ? p.coachCertifications
                .map((c) => ({
                  id: String(c?.id || uid()),
                  name: String(c?.name || '').trim(),
                  imageUrl: String(c?.imageUrl || '').trim(),
                }))
                .filter((c) => c.name || c.imageUrl)
            : [],
          preferredCoach: String(p.preferredCoach || p.coachName || '').trim(),
          membershipType: String(p.membershipType || 'Basic').trim(),
          sessionsLeft: Number(p.sessionsLeft) || 0,
          membershipPricePaid: Number(p.membershipPricePaid) || 0,
          membershipCurrency: String(p.membershipCurrency || 'USD').trim(),
          membershipPaymentStatus: String(p.membershipPaymentStatus || 'unpaid').trim(),
          membershipExpiryDate: String(p.membershipExpiryDate || '').trim(),
          membershipPaymentMethod: String(p.membershipPaymentMethod || '').trim(),
          memberStatus: String(p.memberStatus || 'pending').trim(),
          memberComplaints: Array.isArray(p.memberComplaints) ? p.memberComplaints : [],
          memberActionHistory: Array.isArray(p.memberActionHistory)
            ? p.memberActionHistory
            : [],
          memberHistory: Array.isArray(p.memberHistory) ? p.memberHistory : [],
          joinedFrom: String(p.joinedFrom || 'Gym invite').trim(),
          trainingRoutine: String(p.trainingRoutine || '').trim(),
          nutritionProgram: String(p.nutritionProgram || '').trim(),
          programsUpdatedAt: String(p.programsUpdatedAt || '').trim(),
          programsUpdatedByCoachName: String(p.programsUpdatedByCoachName || '').trim(),
          programsNeedReview: Boolean(p.programsNeedReview),
        },
        status: 'active',
        createdAt: new Date().toISOString(),
        signedInOnSite: false,
        lastSiteVisitAt: '',
        lastPageViewed: '',
        sitePageViews7d: 0,
      };
      if (!row.profile.coachId && (row.profile.coachName || row.profile.coachEmail)) {
        row.profile.coachId = nextOrgCoachId(prev, regGym || partnerGymId || 'g1');
      }
      created = row;
      return normalizeUsersCoachIds([row, ...prev]);
    });
    return created;
  }, [partnerGyms]);

  const updateGym = useCallback((id, patch) => {
    setGyms((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...patch } : g))
    );
  }, []);

  const deleteGym = useCallback((id) => {
    setGyms((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const recordEmployeeActivity = useCallback(
    (action, detail = '', options = {}) => {
      const actorName = String(options.employeeName || authUser || 'Admin').trim() || 'Admin';
      const actor = employees.find(
        (e) => String(e.name || '').trim().toLowerCase() === actorName.toLowerCase()
      );
      setEmployeeActivity((prev) => [
        {
          id: uid(),
          employeeId: actor?.id || '',
          employeeName: actorName,
          action: String(action || 'Dashboard action'),
          detail: String(detail || ''),
          at: new Date().toISOString(),
        },
        ...prev,
      ]);
    },
    [authUser, employees]
  );

  const addEmployee = useCallback(
    (payload) => {
      const p = payload && typeof payload === 'object' ? payload : {};
      const name = String(p.name || '').trim();
      const email = String(p.email || '').trim().toLowerCase();
      if (!name || !email) return null;
      const role = ['super_admin', 'admin', 'manager', 'user'].includes(p.role)
        ? p.role
        : 'user';
      const row = {
        id: uid(),
        employeeCode: nextEmployeeCode(employees),
        name,
        email,
        role,
        status: p.status === 'inactive' ? 'inactive' : 'active',
        canManageDashboard: p.canManageDashboard !== false,
        createdAt: new Date().toISOString(),
        lastActiveAt: '',
      };
      setEmployees((prev) => [row, ...prev]);
      recordEmployeeActivity(
        'Added employee',
        `${name} was added as ${role.replace('_', ' ')}.`,
        { employeeName: authUser || 'Admin' }
      );
      return row;
    },
    [authUser, employees, recordEmployeeActivity]
  );

  const updateEmployee = useCallback(
    (id, patch) => {
      const p = patch && typeof patch === 'object' ? patch : {};
      const prevRow = employees.find((e) => e.id === id);
      setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...p } : e)));
      if (!prevRow) return;
      if (p.role && p.role !== prevRow.role) {
        recordEmployeeActivity(
          'Updated employee role',
          `${prevRow.name} role changed to ${String(p.role).replace('_', ' ')}.`,
          { employeeName: authUser || 'Admin' }
        );
      }
      if (p.status && p.status !== prevRow.status) {
        recordEmployeeActivity(
          'Updated employee status',
          `${prevRow.name} status changed to ${p.status}.`,
          { employeeName: authUser || 'Admin' }
        );
      }
    },
    [authUser, employees, recordEmployeeActivity]
  );

  const addEquipmentItem = useCallback(
    (payload) => {
      const p = payload && typeof payload === 'object' ? payload : {};
      const name = String(p.name || '').trim();
      const branchId = String(p.branchId || '').trim();
      if (!name || !branchId) return null;
      const row = {
        id: uid(),
        branchId,
        name,
        quantity: Math.max(1, Number(p.quantity) || 1),
        hasEquipment: p.hasEquipment !== false,
        underMaintenance: !!p.underMaintenance,
        needOneMore: !!p.needOneMore,
        needChange: !!p.needChange,
        complaint: !!p.complaint,
        complaintText: String(p.complaintText || '').trim(),
        updatedAt: new Date().toISOString(),
      };
      setEquipmentInventory((prev) => [row, ...prev]);
      recordEmployeeActivity('Added equipment', `${name} added to equipment list.`, {
        employeeName: authUser || 'Admin',
      });
      return row;
    },
    [authUser, recordEmployeeActivity]
  );

  const updateEquipmentItem = useCallback(
    (id, patch) => {
      const p = patch && typeof patch === 'object' ? patch : {};
      let changedName = '';
      setEquipmentInventory((prev) =>
        prev.map((row) => {
          if (row.id !== id) return row;
          changedName = row.name;
          const safePatch = { ...p };
          if (Object.prototype.hasOwnProperty.call(safePatch, 'quantity')) {
            safePatch.quantity = Math.max(0, Number(safePatch.quantity) || 0);
          }
          return { ...row, ...safePatch, updatedAt: new Date().toISOString() };
        })
      );
      if (changedName) {
        recordEmployeeActivity('Updated equipment status', `${changedName} status was updated.`, {
          employeeName: authUser || 'Admin',
        });
      }
    },
    [authUser, recordEmployeeActivity]
  );

  const addGymFacility = useCallback(
    (payload) => {
      const p = payload && typeof payload === 'object' ? payload : {};
      const name = String(p.name || '').trim();
      const branchId = String(p.branchId || '').trim();
      if (!name || !branchId) return null;
      const row = {
        id: uid(),
        branchId,
        name,
        schedule: String(p.schedule || '').trim(),
        price: Math.max(0, Number(p.price) || 0),
        currency: String(p.currency || 'USD').trim(),
        status: ['active', 'maintenance', 'closed'].includes(p.status) ? p.status : 'active',
        notes: String(p.notes || '').trim(),
      };
      setGymFacilities((prev) => [row, ...prev]);
      recordEmployeeActivity('Added facility', `${name} added to facilities.`, {
        employeeName: authUser || 'Admin',
      });
      return row;
    },
    [authUser, recordEmployeeActivity]
  );

  const updateGymFacility = useCallback(
    (id, patch) => {
      const p = patch && typeof patch === 'object' ? patch : {};
      let facilityName = '';
      setGymFacilities((prev) =>
        prev.map((row) => {
          if (row.id !== id) return row;
          facilityName = row.name;
          return { ...row, ...p };
        })
      );
      if (facilityName) {
        recordEmployeeActivity('Updated facility', `${facilityName} details updated.`, {
          employeeName: authUser || 'Admin',
        });
      }
    },
    [authUser, recordEmployeeActivity]
  );

  const addFacilityBookingRequest = useCallback(
    (payload) => {
      const p = payload && typeof payload === 'object' ? payload : {};
      const selectedUser =
        users.find((u) => String(u.id || '') === String(p.memberId || '')) ||
        users.find((u) => String(u.fitupUserId || '') === String(p.memberUserId || ''));
      const paidOnline = !!p.paidOnline || String(p.paymentMethod || '').toLowerCase() === 'online';
      const row = {
        id: uid(),
        branchId: String(p.branchId || '').trim(),
        facilityId: String(p.facilityId || '').trim(),
        memberName: String(p.memberName || selectedUser?.name || '').trim(),
        memberUserId: String(p.memberUserId || selectedUser?.fitupUserId || '').trim(),
        requestedSlot: String(p.requestedSlot || '').trim(),
        status: paidOnline ? 'approved' : 'pending',
        paymentMethod: paidOnline ? 'online' : String(p.paymentMethod || 'cash').trim(),
        paidOnline,
        note: String(p.note || '').trim(),
        createdAt: new Date().toISOString(),
      };
      if (!row.branchId || !row.facilityId || !row.memberName || !row.requestedSlot) return null;
      setFacilityBookingRequests((prev) => [row, ...prev]);
      recordEmployeeActivity('Created facility booking request', `${row.memberName} request added.`, {
        employeeName: authUser || 'Admin',
      });
      return row;
    },
    [authUser, recordEmployeeActivity, users]
  );

  const submitFacilityBookingFromApplication = useCallback(
    (payload) => {
      const p = payload && typeof payload === 'object' ? payload : {};
      const selectedUser =
        users.find((u) => String(u.id || '') === String(p.memberId || '')) ||
        users.find((u) => String(u.fitupUserId || '') === String(p.memberUserId || ''));
      if (!selectedUser) return null;
      const paidOnline = !!p.paidOnline || String(p.paymentMethod || '').toLowerCase() === 'online';
      const row = {
        id: uid(),
        branchId: String(p.branchId || selectedUser.partnerGymId || '').trim(),
        facilityId: String(p.facilityId || '').trim(),
        memberName: String(selectedUser.name || '').trim(),
        memberUserId: String(selectedUser.fitupUserId || selectedUser.id || '').trim(),
        requestedSlot: String(p.requestedSlot || '').trim(),
        status: paidOnline ? 'approved' : 'pending',
        paymentMethod: paidOnline ? 'online' : String(p.paymentMethod || 'cash').trim(),
        paidOnline,
        note: String(p.note || '').trim(),
        source: 'application',
        createdAt: new Date().toISOString(),
      };
      if (!row.branchId || !row.facilityId || !row.requestedSlot) return null;
      setFacilityBookingRequests((prev) => [row, ...prev]);
      recordEmployeeActivity(
        'Facility booking from application',
        `${row.memberName} submitted a facility booking from app.`,
        { employeeName: authUser || 'Admin' }
      );
      return row;
    },
    [authUser, recordEmployeeActivity, users]
  );

  const updateFacilityBookingRequest = useCallback(
    (id, patch) => {
      const p = patch && typeof patch === 'object' ? patch : {};
      let reqMember = '';
      setFacilityBookingRequests((prev) =>
        prev.map((row) => {
          if (row.id !== id) return row;
          reqMember = row.memberName;
          return { ...row, ...p };
        })
      );
      if (reqMember && p.status) {
        recordEmployeeActivity(
          'Updated facility request',
          `${reqMember} request marked ${p.status}.`,
          { employeeName: authUser || 'Admin' }
        );
      }
    },
    [authUser, recordEmployeeActivity]
  );

  const updateMessage = useCallback((id, patch) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...patch } : m))
    );
  }, []);

  /**
   * Simulates sending a dashboard reply (email or in-app chat).
   * Hook to your backend provider (SES/SendGrid/etc) when needed.
   */
  const sendMessageReply = useCallback((id, body, options = {}) => {
    const text = String(body || '').trim();
    if (!text) return;
    const channel = options.channel === 'chat' ? 'chat' : 'email';
    const employeeName = String(options.employeeName || authUser || 'Admin').trim() || 'Admin';
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const entry = {
          id: uid(),
          channel,
          to: channel === 'email' ? m.userEmail || '' : '',
          employeeName,
          body: text,
          sentAt: new Date().toISOString(),
        };
        return {
          ...m,
          status: 'read',
          replyStatus: 'sent',
          lastReplyAt: entry.sentAt,
          replyHistory: [entry, ...(Array.isArray(m.replyHistory) ? m.replyHistory : [])],
        };
      })
    );
    recordEmployeeActivity(
      'Sent message reply',
      `Replied via ${channel} to message ${id}.`,
      { employeeName }
    );
  }, [authUser, recordEmployeeActivity]);

  const startCoachClientThread = useCallback(
    (clientInternalId, openingMessage) => {
      const uidClient = String(clientInternalId || '').trim();
      const text = String(openingMessage || '').trim();
      if (!uidClient || !text) return null;
      if (authRole !== 'coach') return null;
      const u = users.find((x) => String(x.id) === uidClient);
      if (!u) return null;
      if (!memberInCoachBranch(u, coachSession, partnerGyms)) return null;
      if (!isMemberAssignedToCoach(u, coachSession)) return null;
      const coachName = String(authUser || 'Coach').trim() || 'Coach';
      const now = new Date().toISOString();
      const row = {
        id: `cmsg-${uid()}`,
        coachThread: true,
        userId: u.id,
        userName: u.name,
        userEmail: u.email || '',
        message: '',
        createdAt: now,
        status: 'read',
        replyStatus: 'sent',
        replyHistory: [
          {
            id: uid(),
            channel: 'chat',
            to: '',
            employeeName: coachName,
            body: text,
            sentAt: now,
          },
        ],
        memberChatTail: [],
      };
      setMessages((prev) => [row, ...prev]);
      recordEmployeeActivity(
        'Coach started client chat',
        `Thread with ${u.name} (${u.fitupUserId || u.id}).`,
        { employeeName: coachName }
      );
      return row.id;
    },
    [authRole, authUser, coachSession, partnerGyms, users, recordEmployeeActivity]
  );

  const appendMemberChatMessage = useCallback((messageId, body) => {
    const text = String(body || '').trim();
    if (!text) return;
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const tail = Array.isArray(m.memberChatTail) ? m.memberChatTail : [];
        return {
          ...m,
          memberChatTail: [
            ...tail,
            { id: uid(), body: text, sentAt: new Date().toISOString() },
          ],
        };
      })
    );
  }, []);

  const updatePartnership = useCallback((id, patch) => {
    setPartnerships((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
    );
  }, []);

  const updatePartnerApplicationSubmission = useCallback((id, patch) => {
    setPartnerApplicationSubmissions((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row))
    );
  }, []);

  /** Call from your API when the marketing site submits the partner form (FormData / JSON). */
  const addPartnerApplicationSubmission = useCallback((fields) => {
    const f =
      fields && typeof fields === 'object' && !Array.isArray(fields) ? fields : {};
    setPartnerApplicationSubmissions((prev) => [
      {
        id: uid(),
        submittedAt: new Date().toISOString(),
        status: 'new',
        fields: f,
      },
      ...prev,
    ]);
  }, []);

  const updatePartnerGym = useCallback((id, patch) => {
    const p = patch && typeof patch === 'object' && !Array.isArray(patch) ? patch : {};
    setPartnerGyms((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const next = { ...row, ...p };
        if (next.contractSigned) {
          if (!next.contractSignedAt) next.contractSignedAt = new Date().toISOString();
        } else {
          next.contractSignedAt = '';
          if (next.onboardingStatus !== 'pending') next.onboardingStatus = 'pending';
        }
        return next;
      })
    );
  }, []);

  const addPartnerGym = useCallback((partial = {}) => {
    const p =
      partial && typeof partial === 'object' && !Array.isArray(partial)
        ? partial
        : {};
    const brandName = String(p.brandName || 'New branch').trim() || 'New branch';
    const next = {
      id: uid(),
      gymAccountId: createGymAccountId(),
      sourceSubmissionId: '',
      legalName: String(p.legalName || brandName).trim(),
      brandName,
      linkedGymId: String(p.linkedGymId || '').trim(),
      branchAddress: String(p.branchAddress || '').trim(),
      branchMembers: Number(p.branchMembers) || 0,
      branchCoaches: Number(p.branchCoaches) || 0,
      website: String(p.website || '').trim(),
      contactName: String(p.contactName || '').trim(),
      contactEmail: String(p.contactEmail || '').trim(),
      contactPhone: String(p.contactPhone || '').trim(),
      companySize: String(p.companySize || '').trim(),
      locationsPlanned: Number(p.locationsPlanned) || 1,
      billingAmount: Number(p.billingAmount) || 0,
      billingCurrency: p.billingCurrency || 'USD',
      billingCycle: p.billingCycle || 'monthly',
      paymentMethod: p.paymentMethod || 'bank_transfer',
      paymentStatus: p.paymentStatus || 'pending',
      hasEms: !!p.hasEms,
      contractSigned: !!p.contractSigned,
      contractSignedAt: p.contractSigned ? new Date().toISOString() : '',
      contractStart: String(p.contractStart || '').trim(),
      contractEnd: String(p.contractEnd || '').trim(),
      contractFileName: '',
      contractFileDataUrl: '',
      contractDraft: '',
      onboardingStatus: p.contractSigned ? p.onboardingStatus || 'active' : 'pending',
      managerName: String(p.managerName || '').trim(),
      openingHours: String(p.openingHours || '').trim(),
      monthlyRevenue: Number(p.monthlyRevenue) || 0,
      facilities: String(p.facilities || '').trim(),
      branchEquipment: String(p.branchEquipment || '').trim(),
      gymSpaceSqft: Number(p.gymSpaceSqft) || 0,
      classroomCount: Number(p.classroomCount) || 0,
      classroomSpaceSqft: Number(p.classroomSpaceSqft) || 0,
      capacity: Number(p.capacity) || 0,
      yearEstablished: Number(p.yearEstablished) || 0,
      notes: String(p.notes || '').trim(),
      paymentHistory: [],
      createdAt: new Date().toISOString(),
    };
    setPartnerGyms((prev) => [...prev, next]);
    return next;
  }, []);

  const addPartnerGymPayment = useCallback((gymId, payment) => {
    if (!payment || typeof payment !== 'object' || Array.isArray(payment)) return;
    const record = {
      id: uid(),
      amount: Number(payment.amount) || 0,
      currency: payment.currency || 'USD',
      paidAt: payment.paidAt || new Date().toISOString().slice(0, 10),
      method: payment.method || 'bank_transfer',
      referenceText: payment.referenceText || payment.reference || '',
      referenceImageUrl: payment.referenceImageUrl || '',
      note: payment.note || '',
    };
    setPartnerGyms((prev) =>
      prev.map((row) =>
        row.id === gymId
          ? {
              ...row,
              paymentHistory: [record, ...(Array.isArray(row.paymentHistory) ? row.paymentHistory : [])],
              paymentStatus: 'paid',
            }
          : row
      )
    );
  }, []);

  const onboardSubmissionToPartnerGym = useCallback(
    (submissionId, profile) => {
      const submission = partnerApplicationSubmissions.find(
        (s) => s.id === submissionId
      );
      if (!submission) return null;
      const f =
        submission.fields &&
        typeof submission.fields === 'object' &&
        !Array.isArray(submission.fields)
          ? submission.fields
          : {};
      const p =
        profile && typeof profile === 'object' && !Array.isArray(profile)
          ? profile
          : {};
      const next = {
        id: uid(),
        gymAccountId: createGymAccountId(),
        sourceSubmissionId: submissionId,
        legalName: p.legalName || f.companyName || '',
        brandName: p.brandName || f.companyName || '',
        linkedGymId: String(p.linkedGymId || '').trim(),
        website: p.website || f.website || '',
        contactName: p.contactName || f.fullName || '',
        contactEmail: p.contactEmail || f.email || '',
        contactPhone: p.contactPhone || f.phone || '',
        companySize: p.companySize || f.companySize || '',
        locationsPlanned: Number(p.locationsPlanned) || 1,
        billingAmount: Number(p.billingAmount) || 0,
        billingCurrency: p.billingCurrency || 'USD',
        billingCycle: p.billingCycle || 'monthly',
        paymentMethod: p.paymentMethod || 'bank_transfer',
        paymentStatus: p.paymentStatus || 'pending',
        hasEms: !!p.hasEms,
        contractSigned: !!p.contractSigned,
        contractSignedAt: p.contractSigned ? new Date().toISOString() : '',
        contractStart: p.contractStart || '',
        contractEnd: p.contractEnd || '',
        contractFileName: p.contractFileName || '',
        contractFileDataUrl: p.contractFileDataUrl || '',
        contractDraft: String(p.contractDraft || '').trim(),
        onboardingStatus: p.onboardingStatus || 'active',
        notes: p.notes || '',
        branchAddress: String(p.branchAddress || '').trim(),
        branchMembers: Number(p.branchMembers) || 0,
        branchCoaches: Number(p.branchCoaches) || 0,
        managerName: String(p.managerName || '').trim(),
        openingHours: String(p.openingHours || '').trim(),
        monthlyRevenue: Number(p.monthlyRevenue) || 0,
        facilities: String(p.facilities || '').trim(),
        branchEquipment: String(p.branchEquipment || '').trim(),
        gymSpaceSqft: Number(p.gymSpaceSqft) || 0,
        classroomCount: Number(p.classroomCount) || 0,
        classroomSpaceSqft: Number(p.classroomSpaceSqft) || 0,
        capacity: Number(p.capacity) || 0,
        yearEstablished: Number(p.yearEstablished) || 0,
        paymentHistory: [],
        createdAt: new Date().toISOString(),
      };
      if (!next.contractSigned) return null;
      setPartnerGyms((prev) => [next, ...prev]);
      setPartnerApplicationSubmissions((prev) =>
        prev.map((row) =>
          row.id === submissionId
            ? { ...row, status: 'accepted', linkedGymAccountId: next.gymAccountId }
            : row
        )
      );
      return next;
    },
    [partnerApplicationSubmissions]
  );

  const convertPartnershipToGym = useCallback((partnershipId) => {
    const p = partnerships.find((x) => x.id === partnershipId);
    if (!p || p.convertedToGymId) return;
    const newGym = {
      id: uid(),
      name: p.gymName,
      location: 'TBD',
      branches: Number(p.locations) || 1,
      status: 'pending',
      createdAt: p.createdAt || new Date().toISOString(),
    };
    setGyms((prev) => [newGym, ...prev]);
    setPartnerships((prev) =>
      prev.map((x) =>
        x.id === partnershipId
          ? { ...x, status: 'approved', convertedToGymId: newGym.id }
          : x
      )
    );
  }, [partnerships]);

  const updateContentRow = useCallback((id, patch) => {
    setContent((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const next = { ...row, ...patch };
        if (patch.seo && typeof patch.seo === 'object') {
          next.seo = { ...row.seo, ...patch.seo };
        }
        if (patch.seoAr && typeof patch.seoAr === 'object') {
          next.seoAr = { ...row.seoAr, ...patch.seoAr };
        }
        return normalizeContentRow(next);
      })
    );
  }, []);

  const saveContentDraft = useCallback(() => {
    setContentSaveStatus('saving');
    const t = setTimeout(() => {
      setContentSaveStatus('saved');
      setTimeout(() => setContentSaveStatus('idle'), 2000);
    }, 450);
    return () => clearTimeout(t);
  }, []);

  const updateSeoRow = useCallback((id, patch) => {
    setSeo((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row))
    );
  }, []);

  const updateSettings = useCallback((patch) => {
    setSettings((prev) => ({ ...prev, ...patch }));
    recordEmployeeActivity('Updated settings', 'Changed dashboard settings.', {
      employeeName: authUser || 'Admin',
    });
  }, [authUser, recordEmployeeActivity]);

  const updateAnalyticsSnapshot = useCallback((patch) => {
    setAnalytics((prev) => ({ ...prev, ...patch }));
  }, []);

  const upsertGymClass = useCallback((payload) => {
    const p = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
    const clean = {
      name: String(p.name || '').trim(),
      description: String(p.description || '').trim(),
      coach: String(p.coach || '').trim(),
      room: String(p.room || '').trim(),
      schedule: String(p.schedule || '').trim(),
      duration: String(p.duration || '').trim(),
      enrolled: Math.max(0, Number(p.enrolled) || 0),
      capacity: Math.max(1, Number(p.capacity) || 1),
      price: Math.max(0, Number(p.price) || 0),
    };
    if (!clean.name || !clean.coach) return;
    if (p.id) {
      setGymClasses((prev) =>
        prev.map((row) => (row.id === p.id ? { ...row, ...clean } : row))
      );
      return;
    }
    setGymClasses((prev) => [{ id: uid(), ...clean }, ...prev]);
  }, []);

  const deleteGymClass = useCallback((id) => {
    setGymClasses((prev) => prev.filter((row) => row.id !== id));
  }, []);

  const setGymClassEnrollment = useCallback((className, enrolledCount) => {
    const key = String(className || '').trim().toLowerCase();
    if (!key) return;
    const next = Math.max(0, Number(enrolledCount) || 0);
    setGymClasses((prev) =>
      prev.map((row) =>
        String(row.name || '').trim().toLowerCase() === key
          ? { ...row, enrolled: next }
          : row
      )
    );
  }, []);

  const syncCoachSessionsPerWeek = useCallback((sessionsByCoach = {}) => {
    const map = sessionsByCoach && typeof sessionsByCoach === 'object' ? sessionsByCoach : {};
    setUsers((prev) =>
      prev.map((u) => {
        const profile = u.profile || {};
        const idKey = String(profile.coachId || '').trim().toLowerCase();
        const nameKey = String(profile.coachName || '').trim().toLowerCase();
        const nextById = idKey ? map[idKey] : undefined;
        const nextByName = nameKey ? map[nameKey] : undefined;
        const next = Number(nextById ?? nextByName);
        if (!Number.isFinite(next)) return u;
        return {
          ...u,
          profile: {
            ...profile,
            coachSessionsPerWeek: Math.max(0, next),
          },
        };
      })
    );
  }, []);

  const completeAuthSession = useCallback((role, name, nextCoachSession) => {
      setIsAuthenticated(true);
      setAuthUser(name);
      setAuthRole(role);
      setCoachSession(nextCoachSession);
      setEmployees((prev) =>
        prev.map((e) =>
          String(e.name || '').trim().toLowerCase() === name.trim().toLowerCase()
            ? { ...e, lastActiveAt: new Date().toISOString() }
            : e
        )
      );
      setEmployeeActivity((prev) => [
        {
          id: uid(),
          employeeId: '',
          employeeName: name,
          action: 'Signed in',
          detail: 'Logged into dashboard.',
          at: new Date().toISOString(),
        },
        ...prev,
      ]);
      try {
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem('fitup_admin_auth', '1');
          window.sessionStorage.setItem('fitup_admin_user', name);
          window.sessionStorage.setItem('fitup_auth_role', role);
          if (nextCoachSession) {
            window.sessionStorage.setItem(
              'fitup_coach_session',
              JSON.stringify(nextCoachSession)
            );
          } else {
            window.sessionStorage.removeItem('fitup_coach_session');
          }
        }
      } catch {
        // Ignore storage issues in restricted environments.
      }
  }, []);

  const normalizeDemoRole = useCallback((demo) => {
    const id = String(demo?.id || '').trim().toLowerCase();
    if (id === 'fitup') return 'fitup';
    if (id === 'gym') return 'gym';
    if (id === 'coach') return 'coach';
    return String(demo?.role || 'admin').trim().toLowerCase() || 'admin';
  }, []);

  const login = useCallback(
    (email, password, gymId = '') => {
      const em = String(email || '').trim().toLowerCase();
      const pw = String(password || '');
      const gid = String(gymId || '').trim().toLowerCase();
      const demo = Array.isArray(settings.demoAccounts)
        ? settings.demoAccounts.find(
            (d) =>
              em === String(d.email || '').trim().toLowerCase() &&
              pw === String(d.password || '')
          )
        : null;
      const demoRole = normalizeDemoRole(demo);
      if (demoRole === 'gym' && gid !== String(demo?.gymId || '').trim().toLowerCase()) {
        return false;
      }
      const adminOk =
        em === String(settings.email || '').trim().toLowerCase() &&
        pw === String(settings.adminPassword || 'admin123');
      if (!demo && !adminOk) return false;
      const role = demo ? demoRole : 'admin';
      const name =
        role === 'coach'
          ? String(demo.coachName || demo.label || 'Coach').trim()
          : demo?.label || String(settings.adminName || 'Admin');
      const nextCoachSession =
        role === 'coach'
          ? {
              coachId: String(demo.coachId || '').trim(),
              coachName: String(demo.coachName || '').trim(),
              coachEmail: String(demo.coachEmail || '').trim(),
              partnerGymId: String(demo.partnerGymId || '').trim(),
              registeredGymId: String(demo.registeredGymId || '').trim(),
            }
          : null;
      completeAuthSession(role, name, nextCoachSession);
      return true;
    },
    [
      settings.adminName,
      settings.adminPassword,
      settings.demoAccounts,
      settings.email,
      completeAuthSession,
      normalizeDemoRole,
    ]
  );

  const loginDemoById = useCallback(
    (demoId) => {
      const id = String(demoId || '').trim();
      if (!id) return false;
      const demo = Array.isArray(settings.demoAccounts)
        ? settings.demoAccounts.find((d) => String(d.id || '').trim() === id)
        : null;
      if (!demo) return false;
      const role = normalizeDemoRole(demo);
      const name =
        role === 'coach'
          ? String(demo.coachName || demo.label || 'Coach').trim()
          : demo.label || String(settings.adminName || 'Admin');
      const nextCoachSession =
        role === 'coach'
          ? {
              coachId: String(demo.coachId || '').trim(),
              coachName: String(demo.coachName || '').trim(),
              coachEmail: String(demo.coachEmail || '').trim(),
              partnerGymId: String(demo.partnerGymId || '').trim(),
              registeredGymId: String(demo.registeredGymId || '').trim(),
            }
          : null;
      completeAuthSession(role, name, nextCoachSession);
      return true;
    },
    [settings.adminName, settings.demoAccounts, completeAuthSession, normalizeDemoRole]
  );

  const logout = useCallback(() => {
    const name = authUser || 'Admin';
    setEmployeeActivity((prev) => [
      {
        id: uid(),
        employeeId: '',
        employeeName: name,
        action: 'Signed out',
        detail: 'Logged out from dashboard.',
        at: new Date().toISOString(),
      },
      ...prev,
    ]);
    setIsAuthenticated(false);
    setAuthUser('');
    setAuthRole('admin');
    setCoachSession(null);
    try {
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem('fitup_admin_auth');
        window.sessionStorage.removeItem('fitup_admin_user');
        window.sessionStorage.removeItem('fitup_auth_role');
        window.sessionStorage.removeItem('fitup_coach_session');
      }
    } catch {
      // Ignore storage issues in restricted environments.
    }
  }, [authUser]);

  const kpi = useMemo(() => {
    const activeGyms = gyms.filter((g) => g.status === 'active').length;
    const totalPartnerships = partnerships.length;
    const partnershipPending = partnerships.filter(
      (p) => p.status === 'pending'
    ).length;
    const partnershipApproved = partnerships.filter(
      (p) => p.status === 'approved'
    ).length;
    const partnershipConverted = partnerships.filter(
      (p) => p.convertedToGymId
    ).length;
    const partnershipLocations = partnerships.reduce(
      (sum, p) => sum + (Number(p.locations) || 0),
      0
    );
    const signedInOnSiteCount = users.filter((u) => u.signedInOnSite).length;
    const visitedSite7d = users.filter(
      (u) => (u.sitePageViews7d || 0) > 0
    ).length;
    const monthlyRecurringRevenue = partnerGyms.reduce(
      (sum, g) =>
        sum +
        (g.billingCycle === 'monthly'
          ? Number(g.billingAmount) || 0
          : (Number(g.billingAmount) || 0) / 12),
      0
    );
    return {
      totalUsers: users.length,
      activeGyms,
      totalPartnerships,
      partnershipPending,
      partnershipApproved,
      partnershipConverted,
      partnershipLocations,
      websiteViews: analytics.visits,
      usersSignedInOnSite: signedInOnSiteCount,
      usersWithSiteViews7d: visitedSite7d,
      partnerGymsTotal: partnerGyms.length,
      partnerGymsMrr: Math.round(monthlyRecurringRevenue),
    };
  }, [users, gyms, partnerships, analytics.visits, partnerGyms]);

  const value = useMemo(
    () => ({
      users,
      anonymousSiteSessions,
      gyms,
      messages,
      employees,
      employeeActivity,
      equipmentInventory,
      gymFacilities,
      facilityBookingRequests,
      partnerships,
      partnerApplicationSubmissions,
      partnerGyms,
      bookings,
      gymClasses,
      content,
      seo,
      analytics,
      settings,
      isAuthenticated,
      authUser,
      authRole,
      coachSession,
      contentSaveStatus,
      kpi,
      login,
      loginDemoById,
      logout,
      updateUser,
      deleteUser,
      restrictUser,
      unrestrictUser,
      fileUserComplaint,
      moderateCoach,
      updateCoachProfile,
      addGymMemberToFitup,
      updateGym,
      deleteGym,
      addEmployee,
      updateEmployee,
      recordEmployeeActivity,
      addEquipmentItem,
      updateEquipmentItem,
      addGymFacility,
      updateGymFacility,
      addFacilityBookingRequest,
      submitFacilityBookingFromApplication,
      updateFacilityBookingRequest,
      updateMessage,
      sendMessageReply,
      startCoachClientThread,
      appendMemberChatMessage,
      updatePartnership,
      updatePartnerApplicationSubmission,
      addPartnerApplicationSubmission,
      updatePartnerGym,
      addPartnerGym,
      setBookings,
      addPartnerGymPayment,
      onboardSubmissionToPartnerGym,
      convertPartnershipToGym,
      updateContentRow,
      saveContentDraft,
      updateSeoRow,
      updateSettings,
      updateAnalyticsSnapshot,
      upsertGymClass,
      deleteGymClass,
      setGymClassEnrollment,
      syncCoachSessionsPerWeek,
    }),
    [
      users,
      anonymousSiteSessions,
      gyms,
      messages,
      employees,
      employeeActivity,
      equipmentInventory,
      gymFacilities,
      facilityBookingRequests,
      partnerships,
      partnerApplicationSubmissions,
      partnerGyms,
      bookings,
      gymClasses,
      content,
      seo,
      analytics,
      settings,
      isAuthenticated,
      authUser,
      authRole,
      coachSession,
      contentSaveStatus,
      kpi,
      login,
      loginDemoById,
      logout,
      updateUser,
      deleteUser,
      restrictUser,
      unrestrictUser,
      fileUserComplaint,
      moderateCoach,
      updateCoachProfile,
      addGymMemberToFitup,
      updateGym,
      deleteGym,
      addEmployee,
      updateEmployee,
      recordEmployeeActivity,
      addEquipmentItem,
      updateEquipmentItem,
      addGymFacility,
      updateGymFacility,
      addFacilityBookingRequest,
      submitFacilityBookingFromApplication,
      updateFacilityBookingRequest,
      updateMessage,
      sendMessageReply,
      startCoachClientThread,
      appendMemberChatMessage,
      updatePartnership,
      updatePartnerApplicationSubmission,
      addPartnerApplicationSubmission,
      updatePartnerGym,
      addPartnerGym,
      setBookings,
      addPartnerGymPayment,
      onboardSubmissionToPartnerGym,
      convertPartnershipToGym,
      updateContentRow,
      saveContentDraft,
      updateSeoRow,
      updateSettings,
      updateAnalyticsSnapshot,
      upsertGymClass,
      deleteGymClass,
      setGymClassEnrollment,
      syncCoachSessionsPerWeek,
    ]
  );

  return (
    <FitupAdminContext.Provider value={value}>
      {children}
    </FitupAdminContext.Provider>
  );
}

export function useFitupAdmin() {
  const ctx = useContext(FitupAdminContext);
  if (!ctx) {
    throw new Error('useFitupAdmin must be used within FitupAdminProvider');
  }
  return ctx;
}
