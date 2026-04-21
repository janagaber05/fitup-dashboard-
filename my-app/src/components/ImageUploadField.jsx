import { useId, useRef, useState } from 'react';
import './Ui.css';
import './ImageUploadField.css';

const MAX_IMAGE_UPLOAD_BYTES = 2 * 1024 * 1024;

export default function ImageUploadField({ label, value, onChange, hint }) {
  const inputId = useId();
  const fileRef = useRef(null);
  const [error, setError] = useState(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Choose an image file (PNG, JPG, WebP, …).');
      return;
    }
    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
      setError('File too large (max 2 MB). Use a smaller image or paste a hosted URL below.');
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') onChange(reader.result);
    };
    reader.onerror = () => setError('Could not read this file.');
    reader.readAsDataURL(file);
  };

  const str = typeof value === 'string' ? value : '';
  const canPreview =
    str.length > 0 &&
    (str.startsWith('data:image/') ||
      str.startsWith('http://') ||
      str.startsWith('https://'));

  return (
    <div className="imgUp">
      {label ? (
        <label className="imgUp__label" htmlFor={inputId}>
          {label}
        </label>
      ) : null}
      {canPreview && (
        <div className="imgUp__preview">
          <img src={str} alt="" />
          <button
            type="button"
            className="imgUp__clear fu-btn fu-btn--danger"
            onClick={() => {
              onChange('');
              setError(null);
            }}
          >
            Remove image
          </button>
        </div>
      )}
      <div className="imgUp__row">
        <input
          id={inputId}
          ref={fileRef}
          type="file"
          accept="image/*"
          className="imgUp__file"
          onChange={handleFile}
        />
        <button
          type="button"
          className="fu-btn fu-btn--primary"
          onClick={() => fileRef.current?.click()}
        >
          Upload image
        </button>
        {hint ? <span className="imgUp__hint">{hint}</span> : null}
      </div>
      <label className="imgUp__label imgUp__label--sub">Or paste image URL</label>
      <input
        type="url"
        className="imgUp__url"
        value={str}
        onChange={(e) => {
          setError(null);
          onChange(e.target.value);
        }}
        placeholder="https://…"
      />
      {error && <p className="imgUp__error">{error}</p>}
    </div>
  );
}
