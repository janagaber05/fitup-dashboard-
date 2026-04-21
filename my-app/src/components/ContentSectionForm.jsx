import { createContext, useContext, useId } from 'react';
import { Toggle } from './Ui';
import ImageUploadField from './ImageUploadField';
import VideoUploadField from './VideoUploadField';
import './ContentSectionForm.css';

const ContentFormSectionContext = createContext({ sectionSlug: '' });

const ITEM_AS_CARD_SECTIONS = new Set([
  'complete_journey',
  'gym_onboarding',
  'user_experience',
  'smart_automation',
  'ai_training',
  'value_props',
]);

function entrySingularNoun(fieldKey, sectionSlug) {
  const k = String(fieldKey).toLowerCase();
  if (k === 'cards') return 'Card';
  if (k === 'highlights') return 'Highlight';
  if (k === 'herostrip') return 'Hero stat';
  if (k === 'pills') return 'Pill';
  if (k === 'tabs') return 'Tab';
  if (k === 'metrics') return 'Metric';
  if (k === 'activityitems') return 'Activity';
  if (k === 'flowsteps') return 'Flow step';
  if (k === 'trustindicators') return 'Trust indicator';
  if (k === 'checklist') return 'Checklist item';
  if (k === 'phases') return 'Phase';
  if (k === 'footnotes') return 'Footnote';
  if (k === 'categorychips') return 'Category chip';
  if (k === 'tiles') return 'Tile';
  if (k === 'stats') return 'Stat';
  if (k === 'quotes') return 'Testimonial';
  if (k === 'tiers') return 'Plan';
  if (k === 'links') return 'Link';
  if (k === 'programs') return 'Program';
  if (k === 'steps') return 'Step';
  if (k === 'features') return 'Feature';
  if (k === 'items') {
    if (sectionSlug === 'coach_communication') return 'Step';
    if (ITEM_AS_CARD_SECTIONS.has(sectionSlug)) return 'Card';
    if (sectionSlug === 'top_questions' || sectionSlug === 'billing_faq') return 'Question';
    return 'Row';
  }
  return 'Entry';
}

function inferEmptyRowShapeTemplate(fieldKey, sectionSlug) {
  const k = String(fieldKey).toLowerCase();
  if (k === 'stats') {
    if (sectionSlug === 'revenue_impact') return { value: '', iconUrl: '', description: '' };
    return { value: '', description: '' };
  }
  if (k === 'quotes') return { name: '', text: '' };
  if (k === 'tiers') return { name: '', price: '', blurb: '' };
  if (k === 'links') return { label: '', url: '' };
  if (k === 'cards') {
    if (sectionSlug === 'challenges') return { title: '', subtitle: '' };
    if (sectionSlug === 'booking_experience') return { title: '', bullets: [], iconUrl: '' };
    if (sectionSlug === 'how_clients_book') return { n: '', iconUrl: '', title: '', description: '' };
    if (sectionSlug === 'safety_highlights') {
      return { backgroundImageUrl: '', title: '', description: '' };
    }
    if (sectionSlug === 'latest_news') {
      return {
        backgroundImageUrl: '',
        title: '',
        description: '',
        linkType: 'internal',
        linkHref: '',
      };
    }
    return { iconUrl: '', title: '', description: '' };
  }
  if (k === 'highlights') return { title: '' };
  if (k === 'herostrip') return { iconUrl: '', label: '' };
  if (k === 'pills') return { label: '' };
  if (k === 'tabs') return { label: '' };
  if (k === 'metrics') return { label: '', value: '' };
  if (k === 'activityitems') return { text: '' };
  if (k === 'flowsteps') return { iconUrl: '', label: '' };
  if (k === 'trustindicators') return { label: '' };
  if (k === 'checklist') return { label: '' };
  if (k === 'phases') return { phaseLabel: '', isActive: false, iconUrl: '', items: [] };
  if (k === 'footnotes') return { text: '' };
  if (k === 'categorychips') return { label: '', imageUrl: '' };
  if (k === 'tiles') return { imageUrl: '', title: '', linkType: 'internal', linkHref: '' };
  if (k === 'steps') {
    if (sectionSlug === 'how_it_works') return { n: '', title: '', body: '' };
    if (sectionSlug === 'ar_timeline') return { n: '', label: '', body: '', badgeSide: 'left' };
    return null;
  }
  if (k === 'features') {
    if (sectionSlug === 'engineered_performance') return { title: '', body: '' };
    if (sectionSlug === 'why_choose') return { iconUrl: '', title: '' };
    if (sectionSlug === 'member_app_showcase') return { iconUrl: '', title: '' };
    return { iconUrl: '', title: '', description: '' };
  }
  if (k === 'items') {
    if (sectionSlug === 'complete_journey') {
      return { iconUrl: '', headline: '', description: '' };
    }
    if (sectionSlug === 'smart_automation') {
      return { iconUrl: '', title: '', description: '' };
    }
    if (sectionSlug === 'top_questions' || sectionSlug === 'billing_faq') {
      return { q: '', a: '' };
    }
    if (sectionSlug === 'value_props') return { title: '', body: '' };
    if (sectionSlug === 'coach_communication') return { n: '', title: '' };
    return { iconUrl: '', title: '', description: '' };
  }
  return { title: '', body: '' };
}

function newObjectRowForArray(fieldKey, sectionSlug, enValue) {
  const tpl = inferEmptyRowShapeTemplate(fieldKey, sectionSlug);
  const first = enValue[0];
  if (first !== undefined && typeof first === 'object' && !Array.isArray(first)) {
    const row = emptyItemLike(first);
    if (tpl && typeof tpl === 'object') {
      for (const k of Object.keys(tpl)) {
        if (!(k in row)) {
          const v = tpl[k];
          if (typeof v === 'string') row[k] = '';
          else if (Array.isArray(v)) row[k] = [];
          else if (typeof v === 'boolean') row[k] = false;
          else if (typeof v === 'number') row[k] = 0;
          else if (v && typeof v === 'object') row[k] = emptyItemLike(v);
          else row[k] = '';
        }
      }
    }
    return row;
  }
  if (tpl === null) return { title: '', body: '' };
  return emptyItemLike(tpl);
}

function humanLabel(key) {
  if (!key) return 'Field';
  const spaced = String(key)
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function isLongTextField(key, val) {
  if (typeof val !== 'string') return false;
  if (val.length > 100) return true;
  return /\b(body|description|text|blurb|subtext|preview|tagline|intro|disclaimer|copyright|reason|message|content)\b/i.test(
    key
  );
}

function isImageUrlKey(key) {
  const k = String(key).toLowerCase();
  if (key === 'imageUrl' || k.endsWith('imageurl')) return true;
  if (k.includes('backgroundimage')) return true;
  if (k === 'assetsurl' || k.endsWith('assetsurl')) return true;
  if (k === 'ogimage' || k.endsWith('ogimage') || k.endsWith('og_image')) return true;
  if (k.endsWith('thumbnail') || k.endsWith('poster')) return true;
  if (k === 'iconurl' || k.endsWith('iconurl')) return true;
  if (k === 'badgeurl' || k.endsWith('badgeurl')) return true;
  if (k === 'logourl' || k.endsWith('logourl')) return true;
  return false;
}

/** URLs, emails, phones, hrefs — one value (stored in English JSON). */
function isLocaleNeutralKey(key) {
  const k = String(key).toLowerCase();
  if (['href', 'url', 'email', 'phone'].includes(k)) return true;
  if (k.endsWith('href') || k.endsWith('url')) return true;
  if (/imageurl|backgroundimageurl|assetsurl/.test(k)) return true;
  if (k === 'showphonemockup') return true;
  if (k === 'n' && key === 'n') return true;
  if (k === 'badgeside') return true;
  if (k === 'linktype' || k === 'linkhref') return true;
  return false;
}

function emptyItemLike(sample) {
  if (!sample || typeof sample !== 'object' || Array.isArray(sample)) {
    return {};
  }
  const o = {};
  for (const k of Object.keys(sample)) {
    const v = sample[k];
    if (typeof v === 'string') o[k] = '';
    else if (typeof v === 'number') o[k] = 0;
    else if (typeof v === 'boolean') o[k] = false;
    else if (Array.isArray(v)) o[k] = [];
    else if (v && typeof v === 'object') o[k] = emptyItemLike(v);
    else o[k] = '';
  }
  return o;
}

function padArArray(enArr, arArr) {
  if (!Array.isArray(enArr)) return [];
  const a = Array.isArray(arArr) ? [...arArr] : [];
  while (a.length < enArr.length) {
    const sample = enArr[a.length];
    a.push(
      typeof sample === 'object' && sample !== null && !Array.isArray(sample)
        ? emptyItemLike(sample)
        : ''
    );
  }
  return a.slice(0, enArr.length);
}

function BilingualDataField({
  fieldKey,
  enValue,
  arValue,
  onChangeEn,
  onChangeAr,
  depth = 0,
}) {
  const { sectionSlug } = useContext(ContentFormSectionContext);
  const fieldDomId = useId();
  const ar =
    arValue === undefined || arValue === null ? (typeof enValue === 'string' ? '' : arValue) : arValue;

  if (enValue === null || enValue === undefined) {
    return (
      <p className="contentForm__empty">Empty — use raw JSON in advanced if needed.</p>
    );
  }

  if (typeof enValue === 'boolean') {
    return (
      <div className="contentForm__field">
        <Toggle
          checked={enValue}
          onChange={(v) => {
            onChangeEn(v);
            onChangeAr(v);
          }}
          label={humanLabel(fieldKey)}
        />
      </div>
    );
  }

  if (typeof enValue === 'number') {
    return (
      <div className="contentForm__field">
        <label className="contentForm__label">{humanLabel(fieldKey)}</label>
        <input
          type="number"
          className="contentForm__input"
          value={Number.isFinite(enValue) ? enValue : 0}
          onChange={(e) => {
            const v = Number(e.target.value);
            onChangeEn(v);
            onChangeAr(v);
          }}
        />
      </div>
    );
  }

  if (
    typeof enValue === 'string' ||
    ((fieldKey === 'linkType' || fieldKey === 'linkHref') && (enValue === undefined || enValue === null))
  ) {
    const strEn =
      typeof enValue === 'string'
        ? enValue
        : fieldKey === 'linkType'
          ? 'internal'
          : '';
    const long = isLongTextField(fieldKey, strEn);
    const neutral = isLocaleNeutralKey(fieldKey) || isImageUrlKey(fieldKey);
    const label = isImageUrlKey(fieldKey)
      ? `${humanLabel(fieldKey)} (image)`
      : humanLabel(fieldKey);

    if (neutral) {
      if (isImageUrlKey(fieldKey)) {
        return (
          <div className="contentForm__field">
            <ImageUploadField
              label={label}
              value={strEn}
              onChange={onChangeEn}
              hint="Stored in session as a data URL. For production, use your storage + URL below."
            />
          </div>
        );
      }
      if (fieldKey === 'heroVideoUrl') {
        return (
          <div className="contentForm__field">
            <VideoUploadField
              label="Hero video"
              value={strEn}
              onChange={onChangeEn}
              hint="Upload a short clip (stored as data URL in session) or paste a hosted MP4/WebM, YouTube, or Vimeo link."
            />
          </div>
        );
      }
      if (fieldKey === 'linkType') {
        const v = strEn === 'external' ? 'external' : 'internal';
        const selectId = `${fieldDomId}-linkType`;
        return (
          <div className="contentForm__field">
            <label className="contentForm__label" htmlFor={selectId}>
              Article link
            </label>
            <select
              id={selectId}
              className="contentForm__input contentForm__select"
              value={v}
              onChange={(e) => {
                const next = e.target.value;
                onChangeEn(next);
                onChangeAr(next);
              }}
            >
              <option value="internal">Internal (same site / app route)</option>
              <option value="external">External (full URL)</option>
            </select>
          </div>
        );
      }
      if (fieldKey === 'linkHref') {
        return (
          <div className="contentForm__field">
            <label className="contentForm__label">{humanLabel(fieldKey)}</label>
            <p className="contentForm__hint">
              Internal: app path e.g. <code>/articles/safety</code> · External: <code>https://…</code>
            </p>
            <input
              type="text"
              className="contentForm__input"
              value={strEn}
              onChange={(e) => {
                const v = e.target.value;
                onChangeEn(v);
                onChangeAr(v);
              }}
              placeholder="/articles/slug or https://…"
            />
          </div>
        );
      }
      return (
        <div className="contentForm__field">
          <label className="contentForm__label">{label}</label>
          {long ? (
            <textarea
              className="contentForm__textarea"
              rows={4}
              value={strEn}
              onChange={(e) => onChangeEn(e.target.value)}
            />
          ) : (
            <input
              type="text"
              className="contentForm__input"
              value={strEn}
              onChange={(e) => onChangeEn(e.target.value)}
            />
          )}
        </div>
      );
    }

    const arStr = typeof ar === 'string' ? ar : '';

    return (
      <div className="contentForm__bilingual">
        <div className="contentForm__field">
          <label className="contentForm__label">{label} (English)</label>
          {long ? (
            <textarea
              className="contentForm__textarea"
              rows={4}
              value={strEn}
              onChange={(e) => onChangeEn(e.target.value)}
            />
          ) : (
            <input
              type="text"
              className="contentForm__input"
              value={strEn}
              onChange={(e) => onChangeEn(e.target.value)}
            />
          )}
        </div>
        <div className="contentForm__field contentForm__field--arField">
          <label className="contentForm__label">{label} — العربية</label>
          {long ? (
            <textarea
              className="contentForm__textarea contentForm__input--ar"
              dir="rtl"
              lang="ar"
              rows={4}
              value={arStr}
              onChange={(e) => onChangeAr(e.target.value)}
            />
          ) : (
            <input
              type="text"
              className="contentForm__input contentForm__input--ar"
              dir="rtl"
              lang="ar"
              value={arStr}
              onChange={(e) => onChangeAr(e.target.value)}
            />
          )}
        </div>
      </div>
    );
  }

  if (Array.isArray(enValue)) {
    const isObjectItems = enValue.length === 0 || typeof enValue[0] === 'object';
    const arArr = padArArray(enValue, Array.isArray(ar) ? ar : []);

    if (!isObjectItems) {
      const enJoin = enValue.join(', ');
      const arJoin = (Array.isArray(ar) ? ar : []).join(', ');
      return (
        <div className="contentForm__bilingual">
          <div className="contentForm__field">
            <label className="contentForm__label">{humanLabel(fieldKey)} (English)</label>
            <p className="contentForm__hint">Comma-separated</p>
            <input
              type="text"
              className="contentForm__input"
              value={enJoin}
              onChange={(e) =>
                onChangeEn(
                  e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
                )
              }
            />
          </div>
          <div className="contentForm__field contentForm__field--arField">
            <label className="contentForm__label">{humanLabel(fieldKey)} — العربية</label>
            <p className="contentForm__hint">Comma-separated</p>
            <input
              type="text"
              className="contentForm__input contentForm__input--ar"
              dir="rtl"
              lang="ar"
              value={arJoin}
              onChange={(e) =>
                onChangeAr(
                  e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
                )
              }
            />
          </div>
        </div>
      );
    }

    const rowNoun = entrySingularNoun(fieldKey, sectionSlug);
    const addLabel = `+ Add ${rowNoun.toLowerCase()}`;

    return (
      <div className="contentForm__array">
        <div className="contentForm__arrayHead">
          <div className="contentForm__arrayTitleBlock">
            <span className="contentForm__arrayTitle">{humanLabel(fieldKey)}</span>
            <p className="contentForm__arrayHint">
              Use &ldquo;{addLabel}&rdquo; to add another {rowNoun.toLowerCase()}. Each row includes
              paired English / Arabic fields. Remove one with the red control on that row.
            </p>
          </div>
          <button
            type="button"
            className="contentForm__addBtn"
            onClick={() => {
              const sample = newObjectRowForArray(fieldKey, sectionSlug, enValue);
              onChangeEn([...enValue, sample]);
              onChangeAr([...arArr, emptyItemLike(sample)]);
            }}
          >
            {addLabel}
          </button>
        </div>
        {enValue.map((item, index) => (
          <div key={index} className="contentForm__card">
            <div className="contentForm__cardHead">
              <span className="contentForm__cardBadge">
                {rowNoun} {index + 1}
              </span>
              <button
                type="button"
                className="contentForm__removeBtn"
                onClick={() => {
                  onChangeEn(enValue.filter((_, i) => i !== index));
                  onChangeAr(arArr.filter((_, i) => i !== index));
                }}
              >
                Remove {rowNoun.toLowerCase()}
              </button>
            </div>
            <BilingualDataField
              fieldKey={`${fieldKey}[${index}]`}
              enValue={item}
              arValue={arArr[index]}
              onChangeEn={(next) => {
                const copy = [...enValue];
                copy[index] = next;
                onChangeEn(copy);
              }}
              onChangeAr={(next) => {
                const copy = padArArray(enValue, arArr);
                copy[index] = next;
                onChangeAr(copy);
              }}
              depth={depth + 1}
            />
          </div>
        ))}
        {enValue.length === 0 && (
          <button
            type="button"
            className="contentForm__addBtn contentForm__addBtn--block"
            onClick={() => {
              const first = newObjectRowForArray(fieldKey, sectionSlug, enValue);
              onChangeEn([first]);
              onChangeAr([emptyItemLike(first)]);
            }}
          >
            {addLabel} (start here)
          </button>
        )}
      </div>
    );
  }

  if (typeof enValue === 'object') {
    const keys = Object.keys(enValue);
    if (keys.length === 0) {
      return (
        <p className="contentForm__hint">No fields in this group yet.</p>
      );
    }
    const showNestedTitle =
      depth > 0 &&
      fieldKey !== 'root' &&
      !/\[\d+\]$/.test(String(fieldKey));
    const arObj = ar && typeof ar === 'object' && !Array.isArray(ar) ? ar : {};

    return (
      <div
        className={`contentForm__group ${depth > 0 ? 'contentForm__group--nested' : ''}`}
      >
        {showNestedTitle && (
          <div className="contentForm__groupTitle">{humanLabel(fieldKey)}</div>
        )}
        {keys.map((k) => (
          <BilingualDataField
            key={k}
            fieldKey={k}
            enValue={enValue[k]}
            arValue={arObj[k]}
            onChangeEn={(next) => onChangeEn({ ...enValue, [k]: next })}
            onChangeAr={(next) => onChangeAr({ ...arObj, [k]: next })}
            depth={depth + 1}
          />
        ))}
      </div>
    );
  }

  return null;
}

const PARTNER_FORM_INPUT_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'url', label: 'URL' },
  { value: 'tel', label: 'Phone' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'select', label: 'Select' },
];

function padFieldMirror(enFields, arFields) {
  const a = Array.isArray(arFields) ? [...arFields] : [];
  while (a.length < enFields.length) a.push({});
  return a.slice(0, enFields.length);
}

function PartnerApplicationFormEditor({
  dataJson,
  dataJsonAr,
  onChangeDataJson,
  onChangeDataJsonAr,
}) {
  const ar =
    dataJsonAr && typeof dataJsonAr === 'object' && !Array.isArray(dataJsonAr)
      ? dataJsonAr
      : {};
  const setEn = (fn) => onChangeDataJson(fn(dataJson));
  const setAr = (fn) => onChangeDataJsonAr(fn(ar));

  const stepsEn = Array.isArray(dataJson.processSteps) ? dataJson.processSteps : [];
  const stepsAr = padFieldMirror(stepsEn, ar.processSteps);

  function updateStepsAr(nextArSteps) {
    setAr((a) => ({ ...a, processSteps: nextArSteps }));
  }

  function renderFieldBlock(title, fieldKey) {
    const enFields = Array.isArray(dataJson[fieldKey]) ? dataJson[fieldKey] : [];
    const arFields = padFieldMirror(enFields, ar[fieldKey]);
    const emptyRow = {
      name: '',
      inputType: 'text',
      required: true,
      label: '',
      placeholder: '',
      selectOptions: '',
    };

    return (
      <div className="contentForm__partnerBlock" key={fieldKey}>
        <h4 className="contentForm__subheading">{title}</h4>
        <p className="contentForm__hint">
          Field <code>name</code> is the HTML input name (Latin slug). Select options: comma-separated
          labels.
        </p>
        {enFields.map((row, index) => (
          <div className="contentForm__card contentForm__card--tight" key={`${fieldKey}-${index}`}>
            <div className="contentForm__cardHead">
              <span className="contentForm__cardBadge">Field {index + 1}</span>
              <button
                type="button"
                className="contentForm__removeBtn"
                onClick={() => {
                  const nextEn = enFields.filter((_, i) => i !== index);
                  const nextAr = padFieldMirror(enFields, arFields).filter(
                    (_, i) => i !== index
                  );
                  setEn((d) => ({ ...d, [fieldKey]: nextEn }));
                  setAr((a) => ({ ...a, [fieldKey]: nextAr }));
                }}
              >
                Remove field
              </button>
            </div>
            <div className="contentForm__fieldRow">
              <label className="contentForm__label">Input name</label>
              <input
                type="text"
                className="contentForm__input contentForm__input--mono"
                value={row.name}
                onChange={(e) => {
                  const v = e.target.value;
                  setEn((d) => ({
                    ...d,
                    [fieldKey]: d[fieldKey].map((f, i) =>
                      i === index ? { ...f, name: v } : f
                    ),
                  }));
                }}
                placeholder="companyName"
              />
            </div>
            <div className="contentForm__fieldRow">
              <label className="contentForm__label">Type</label>
              <select
                className="contentForm__input contentForm__select"
                value={row.inputType || 'text'}
                onChange={(e) => {
                  const v = e.target.value;
                  setEn((d) => ({
                    ...d,
                    [fieldKey]: d[fieldKey].map((f, i) =>
                      i === index ? { ...f, inputType: v } : f
                    ),
                  }));
                }}
              >
                {PARTNER_FORM_INPUT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="contentForm__fieldRow">
              <Toggle
                checked={!!row.required}
                onChange={(v) =>
                  setEn((d) => ({
                    ...d,
                    [fieldKey]: d[fieldKey].map((f, i) =>
                      i === index ? { ...f, required: v } : f
                    ),
                  }))
                }
                label="Required"
              />
            </div>
            <div className="contentForm__bilingual contentForm__bilingual--stack">
              <div className="contentForm__field">
                <label className="contentForm__label">Label (English)</label>
                <input
                  type="text"
                  className="contentForm__input"
                  value={row.label}
                  onChange={(e) => {
                    const v = e.target.value;
                    setEn((d) => ({
                      ...d,
                      [fieldKey]: d[fieldKey].map((f, i) =>
                        i === index ? { ...f, label: v } : f
                      ),
                    }));
                  }}
                />
              </div>
              <div className="contentForm__field contentForm__field--arField">
                <label className="contentForm__label">Label — العربية</label>
                <input
                  type="text"
                  className="contentForm__input contentForm__input--ar"
                  dir="rtl"
                  lang="ar"
                  value={(arFields[index] && arFields[index].label) || ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    const next = padFieldMirror(enFields, ar[fieldKey]);
                    next[index] = { ...next[index], label: v };
                    setAr((a) => ({ ...a, [fieldKey]: next }));
                  }}
                />
              </div>
            </div>
            <div className="contentForm__bilingual contentForm__bilingual--stack">
              <div className="contentForm__field">
                <label className="contentForm__label">Placeholder (English)</label>
                <input
                  type="text"
                  className="contentForm__input"
                  value={row.placeholder}
                  onChange={(e) => {
                    const v = e.target.value;
                    setEn((d) => ({
                      ...d,
                      [fieldKey]: d[fieldKey].map((f, i) =>
                        i === index ? { ...f, placeholder: v } : f
                      ),
                    }));
                  }}
                />
              </div>
              <div className="contentForm__field contentForm__field--arField">
                <label className="contentForm__label">Placeholder — العربية</label>
                <input
                  type="text"
                  className="contentForm__input contentForm__input--ar"
                  dir="rtl"
                  lang="ar"
                  value={(arFields[index] && arFields[index].placeholder) || ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    const next = padFieldMirror(enFields, ar[fieldKey]);
                    next[index] = { ...next[index], placeholder: v };
                    setAr((a) => ({ ...a, [fieldKey]: next }));
                  }}
                />
              </div>
            </div>
            {row.inputType === 'select' && (
              <div className="contentForm__field">
                <label className="contentForm__label">Select options (comma-separated)</label>
                <p className="contentForm__hint">Shown in order; values are derived from labels unless you wire a mapping on the site.</p>
                <input
                  type="text"
                  className="contentForm__input"
                  value={row.selectOptions || ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    setEn((d) => ({
                      ...d,
                      [fieldKey]: d[fieldKey].map((f, i) =>
                        i === index ? { ...f, selectOptions: v } : f
                      ),
                    }));
                  }}
                />
              </div>
            )}
          </div>
        ))}
        <button
          type="button"
          className="contentForm__addBtn contentForm__addBtn--block"
          onClick={() => {
            setEn((d) => ({
              ...d,
              [fieldKey]: [...(d[fieldKey] || []), { ...emptyRow }],
            }));
            setAr((a) => ({
              ...a,
              [fieldKey]: [...padFieldMirror(enFields, ar[fieldKey]), {}],
            }));
          }}
        >
          + Add field to this section
        </button>
      </div>
    );
  }

  return (
    <div className="contentForm contentForm--partnerForm">
      <h3 className="contentForm__heading">Partner application form</h3>
      <p className="contentForm__intro">
        This block powers the <strong>Contact</strong> route (&ldquo;Partner with FITUP&rdquo;). Match
        the live page: hero, steps, three field groups (company / contact person / partnership),
        qualification callout, and submit. Your site should read this from the API, bind{' '}
        <code>name</code> on each field, and POST to <code>submitActionUrl</code> when set.
      </p>

      <h4 className="contentForm__subheading">Hero</h4>
      <div className="contentForm__bilingual contentForm__bilingual--stack">
        <div className="contentForm__field">
          <label className="contentForm__label">Headline (English)</label>
          <input
            type="text"
            className="contentForm__input"
            value={dataJson.headline || ''}
            onChange={(e) => setEn((d) => ({ ...d, headline: e.target.value }))}
          />
        </div>
        <div className="contentForm__field contentForm__field--arField">
          <label className="contentForm__label">Headline — العربية</label>
          <input
            type="text"
            className="contentForm__input contentForm__input--ar"
            dir="rtl"
            lang="ar"
            value={ar.headline || ''}
            onChange={(e) => setAr((a) => ({ ...a, headline: e.target.value }))}
          />
        </div>
      </div>
      <div className="contentForm__bilingual contentForm__bilingual--stack">
        <div className="contentForm__field">
          <label className="contentForm__label">Subtext (English)</label>
          <textarea
            className="contentForm__textarea"
            rows={3}
            value={dataJson.subtext || ''}
            onChange={(e) => setEn((d) => ({ ...d, subtext: e.target.value }))}
          />
        </div>
        <div className="contentForm__field contentForm__field--arField">
          <label className="contentForm__label">Subtext — العربية</label>
          <textarea
            className="contentForm__textarea contentForm__input--ar"
            dir="rtl"
            lang="ar"
            rows={3}
            value={ar.subtext || ''}
            onChange={(e) => setAr((a) => ({ ...a, subtext: e.target.value }))}
          />
        </div>
      </div>

      <h4 className="contentForm__subheading">Process steps</h4>
      {stepsEn.map((step, index) => (
        <div className="contentForm__card contentForm__card--tight" key={`step-${index}`}>
          <div className="contentForm__cardHead">
            <span className="contentForm__cardBadge">Step {index + 1}</span>
            <button
              type="button"
              className="contentForm__removeBtn"
              onClick={() => {
                setEn((d) => ({
                  ...d,
                  processSteps: d.processSteps.filter((_, i) => i !== index),
                }));
                updateStepsAr(stepsAr.filter((_, i) => i !== index));
              }}
            >
              Remove step
            </button>
          </div>
          <div className="contentForm__field">
            <label className="contentForm__label">Icon (emoji or short code)</label>
            <input
              type="text"
              className="contentForm__input"
              value={step.icon || ''}
              onChange={(e) => {
                const v = e.target.value;
                setEn((d) => ({
                  ...d,
                  processSteps: d.processSteps.map((s, i) =>
                    i === index ? { ...s, icon: v } : s
                  ),
                }));
              }}
            />
          </div>
          <div className="contentForm__bilingual contentForm__bilingual--stack">
            <div className="contentForm__field">
              <label className="contentForm__label">Title (English)</label>
              <input
                type="text"
                className="contentForm__input"
                value={step.title || ''}
                onChange={(e) => {
                  const v = e.target.value;
                  setEn((d) => ({
                    ...d,
                    processSteps: d.processSteps.map((s, i) =>
                      i === index ? { ...s, title: v } : s
                    ),
                  }));
                }}
              />
            </div>
            <div className="contentForm__field contentForm__field--arField">
              <label className="contentForm__label">Title — العربية</label>
              <input
                type="text"
                className="contentForm__input contentForm__input--ar"
                dir="rtl"
                lang="ar"
                value={(stepsAr[index] && stepsAr[index].title) || ''}
                onChange={(e) => {
                  const v = e.target.value;
                  const next = [...stepsAr];
                  next[index] = { ...next[index], title: v };
                  updateStepsAr(next);
                }}
              />
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        className="contentForm__addBtn contentForm__addBtn--block"
        onClick={() => {
          setEn((d) => ({
            ...d,
            processSteps: [...(d.processSteps || []), { title: '', icon: '' }],
          }));
          updateStepsAr([...stepsAr, {}]);
        }}
      >
        + Add process step
      </button>

      <h4 className="contentForm__subheading">Submission</h4>
      <div className="contentForm__field">
        <label className="contentForm__label">Form POST URL</label>
        <p className="contentForm__hint">
          Leave empty to handle submit only in your app code (e.g. server action).
        </p>
        <input
          type="text"
          className="contentForm__input"
          value={dataJson.submitActionUrl || ''}
          onChange={(e) => setEn((d) => ({ ...d, submitActionUrl: e.target.value }))}
          placeholder="https://api.example.com/partnership-applications"
        />
      </div>

      <h4 className="contentForm__subheading">Section headings</h4>
      {[
        ['companySectionTitle', 'Company block'],
        ['contactSectionTitle', 'Contact person block'],
        ['partnershipSectionTitle', 'Partnership details block'],
      ].map(([key, hint]) => (
        <div className="contentForm__bilingual contentForm__bilingual--stack" key={key}>
          <div className="contentForm__field">
            <label className="contentForm__label">
              {hint} (English)
            </label>
            <input
              type="text"
              className="contentForm__input"
              value={dataJson[key] || ''}
              onChange={(e) => setEn((d) => ({ ...d, [key]: e.target.value }))}
            />
          </div>
          <div className="contentForm__field contentForm__field--arField">
            <label className="contentForm__label">{hint} — العربية</label>
            <input
              type="text"
              className="contentForm__input contentForm__input--ar"
              dir="rtl"
              lang="ar"
              value={ar[key] || ''}
              onChange={(e) => setAr((a) => ({ ...a, [key]: e.target.value }))}
            />
          </div>
        </div>
      ))}

      {renderFieldBlock('Company fields', 'companyFields')}
      {renderFieldBlock('Contact person fields', 'contactFields')}
      {renderFieldBlock('Partnership fields', 'partnershipFields')}

      <h4 className="contentForm__subheading">Qualification callout</h4>
      <div className="contentForm__bilingual contentForm__bilingual--stack">
        <div className="contentForm__field">
          <label className="contentForm__label">Title (English)</label>
          <input
            type="text"
            className="contentForm__input"
            value={dataJson.qualificationTitle || ''}
            onChange={(e) => setEn((d) => ({ ...d, qualificationTitle: e.target.value }))}
          />
        </div>
        <div className="contentForm__field contentForm__field--arField">
          <label className="contentForm__label">Title — العربية</label>
          <input
            type="text"
            className="contentForm__input contentForm__input--ar"
            dir="rtl"
            lang="ar"
            value={ar.qualificationTitle || ''}
            onChange={(e) => setAr((a) => ({ ...a, qualificationTitle: e.target.value }))}
          />
        </div>
      </div>
      <div className="contentForm__bilingual contentForm__bilingual--stack">
        <div className="contentForm__field">
          <label className="contentForm__label">Body (English)</label>
          <textarea
            className="contentForm__textarea"
            rows={4}
            value={dataJson.qualificationBody || ''}
            onChange={(e) => setEn((d) => ({ ...d, qualificationBody: e.target.value }))}
          />
        </div>
        <div className="contentForm__field contentForm__field--arField">
          <label className="contentForm__label">Body — العربية</label>
          <textarea
            className="contentForm__textarea contentForm__input--ar"
            dir="rtl"
            lang="ar"
            rows={4}
            value={ar.qualificationBody || ''}
            onChange={(e) => setAr((a) => ({ ...a, qualificationBody: e.target.value }))}
          />
        </div>
      </div>

      <h4 className="contentForm__subheading">Footer of form</h4>
      <div className="contentForm__bilingual contentForm__bilingual--stack">
        <div className="contentForm__field">
          <label className="contentForm__label">Submit button (English)</label>
          <input
            type="text"
            className="contentForm__input"
            value={dataJson.submitButtonLabel || ''}
            onChange={(e) => setEn((d) => ({ ...d, submitButtonLabel: e.target.value }))}
          />
        </div>
        <div className="contentForm__field contentForm__field--arField">
          <label className="contentForm__label">Submit button — العربية</label>
          <input
            type="text"
            className="contentForm__input contentForm__input--ar"
            dir="rtl"
            lang="ar"
            value={ar.submitButtonLabel || ''}
            onChange={(e) => setAr((a) => ({ ...a, submitButtonLabel: e.target.value }))}
          />
        </div>
      </div>
      <div className="contentForm__bilingual contentForm__bilingual--stack">
        <div className="contentForm__field">
          <label className="contentForm__label">Legal line (English)</label>
          <textarea
            className="contentForm__textarea"
            rows={2}
            value={dataJson.legalNotice || ''}
            onChange={(e) => setEn((d) => ({ ...d, legalNotice: e.target.value }))}
          />
        </div>
        <div className="contentForm__field contentForm__field--arField">
          <label className="contentForm__label">Legal line — العربية</label>
          <textarea
            className="contentForm__textarea contentForm__input--ar"
            dir="rtl"
            lang="ar"
            rows={2}
            value={ar.legalNotice || ''}
            onChange={(e) => setAr((a) => ({ ...a, legalNotice: e.target.value }))}
          />
        </div>
      </div>
    </div>
  );
}

export function ContentSectionForm({
  dataJson,
  dataJsonAr,
  onChangeDataJson,
  onChangeDataJsonAr,
  sectionSlug = '',
}) {
  if (!dataJson || typeof dataJson !== 'object' || Array.isArray(dataJson)) {
    return <p className="contentForm__empty">Invalid content shape.</p>;
  }

  const ar = dataJsonAr && typeof dataJsonAr === 'object' && !Array.isArray(dataJsonAr) ? dataJsonAr : {};

  if (sectionSlug === 'partner_application_form') {
    return (
      <ContentFormSectionContext.Provider value={{ sectionSlug }}>
        <PartnerApplicationFormEditor
          dataJson={dataJson}
          dataJsonAr={ar}
          onChangeDataJson={onChangeDataJson}
          onChangeDataJsonAr={onChangeDataJsonAr}
        />
      </ContentFormSectionContext.Provider>
    );
  }

  return (
    <ContentFormSectionContext.Provider value={{ sectionSlug }}>
      <div className="contentForm">
        <h3 className="contentForm__heading">Section content</h3>
        <BilingualDataField
          fieldKey="root"
          enValue={dataJson}
          arValue={ar}
          onChangeEn={onChangeDataJson}
          onChangeAr={onChangeDataJsonAr}
          depth={0}
        />
      </div>
    </ContentFormSectionContext.Provider>
  );
}

export function ContentSectionSeo({
  seo,
  seoAr,
  onChangeSeo,
  onChangeSeoAr,
  pageLabelText,
  sectionLabelText,
}) {
  const s = seo || { metaTitle: '', metaDescription: '', keywords: '' };
  const sa = seoAr || { metaTitle: '', metaDescription: '', keywords: '' };

  return (
    <div className="contentSeo">
      <h3 className="contentSeo__heading">SEO & metadata</h3>
      <p className="contentSeo__intro">
        Optional overrides for this block — <strong>{pageLabelText}</strong> ·{' '}
        <strong>{sectionLabelText}</strong>. English and Arabic fields below; leave blank to use
        page defaults.
      </p>
      <div className="contentSeo__fields">
        <div className="contentForm__bilingual contentSeo__pair">
          <div className="contentSeo__field">
            <label className="contentForm__label">Meta title (English)</label>
            <input
              type="text"
              className="contentForm__input"
              value={s.metaTitle}
              onChange={(e) => onChangeSeo({ ...s, metaTitle: e.target.value })}
              placeholder={`e.g. ${sectionLabelText} | FIT UP`}
            />
          </div>
          <div className="contentSeo__field contentForm__field--arField">
            <label className="contentForm__label">Meta title — العربية</label>
            <input
              type="text"
              className="contentForm__input contentForm__input--ar"
              dir="rtl"
              lang="ar"
              value={sa.metaTitle}
              onChange={(e) => onChangeSeoAr({ ...sa, metaTitle: e.target.value })}
            />
          </div>
        </div>
        <div className="contentForm__bilingual contentSeo__pair">
          <div className="contentSeo__field">
            <label className="contentForm__label">Meta description (English)</label>
            <textarea
              className="contentForm__textarea"
              rows={3}
              value={s.metaDescription}
              onChange={(e) => onChangeSeo({ ...s, metaDescription: e.target.value })}
              placeholder="Short summary for search results"
            />
          </div>
          <div className="contentSeo__field contentForm__field--arField">
            <label className="contentForm__label">Meta description — العربية</label>
            <textarea
              className="contentForm__textarea contentForm__input--ar"
              dir="rtl"
              lang="ar"
              rows={3}
              value={sa.metaDescription}
              onChange={(e) => onChangeSeoAr({ ...sa, metaDescription: e.target.value })}
            />
          </div>
        </div>
        <div className="contentForm__bilingual contentSeo__pair">
          <div className="contentSeo__field">
            <label className="contentForm__label">Keywords (English)</label>
            <input
              type="text"
              className="contentForm__input"
              value={s.keywords}
              onChange={(e) => onChangeSeo({ ...s, keywords: e.target.value })}
              placeholder="gym software, partnerships, …"
            />
          </div>
          <div className="contentSeo__field contentForm__field--arField">
            <label className="contentForm__label">Keywords — العربية</label>
            <input
              type="text"
              className="contentForm__input contentForm__input--ar"
              dir="rtl"
              lang="ar"
              value={sa.keywords}
              onChange={(e) => onChangeSeoAr({ ...sa, keywords: e.target.value })}
            />
          </div>
        </div>
      </div>
      {(s.metaTitle || s.metaDescription || sa.metaTitle || sa.metaDescription) && (
        <div className="contentSeo__previewsRow">
          {(s.metaTitle || s.metaDescription) && (
            <div className="contentSeo__preview">
              <span className="contentSeo__previewLabel">Search preview (English)</span>
              <div className="contentSeo__previewBox" dir="ltr" lang="en">
                <p className="contentSeo__pt">{s.metaTitle || 'Meta title'}</p>
                <p className="contentSeo__pu">
                  https://fitup.example/
                  {sectionLabelText.toLowerCase().replace(/\s+/g, '-')}
                </p>
                <p className="contentSeo__pd">
                  {s.metaDescription || 'Description will appear here.'}
                </p>
              </div>
            </div>
          )}
          {(sa.metaTitle || sa.metaDescription) && (
            <div className="contentSeo__preview">
              <span className="contentSeo__previewLabel">معاينة البحث (العربية)</span>
              <div
                className="contentSeo__previewBox contentSeo__previewBox--rtl"
                dir="rtl"
                lang="ar"
              >
                <p className="contentSeo__pt">{sa.metaTitle || 'عنوان الميتا'}</p>
                <p className="contentSeo__pu">
                  https://fitup.example/
                  {sectionLabelText.toLowerCase().replace(/\s+/g, '-')}
                </p>
                <p className="contentSeo__pd">
                  {sa.metaDescription || 'سيظهر الوصف هنا.'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
