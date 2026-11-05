import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errMsg } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Stars from '../components/Stars';
import SkillTags from '../components/SkillTags';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// value for <input type="datetime-local"> in local time, rounded up to next hour
const defaultStart = () => {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setMinutes(0, 0, 0);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

function BookForm({ other, mySkills }) {
  const skills = [...new Set([...(other.teaches || []).map((s) => s.name), ...mySkills])];
  const [form, setForm] = useState({ skill: skills[0] || '', start: defaultStart(), durationMin: 60, note: '' });
  const [status, setStatus] = useState({ type: '', text: '' });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', text: 'Sending…' });
    try {
      await api.post('/bookings', {
        partnerId: other._id,
        skill: form.skill,
        start: new Date(form.start).toISOString(),
        durationMin: +form.durationMin,
        note: form.note,
      });
      setStatus({ type: 'ok', text: 'Request sent ✓ — track it under Sessions.' });
    } catch (err) {
      setStatus({ type: 'error', text: errMsg(err) });
    }
  };

  if (!skills.length) return null;

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>📅 Book a session</h3>
      <form className="book-form" onSubmit={submit}>
        <div>
          <label>Skill</label>
          <select value={form.skill} onChange={set('skill')} style={{ width: '100%' }}>
            {skills.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label>When</label>
          <input type="datetime-local" value={form.start} onChange={set('start')} required style={{ width: '100%' }} />
        </div>
        <div>
          <label>Duration</label>
          <select value={form.durationMin} onChange={set('durationMin')} style={{ width: '100%' }}>
            {[30, 45, 60, 90, 120].map((m) => <option key={m} value={m}>{m} min</option>)}
          </select>
        </div>
        <div className="full">
          <input placeholder="Optional note (what do you want to cover?)" maxLength="200" value={form.note} onChange={set('note')} style={{ width: '100%' }} />
        </div>
        <div className="full row">
          <button className="btn">Send request</button>
          <span className={`small ${status.type}`}>{status.text}</span>
        </div>
      </form>
    </div>
  );
}

export default function UserProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const [u, setU] = useState(null);
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');
  const [msg, setMsg] = useState('');

  const load = () => api.get(`/users/${id}`).then((r) => setU(r.data)).catch((e) => setMsg(errMsg(e)));
  useEffect(() => { load(); }, [id]);

  const rate = async () => {
    try {
      await api.post(`/users/${id}/rate`, { stars, comment });
      setMsg('Thanks for rating ✓');
      setComment('');
      load();
    } catch (e) {
      setMsg(errMsg(e));
    }
  };

  if (!u) return <p className="muted">{msg || 'Loading…'}</p>;
  const isMe = u._id === user._id;

  return (
    <>
      <div className="card">
        <h2 style={{ margin: 0 }}>{u.name}</h2>
        <Stars value={u.rating} count={u.ratingCount} />
        <p>{u.bio}</p>
        <label>Teaches</label><SkillTags skills={u.teaches} />
        <label>Wants to learn</label><SkillTags skills={u.wants} tone="want" />
        <label>Availability</label>
        <div className="tags">
          {u.availability?.length ? u.availability.map((s, i) => (
            <span key={i} className="tag want">{DAYS[s.day]} {s.start}–{s.end}h</span>
          )) : <span className="muted small">—</span>}
        </div>
        <div className="row" style={{ marginTop: 14 }}>
          {!isMe && <Link className="btn" to={`/chat/${u._id}`}>Message</Link>}
          <span className="muted small">{u.completedSessions || 0} sessions completed</span>
        </div>
      </div>

      {!isMe && <BookForm other={u} mySkills={(user.teaches || []).map((s) => s.name)} />}

      {!isMe && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Rate {u.name.split(' ')[0]}</h3>
          <div className="row">
            <select value={stars} onChange={(e) => setStars(+e.target.value)}>
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{'★'.repeat(n)}</option>)}
            </select>
            <input placeholder="Optional comment" value={comment} onChange={(e) => setComment(e.target.value)} />
            <button className="btn" onClick={rate}>Submit</button>
          </div>
          {msg && <p className="small muted">{msg}</p>}
        </div>
      )}

      <h3>Reviews</h3>
      {u.reviews?.length === 0 && <p className="muted">No reviews yet.</p>}
      {u.reviews?.map((r) => (
        <div className="card" key={r._id}>
          <b>{r.reviewer?.name || 'Someone'}</b> <span className="star">{'★'.repeat(r.stars)}</span>
          <p className="muted small">{r.comment}</p>
        </div>
      ))}
    </>
  );
}
