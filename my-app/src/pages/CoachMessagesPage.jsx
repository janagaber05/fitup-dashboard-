import { useMemo, useState } from 'react';
import { useFitupAdmin } from '../components/FitupAdminContext';
import { coachScopedClients } from '../utils/coachClientScope';
import '../components/Ui.css';
import './MessagesPage.css';
import './CoachMessagesPage.css';

function initials(name) {
  return (
    String(name || '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() || '')
      .join('') || 'U'
  );
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

export default function CoachMessagesPage() {
  const {
    messages,
    users,
    coachSession,
    partnerGyms,
    authUser,
    updateMessage,
    sendMessageReply,
    startCoachClientThread,
  } = useFitupAdmin();

  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [reply, setReply] = useState('');
  const [newClientId, setNewClientId] = useState('');
  const [newOpenText, setNewOpenText] = useState('');
  const [newErr, setNewErr] = useState('');

  const myClients = useMemo(
    () => coachScopedClients(users, coachSession, partnerGyms),
    [users, coachSession, partnerGyms]
  );

  const clientUserIds = useMemo(() => new Set(myClients.map((u) => u.id)), [myClients]);

  const coachMessages = useMemo(() => {
    return (messages || []).filter((m) => clientUserIds.has(m.userId));
  }, [messages, clientUserIds]);

  const filtered = useMemo(() => {
    const q = String(search || '').trim().toLowerCase();
    const rows = [...coachMessages].sort(
      (a, b) => new Date(latestMessageTime(b)).getTime() - new Date(latestMessageTime(a)).getTime()
    );
    if (!q) return rows;
    return rows.filter((m) => {
      const lastReply =
        Array.isArray(m.replyHistory) && m.replyHistory.length > 0
          ? m.replyHistory[0]?.body || ''
          : '';
      const tail =
        Array.isArray(m.memberChatTail) && m.memberChatTail.length > 0
          ? m.memberChatTail[m.memberChatTail.length - 1]?.body || ''
          : '';
      return (
        String(m.userName || '').toLowerCase().includes(q) ||
        String(m.message || '').toLowerCase().includes(q) ||
        String(lastReply || '').toLowerCase().includes(q) ||
        String(tail || '').toLowerCase().includes(q)
      );
    });
  }, [coachMessages, search]);

  const selected =
    filtered.find((m) => m.id === selectedId) || filtered[0] || null;

  const selectedMember = useMemo(
    () => (selected ? myClients.find((u) => u.id === selected.userId) : null),
    [myClients, selected]
  );

  const thread = useMemo(() => {
    if (!selected) return [];
    const parts = [];
    if (String(selected.message || '').trim()) {
      parts.push({
        id: `${selected.id}_in`,
        type: 'incoming',
        text: selected.message,
        at: selected.createdAt,
      });
    }
    (Array.isArray(selected.memberChatTail) ? selected.memberChatTail : []).forEach((r) => {
      parts.push({
        id: r.id,
        type: 'incoming',
        text: r.body,
        at: r.sentAt,
      });
    });
    (Array.isArray(selected.replyHistory) ? selected.replyHistory : []).forEach((r) => {
      parts.push({
        id: r.id,
        type: 'outgoing',
        text: r.body,
        at: r.sentAt,
        channel: r.channel || 'chat',
        employeeName: r.employeeName || authUser || 'Coach',
      });
    });
    return parts.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  }, [selected, authUser]);

  const handleSelect = (id) => {
    setSelectedId(id);
    const row = filtered.find((m) => m.id === id);
    if (row && row.status === 'unread') updateMessage(id, { status: 'read' });
  };

  const onSendReply = () => {
    if (!selected) return;
    const text = reply.trim();
    if (!text) return;
    sendMessageReply(selected.id, text, {
      channel: 'chat',
      employeeName: authUser || 'Coach',
    });
    updateMessage(selected.id, { status: 'read' });
    setReply('');
  };

  const onStartThread = (e) => {
    e.preventDefault();
    setNewErr('');
    const uidInternal = String(newClientId || '').trim();
    const open = String(newOpenText || '').trim();
    if (!uidInternal || !open) {
      setNewErr('Choose one of your clients and enter your first message.');
      return;
    }
    const id = startCoachClientThread(uidInternal, open);
    if (!id) {
      setNewErr('Could not start chat — pick one of your assigned clients at this branch.');
      return;
    }
    setSelectedId(id);
    setNewOpenText('');
  };

  return (
    <div className="msgPg msgPg--chat coachMsgPg">
      <header className="fu-pageHeader">
        <div>
          <h1>Messages</h1>
          <p>
            Chat with clients assigned to you at this branch. Same threads sync with the gym Messages inbox.
          </p>
        </div>
      </header>

      <section className="msgPg__layout">
        <aside className="fu-card msgPg__sidebar">
          <form className="coachMsgPg__new" onSubmit={onStartThread}>
            <p className="coachMsgPg__newTitle">New conversation</p>
            <label className="fu-label" htmlFor="coach-msg-member">
              Client
            </label>
            <select
              id="coach-msg-member"
              className="fu-input coachMsgPg__select"
              value={newClientId}
              onChange={(e) => setNewClientId(e.target.value)}
            >
              <option value="">Select client…</option>
              {myClients.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} · {u.fitupUserId || u.id}
                </option>
              ))}
            </select>
            <label className="fu-label" htmlFor="coach-msg-open">
              First message
            </label>
            <textarea
              id="coach-msg-open"
              className="fu-input coachMsgPg__textarea"
              rows={3}
              placeholder="Introduce yourself or confirm the session…"
              value={newOpenText}
              onChange={(e) => setNewOpenText(e.target.value)}
            />
            {newErr ? <p className="coachMsgPg__err">{newErr}</p> : null}
            <button type="submit" className="fu-btn fu-btn--primary coachMsgPg__startBtn">
              Start chat
            </button>
          </form>

          <div className="msgPg__searchWrap">
            <input
              className="fu-input msgPg__search"
              placeholder="Search…"
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
              const tail =
                Array.isArray(m.memberChatTail) && m.memberChatTail.length > 0
                  ? m.memberChatTail[m.memberChatTail.length - 1]?.body || ''
                  : '';
              const preview = tail || lastReply || m.message || '';
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
            {filtered.length === 0 ? (
              <p className="msgPg__empty">No conversations yet. Start one above.</p>
            ) : null}
          </div>
        </aside>

        <article className="fu-card msgPg__chat">
          {selected ? (
            <>
              <header className="msgPg__chatHead">
                <span className="msgPg__avatar msgPg__avatar--head">{initials(selected.userName)}</span>
                <div>
                  <h2>{selected.userName}</h2>
                  <p className="coachMsgPg__sub">
                    {selectedMember?.fitupUserId
                      ? `Client ID ${selectedMember.fitupUserId}`
                      : 'Member'}
                  </p>
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
                      {item.type === 'outgoing' ? (
                        <small className="msgPg__bubbleMeta">
                          Chat · {item.employeeName || 'Coach'}
                        </small>
                      ) : (
                        <small className="msgPg__bubbleMeta">Member</small>
                      )}
                      <time>{formatClock(item.at)}</time>
                    </div>
                  </div>
                ))}
              </div>

              <div className="msgPg__composer coachMsgPg__composer">
                <input
                  className="fu-input msgPg__composerInput coachMsgPg__composerInput"
                  placeholder="Type a message…"
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
                  Send
                </button>
              </div>
            </>
          ) : (
            <p className="msgPg__empty">Select a conversation or start a new chat.</p>
          )}
        </article>
      </section>
    </div>
  );
}
