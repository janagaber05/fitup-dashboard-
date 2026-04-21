import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useFitupAdmin } from '../components/FitupAdminContext';
import '../components/Ui.css';
import './MessagesPage.css';

function initials(name) {
  return String(name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('') || 'U';
}

function relativeAge(iso) {
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return 'now';
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'now';
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function formatClock(iso) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
}

function latestMessageTime(msg) {
  const lastReply =
    Array.isArray(msg.replyHistory) && msg.replyHistory.length > 0
      ? msg.replyHistory[0]?.sentAt
      : '';
  const lastMember =
    Array.isArray(msg.memberChatTail) && msg.memberChatTail.length > 0
      ? msg.memberChatTail[msg.memberChatTail.length - 1]?.sentAt
      : '';
  const t = [lastReply, lastMember, msg.createdAt].filter(Boolean).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );
  return t[0] || msg.createdAt;
}

export default function MessagesPage() {
  const ctx = useOutletContext() || {};
  const globalSearch = (ctx.globalSearch || '').trim().toLowerCase();
  const { messages, updateMessage, sendMessageReply, authUser, settings } = useFitupAdmin();

  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(messages[0]?.id || null);
  const [reply, setReply] = useState('');
  const [replyMode, setReplyMode] = useState(
    settings?.messagingSettings?.defaultReplyChannel === 'email' ? 'email' : 'chat'
  );

  const filtered = useMemo(() => {
    const q = `${globalSearch} ${search}`.trim().toLowerCase();
    const rows = [...messages].sort(
      (a, b) => new Date(latestMessageTime(b)).getTime() - new Date(latestMessageTime(a)).getTime()
    );
    if (!q) return rows;
    return rows.filter((m) => {
      const latestReply =
        Array.isArray(m.replyHistory) && m.replyHistory.length > 0
          ? m.replyHistory[0]?.body || ''
          : '';
      const tailText = (Array.isArray(m.memberChatTail) ? m.memberChatTail : [])
        .map((r) => r.body || '')
        .join(' ');
      return (
        String(m.userName || '').toLowerCase().includes(q) ||
        String(m.message || '').toLowerCase().includes(q) ||
        String(latestReply || '').toLowerCase().includes(q) ||
        String(tailText || '').toLowerCase().includes(q)
      );
    });
  }, [messages, globalSearch, search]);

  const selected = filtered.find((m) => m.id === selectedId) || filtered[0] || null;

  const thread = useMemo(() => {
    if (!selected) return [];
    const base = [];
    if (String(selected.message || '').trim()) {
      base.push({
        id: `${selected.id}_in`,
        type: 'incoming',
        text: selected.message,
        at: selected.createdAt,
      });
    }
    const memberTail = (Array.isArray(selected.memberChatTail) ? selected.memberChatTail : []).map(
      (r) => ({
        id: r.id,
        type: 'incoming',
        text: r.body,
        at: r.sentAt,
      })
    );
    const replies = Array.isArray(selected.replyHistory)
      ? selected.replyHistory.map((r) => ({
          id: r.id,
          type: 'outgoing',
          text: r.body,
          at: r.sentAt,
          channel: r.channel || 'email',
          employeeName: r.employeeName || 'Admin',
        }))
      : [];

    return [...base, ...memberTail, ...replies].sort(
      (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()
    );
  }, [selected]);

  const handleSelect = (id) => {
    setSelectedId(id);
    const row = filtered.find((m) => m.id === id);
    if (row && row.status === 'unread') updateMessage(id, { status: 'read' });
  };

  const onSendReply = () => {
    if (!selected) return;
    const text = reply.trim();
    if (!text) return;
    const signature =
      replyMode === 'email'
        ? String(settings?.messagingSettings?.emailSignature || '').trim()
        : '';
    const payload = signature ? `${text}\n\n${signature}` : text;
    sendMessageReply(selected.id, payload, {
      channel: replyMode,
      employeeName: authUser || 'Admin',
    });
    updateMessage(selected.id, { status: 'read' });
    setReply('');
  };

  return (
    <div className="msgPg msgPg--chat">
      <header className="fu-pageHeader">
        <div>
          <h1>Messages</h1>
          <p>Chat with members and coaches</p>
        </div>
      </header>

      <section className="msgPg__layout">
        <aside className="fu-card msgPg__sidebar">
          <div className="msgPg__searchWrap">
            <input
              className="fu-input msgPg__search"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search conversations"
            />
          </div>

          <div className="msgPg__list">
            {filtered.map((m) => {
              const lastReply =
                Array.isArray(m.replyHistory) && m.replyHistory.length > 0
                  ? m.replyHistory[0]?.body || ''
                  : '';
              const lastMember =
                Array.isArray(m.memberChatTail) && m.memberChatTail.length > 0
                  ? m.memberChatTail[m.memberChatTail.length - 1]?.body || ''
                  : '';
              const preview = lastMember || lastReply || m.message || '';
              const active = selected?.id === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  className={`msgPg__row ${active ? 'msgPg__row--active' : ''}`}
                  onClick={() => handleSelect(m.id)}
                >
                  <span className="msgPg__avatar">{initials(m.userName)}</span>
                  <span className="msgPg__rowMain">
                    <span className="msgPg__rowTop">
                      <strong>{m.userName}</strong>
                      <time>{relativeAge(latestMessageTime(m))}</time>
                    </span>
                    <span className="msgPg__preview">
                      {preview.length > 44 ? `${preview.slice(0, 44)}…` : preview}
                    </span>
                  </span>
                  {m.status === 'unread' ? <span className="msgPg__dot">●</span> : null}
                </button>
              );
            })}
            {filtered.length === 0 ? <p className="msgPg__empty">No conversations found.</p> : null}
          </div>
        </aside>

        <article className="fu-card msgPg__chat">
          {selected ? (
            <>
              <header className="msgPg__chatHead">
                <span className="msgPg__avatar msgPg__avatar--head">{initials(selected.userName)}</span>
                <div>
                  <h2>{selected.userName}</h2>
                  <p>Active now</p>
                </div>
              </header>

              <div className="msgPg__thread">
                {thread.map((item) => (
                  <div
                    key={item.id}
                    className={`msgPg__bubbleWrap ${
                      item.type === 'outgoing' ? 'msgPg__bubbleWrap--out' : 'msgPg__bubbleWrap--in'
                    }`}
                  >
                    <div className={`msgPg__bubble msgPg__bubble--${item.type}`}>
                      <p>{item.text}</p>
                      {item.type === 'outgoing' &&
                      settings?.messagingSettings?.showResponderName !== false ? (
                        <small className="msgPg__bubbleMeta">
                          {item.channel === 'email' ? 'Email' : 'Chat'} reply by{' '}
                          {item.employeeName || 'Admin'}
                        </small>
                      ) : null}
                      <time>{formatClock(item.at)}</time>
                    </div>
                  </div>
                ))}
              </div>

              <div className="msgPg__composer">
                <select
                  className="fu-select msgPg__replyMode"
                  value={replyMode}
                  onChange={(e) => setReplyMode(e.target.value)}
                  aria-label="Reply mode"
                >
                  <option value="chat">Reply in chat</option>
                  <option value="email">Reply on email</option>
                </select>
                <input
                  className="fu-input msgPg__composerInput"
                  placeholder={
                    replyMode === 'email' ? 'Type your email reply...' : 'Type your chat reply...'
                  }
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      onSendReply();
                    }
                  }}
                />
                <button
                  type="button"
                  className="fu-btn fu-btn--primary msgPg__send"
                  onClick={onSendReply}
                  disabled={!reply.trim()}
                >
                  Send {replyMode === 'email' ? 'Email' : 'Chat'}
                </button>
              </div>
            </>
          ) : (
            <p className="msgPg__empty">Select a conversation to start chatting.</p>
          )}
        </article>
      </section>
    </div>
  );
}
