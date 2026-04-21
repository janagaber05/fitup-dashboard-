import { useEffect, useMemo, useState } from 'react';
import { Toggle } from '../components/Ui';
import {
  ContentSectionForm,
  ContentSectionSeo,
} from '../components/ContentSectionForm';
import { useFitupAdmin } from '../components/FitupAdminContext';
import '../components/Ui.css';
import '../components/ContentSectionForm.css';
import './ContentPage.css';

function pageLabel(slug) {
  if (slug === 'global') {
    return 'Global (all pages)';
  }
  if (slug === 'contact') {
    return 'Contact';
  }
  if (slug === 'for_gyms') {
    return 'For gyms';
  }
  if (slug === 'app_experience') {
    return 'App experience';
  }
  if (slug === 'ar_training') {
    return 'AR training';
  }
  if (slug === 'join_us') {
    return 'Join us';
  }
  if (slug === 'security_trust') {
    return 'Security & trust';
  }
  if (slug === 'partnership') {
    return 'Partnership';
  }
  if (slug === 'platform') {
    return 'Platform';
  }
  return slug
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function sectionTitle(slug) {
  if (slug === 'partner_application_form') {
    return 'Partner application form';
  }
  return slug.replace(/_/g, ' ');
}

const SECTION_ICON = {
  hero: '★',
  engineered_performance: '⚙',
  ar_guidance: '◎',
  why_choose_us: '▤',
  how_it_works: '↪',
  philosophy_partners: '◆',
  closing_cta: '↑',
  footer: '≡',
  story: '📖',
  mission_values: '✦',
  team_intro: '👥',
  roadmap: '🗺',
  press: '📰',
  cta: '→',
  info: '📍',
  hours: '🕐',
  social_links: '🔗',
  trust_bar: '✓',
  value_props: '◇',
  featured_programs: '◎',
  testimonials: '💬',
  stats_row: '📊',
  newsletter: '✉',
  why_partner: '🤝',
  eligibility: '✓',
  process_steps: '↪',
  economics_teaser: '💡',
  challenges: '⚠',
  solutions: '▦',
  operational_benefits: '✦',
  revenue_impact: '📈',
  partner_cta: '↑',
  resources: '📎',
  form_copy: '📝',
  trust_badges: '🛡',
  plan_tiers: '$$',
  add_ons: '+',
  enterprise_blurb: '🏢',
  billing_faq: '?',
  guarantee: '✓',
  search_prompt: '⌕',
  categories: '▦',
  empty_state: '○',
  partner_strip: '★',
  top_questions: '?',
  still_need_help: '💬',
  contact_crosslink: '→',
  complete_journey: '↯',
  gym_onboarding: '▦',
  user_experience: '◎',
  smart_automation: '⚡',
  ai_training: '🤖',
  why_choose: '★',
  final_cta: '↑',
  intro_features: '▦',
  progress_tracking: '📈',
  booking_experience: '📅',
  coach_communication: '💬',
  ar_app_cta: '◎',
  core_features: '🎯',
  what_is_ar: '🧠',
  ar_timeline: '↕',
  safety_highlights: '🛡',
  how_clients_book: '📋',
  member_app_showcase: '📱',
  gym_control: '🎛',
  solution_pillars: '▦',
  automation_flow: '⚡',
  data_protection: '🔒',
  payment_security: '💳',
  privacy_first: '👁',
  trust_closing: '↑',
  pain_points: '⚠',
  our_mission: '✦',
  our_vision: '◎',
  about_closing: '→',
  partnership_inquiry: '🚀',
  partner_application_form: '📝',
  partnership_contact: '✉',
  platform_categories: '▦',
  latest_news: '📰',
  recommended_for_you: '▣',
  coming_soon_banner: '⏳',
};

function sectionIcon(slug) {
  return SECTION_ICON[slug] || '◇';
}

export default function ContentPage() {
  const {
    content,
    updateContentRow,
    saveContentDraft,
    contentSaveStatus,
  } = useFitupAdmin();

  const [search, setSearch] = useState('');
  const [activePage, setActivePage] = useState('about');
  const [activeSectionId, setActiveSectionId] = useState(null);
  const { grouped, pageKeys } = useMemo(() => {
    const g = content.reduce((acc, row) => {
      if (!acc[row.page]) acc[row.page] = [];
      acc[row.page].push(row);
      return acc;
    }, {});
    const keys = Object.keys(g).sort((a, b) => {
      if (a === 'global') return 1;
      if (b === 'global') return -1;
      return a.localeCompare(b);
    });
    return { grouped: g, pageKeys: keys };
  }, [content]);

  const visibleKeys = useMemo(
    () => (pageKeys.length ? pageKeys : ['about']),
    [pageKeys]
  );
  const currentPage = visibleKeys.includes(activePage) ? activePage : visibleKeys[0];
  const rowsForPage = useMemo(
    () => grouped[currentPage] || [],
    [grouped, currentPage]
  );

  const filteredSections = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rowsForPage;
    return rowsForPage.filter(
      (r) =>
        r.section.toLowerCase().includes(q) ||
        sectionTitle(r.section).toLowerCase().includes(q)
    );
  }, [rowsForPage, search]);

  useEffect(() => {
    setActivePage((p) => (visibleKeys.includes(p) ? p : visibleKeys[0]));
  }, [visibleKeys]);

  useEffect(() => {
    const first = filteredSections[0]?.id ?? rowsForPage[0]?.id ?? null;
    if (!first) {
      setActiveSectionId(null);
      return;
    }
    setActiveSectionId((id) => {
      if (id && filteredSections.some((r) => r.id === id)) return id;
      return first;
    });
  }, [currentPage, filteredSections, rowsForPage]);

  const activeRow =
    content.find((r) => r.id === activeSectionId) ||
    filteredSections[0] ||
    rowsForPage[0] ||
    null;

  const publish = () => {
    saveContentDraft();
  };

  return (
    <div className="contentPg contentPg--studio">
      <header className="contentPg__hero">
        <div className="contentPg__heroText">
          <h1>Website content</h1>
          <p>
            Manage page sections, partnership copy, and marketing landings. Each text field shows{' '}
            <strong>English</strong> first, then <strong>العربية</strong> underneath. The{' '}
            <strong>Global</strong> tab holds the site footer used on every route. Changes stay
            in this session until your API is connected.
          </p>
        </div>
        <div className="contentPg__heroActions">
          <div className="contentPg__status">
            {contentSaveStatus === 'saving' && (
              <span className="contentPg__pill">Publishing…</span>
            )}
            {contentSaveStatus === 'saved' && (
              <span className="contentPg__pill contentPg__pill--ok">Published</span>
            )}
          </div>
          <button
            type="button"
            className="contentPg__publish fu-btn fu-btn--primary"
            onClick={publish}
          >
            <span className="contentPg__publishIcon" aria-hidden>
              ↑
            </span>
            Publish changes
          </button>
        </div>
      </header>

      <div className="contentPg__toolbar">
        <div className="contentPg__search">
          <span className="contentPg__searchIcon" aria-hidden>
            ⌕
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sections…"
            aria-label="Search sections"
          />
        </div>
        <p className="contentPg__toolbarMeta">
          {pageKeys.length} pages · {content.length} sections
        </p>
      </div>

      <nav className="contentPg__tabs" aria-label="Website pages">
        {visibleKeys.map((page) => {
          const count = grouped[page]?.length ?? 0;
          return (
            <button
              key={page}
              type="button"
              className={`contentPg__tab ${currentPage === page ? 'contentPg__tab--active' : ''}`}
              onClick={() => {
                setActivePage(page);
                setSearch('');
              }}
            >
              <span className="contentPg__tabLabel">{pageLabel(page)}</span>
              <span className="contentPg__tabCount">{count}</span>
            </button>
          );
        })}
      </nav>

      <div className="contentPg__sectionBar">
        <div className="contentPg__sectionScroll" role="tablist" aria-label="Sections on this page">
          {filteredSections.map((row) => (
            <button
              key={row.id}
              type="button"
              role="tab"
              aria-selected={activeRow?.id === row.id}
              className={`contentPg__secTab ${activeRow?.id === row.id ? 'contentPg__secTab--active' : ''}`}
              onClick={() => setActiveSectionId(row.id)}
            >
              <span className="contentPg__secIcon" aria-hidden>
                {sectionIcon(row.section)}
              </span>
              <span className="contentPg__secLabel">{sectionTitle(row.section)}</span>
            </button>
          ))}
        </div>
      </div>

      {activeRow ? (
        <article className="contentPg__panel fu-card">
          <div className="contentPg__panelHead">
            <div>
              <h2 className="contentPg__panelTitle">
                {sectionTitle(activeRow.section)}
              </h2>
              <p className="contentPg__panelSlug">
                {activeRow.page}/{activeRow.section}
              </p>
            </div>
            <div className="contentPg__panelActions">
              <Toggle
                checked={activeRow.enabled}
                onChange={(v) => updateContentRow(activeRow.id, { enabled: v })}
                label={activeRow.enabled ? 'Visible on site' : 'Hidden'}
              />
            </div>
          </div>

          <ContentSectionForm
            sectionSlug={activeRow.section}
            dataJson={activeRow.dataJson}
            dataJsonAr={activeRow.dataJsonAr}
            onChangeDataJson={(next) =>
              updateContentRow(activeRow.id, { dataJson: next })
            }
            onChangeDataJsonAr={(next) =>
              updateContentRow(activeRow.id, { dataJsonAr: next })
            }
          />

          <ContentSectionSeo
            seo={activeRow.seo}
            seoAr={activeRow.seoAr}
            onChangeSeo={(next) => updateContentRow(activeRow.id, { seo: next })}
            onChangeSeoAr={(next) =>
              updateContentRow(activeRow.id, { seoAr: next })
            }
            pageLabelText={pageLabel(activeRow.page)}
            sectionLabelText={sectionTitle(activeRow.section)}
          />
        </article>
      ) : (
        <div className="contentPg__emptyState fu-card">
          <p>No sections match your search.</p>
        </div>
      )}
    </div>
  );
}
