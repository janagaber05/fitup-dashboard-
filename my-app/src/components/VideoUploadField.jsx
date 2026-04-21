import { useId, useRef, useState } from 'react';
import './Ui.css';
import './VideoUploadField.css';

const MAX_VIDEO_UPLOAD_BYTES = 25 * 1024 * 1024;

function youtubeEmbedFromUrl(url) {
  try {
    const u = new URL(url.trim());
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.replace(/^\//, '').split('/')[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
      const m = u.pathname.match(/\/embed\/([^/?]+)/);
      if (m) return `https://www.youtube.com/embed/${m[1]}`;
    }
  } catch {
    return null;
  }
  return null;
}

function vimeoEmbedFromUrl(url) {
  try {
    const u = new URL(url.trim());
    if (u.hostname.includes('vimeo.com')) {
      const m = u.pathname.match(/\/(\d+)/);
      if (m) return `https://player.vimeo.com/video/${m[1]}`;
    }
  } catch {
    return null;
  }
  return null;
}

function isDirectVideoSrc(str) {
  if (!str || typeof str !== 'string') return false;
  if (str.startsWith('data:video/')) return true;
  if (/^https?:\/\/.+\.(mp4|webm|ogg)(\?|$)/i.test(str)) return true;
  return false;
}

export default function VideoUploadField({ label, value, onChange, hint }) {
  const inputId = useId();
  const fileRef = useRef(null);
  const [error, setError] = useState(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      setError('Choose a video file (MP4, WebM, …).');
      return;
    }
    if (file.size > MAX_VIDEO_UPLOAD_BYTES) {
      setError(
        `File too large (max ${Math.round(MAX_VIDEO_UPLOAD_BYTES / (1024 * 1024))} MB). Host the file and paste the URL instead.`
      );
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
  const yt = str.startsWith('http') ? youtubeEmbedFromUrl(str) : null;
  const vm = str.startsWith('http') && !yt ? vimeoEmbedFromUrl(str) : null;
  const showVideoTag = isDirectVideoSrc(str);
  const canPreview = str.length > 0 && (showVideoTag || yt || vm);

  return (
    <div className="vidUp">
      {label ? (
        <label className="vidUp__label" htmlFor={inputId}>
          {label}
        </label>
      ) : null}
      {canPreview && (
        <div className="vidUp__preview">
          {showVideoTag ? (
            <video className="vidUp__video" src={str} controls playsInline muted />
          ) : yt ? (
            <iframe
              className="vidUp__iframe"
              title="Video preview"
              src={yt}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : vm ? (
            <iframe
              className="vidUp__iframe"
              title="Video preview"
              src={vm}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          ) : null}
          <button
            type="button"
            className="vidUp__clear fu-btn fu-btn--danger"
            onClick={() => {
              onChange('');
              setError(null);
            }}
          >
            Remove video
          </button>
        </div>
      )}
      <div className="vidUp__row">
        <input
          id={inputId}
          ref={fileRef}
          type="file"
          accept="video/*"
          className="vidUp__file"
          onChange={handleFile}
        />
        <button
          type="button"
          className="fu-btn fu-btn--primary"
          onClick={() => fileRef.current?.click()}
        >
          Upload video
        </button>
        {hint ? <span className="vidUp__hint">{hint}</span> : null}
      </div>
      <label className="vidUp__label vidUp__label--sub">Or paste video URL</label>
      <input
        type="url"
        className="vidUp__url"
        value={str}
        onChange={(e) => {
          setError(null);
          onChange(e.target.value);
        }}
        placeholder="https://… (MP4/WebM, YouTube, Vimeo, …)"
      />
      {error && <p className="vidUp__error">{error}</p>}
    </div>
  );
}
