import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../services/api';
import { useAuth } from '../context/AuthContext';

const fmt = (d) =>
  new Date(d).toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function Sessions() {
  const { user } = useAuth();
  const [list, setList] = useState(null);
  const [msg, setMsg] = useState('');

  const load = () => api.get('/bookings').then((r) => setList(r.data)).catch((e) => setMsg(errMsg(e)));
  useEffect(() => { load(); }, []);

  const act = async (id, action) => {
    setMsg('');
    try {
      await api.patch(`/bookings/${id}`, { action });
      await load();
    } catch (e) {
      setMsg(errMsg(e));
    }
  };

  if (!list) return <p className="muted">{msg || 'Loading sessions…'}</p>;

  const other = (b) => (b.proposer._id === user._id ? b.partner : b.proposer);
  const incoming = list.filter((b) => b.status === 'pending' && b.partner._id === user._id);
  const outgoing = list.filter((b) => b.status === 'pending' && b.proposer._id === user._id);
  const upcoming = list.filter((b) => b.status === 'accepted');
  const past = list.filter((b) => ['completed', 'declined', 'cancelled'].includes(b.status)).reverse();

  const Card = ({ b, children }) => (
    <div className="card session">
      <div>
        <h4>
          <span className="tag teach">{b.skill}</span> with{' '}
          <Link to={`/users/${other(b)._id}`}>{other(b).name}</Link>
        </h4>
        <div className="muted small">
          🕒 {fmt(b.start)} · {b.durationMin} min <span className={`pill ${b.status}`}>{b.status}</span>
        </div>
        {b.note && <div className="small muted">“{b.note}”</div>}
      </div>
      <div className="row">{children}</div>
    </div>
  );

  const Section = ({ title, items, render }) =>
    items.length > 0 && (
      <>
        <h3>{title}</h3>
        {items.map((b) => <Card key={b._id} b={b}>{render(b)}</Card>)}
      </>
    );

  return (
    <>
      <h2>Sessions</h2>
      <div className="stats">
        <div className="stat"><b>{incoming.length}</b><span>Waiting for your reply</span></div>
        <div className="stat"><b>{upcoming.length}</b><span>Upcoming</span></div>
        <div className="stat"><b>{list.filter((b) => b.status === 'completed').length}</b><span>Completed</span></div>
      </div>
      {msg && <p className="error">{msg}</p>}

      {list.length === 0 && (
        <div className="card">
          <p>No sessions yet. Open a match’s profile and press <b>Book a session</b>.</p>
        </div>
      )}

      <Section title="📩 Requests for you" items={incoming} render={(b) => (
        <>
          <button className="btn small" onClick={() => act(b._id, 'accept')}>Accept</button>
          <button className="btn small danger" onClick={() => act(b._id, 'decline')}>Decline</button>
        </>
      )} />

      <Section title="📅 Upcoming" items={upcoming} render={(b) => (
        <>
          <a className="btn small" href={b.meetingLink} target="_blank" rel="noreferrer">🎥 Join video call</a>
          <button className="btn small ghost" onClick={() => act(b._id, 'complete')}>Mark completed</button>
          <button className="btn small danger" onClick={() => act(b._id, 'cancel')}>Cancel</button>
        </>
      )} />

      <Section title="⏳ Waiting for their reply" items={outgoing} render={(b) => (
        <button className="btn small danger" onClick={() => act(b._id, 'cancel')}>Cancel request</button>
      )} />

      <Section title="🗂️ History" items={past} render={(b) =>
        b.status === 'completed' && <Link className="btn small ghost" to={`/users/${other(b)._id}`}>⭐ Rate</Link>
      } />
    </>
  );
}
