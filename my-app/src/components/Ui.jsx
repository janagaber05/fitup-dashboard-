import './Ui.css';

export function Modal({ open, title, subtitle, onClose, children, footer, modalClassName = '' }) {
  if (!open) return null;
  return (
    <div className="fu-modalRoot" role="dialog" aria-modal="true">
      <button
        type="button"
        className="fu-modalBackdrop"
        aria-label="Close"
        onClick={onClose}
      />
      <div className={`fu-modal ${modalClassName}`.trim()}>
        <div className="fu-modal__head">
          <div className="fu-modal__titles">
            <h3>{title}</h3>
            {subtitle ? <p className="fu-modal__sub">{subtitle}</p> : null}
          </div>
          <button type="button" className="fu-iconBtn" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="fu-modal__body">{children}</div>
        {footer ? <div className="fu-modal__foot">{footer}</div> : null}
      </div>
    </div>
  );
}

export function Badge({ children, tone = 'neutral' }) {
  return <span className={`fu-badge fu-badge--${tone}`}>{children}</span>;
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="fu-toggle">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="fu-toggle__ui" />
      {label ? <span className="fu-toggle__label">{label}</span> : null}
    </label>
  );
}
