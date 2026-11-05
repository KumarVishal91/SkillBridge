import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api, { errMsg } from '../services/api';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const LEVELS = ['beginner', 'intermediate', 'advanced'];
const SUGGESTED = [
  'react', 'javascript', 'typescript', 'c++', 'java', 'python',
  'node.js', 'mongodb', 'sql', 'html/css', 'mern', 'dsa',
  'system design', 'git', 'docker', 'figma', 'ui design',
  'machine learning', 'guitar', 'spanish', 'cooking',
];
function SkillEditor({ title, items, onChange }) {
  const [name, setName] = useState('');
  const [level, setLevel] = useState('intermediate');

  const addSkill = (raw) => {
    const n = raw.trim().toLowerCase();
    if (!n || items.some((i) => i.name === n)) return;
    onChange([...items, { name: n, level }]);
  };

  const add = () => {
    addSkill(name);
    setName('');
  };

  const remaining = SUGGESTED.filter((s) => !items.some((i) => i.name === s));

  return (
    <div className="card">
      <h3>{title}</h3>
      <div className="tags" style={{ marginBottom: 10 }}>
        {items.map((s) => (
          <span key={s.name} className="tag teach">
            {s.name} <em>· {s.level}</em>{' '}
            <button className="x" onClick={() => onChange(items.filter((i) => i.name !== s.name))}>×</button>
          </span>
        ))}
        {!items.length && <span className="muted small">Nothing added yet</span>}
      </div>

      <div className="row">
        <input
          placeholder="Add a skill"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
        />
        <select value={level} onChange={(e) => setLevel(e.target.value)}>
          {LEVELS.map((l) => <option key={l}>{l}</option>)}
        </select>
        <button type="button" className="btn" onClick={add}>Add</button>
      </div>

      {remaining.length > 0 && (
        <>
          <label>Quick add (click to add at the level selected above)</label>
          <div className="tags">
            {remaining.map((s) => (
              <button key={s} type="button" className="chip" onClick={() => addSkill(s)}>
                + {s}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function AvailabilityEditor({ items, onChange }) {
  const [slot, setSlot] = useState({ day: 1, start: 18, end: 20 });
  const add = () => {
    if (slot.end <= slot.start) return;
    onChange([...items, { ...slot }]);
  };
  return (
    <div className="card">
      <h3>Weekly availability</h3>
      <div className="tags" style={{ marginBottom: 10 }}>
        {items.map((s, i) => (
          <span key={i} className="tag want">
            {DAYS[s.day]} {s.start}:00–{s.end}:00{' '}
            <button className="x" onClick={() => onChange(items.filter((_, j) => j !== i))}>×</button>
          </span>
        ))}
        {!items.length && <span className="muted small">No slots yet</span>}
      </div>
      <div className="row">
        <select value={slot.day} onChange={(e) => setSlot({ ...slot, day: +e.target.value })}>
          {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
        </select>
        <input type="number" min="0" max="23" value={slot.start} onChange={(e) => setSlot({ ...slot, start: +e.target.value })} />
        <span className="muted">to</span>
        <input type="number" min="1" max="24" value={slot.end} onChange={(e) => setSlot({ ...slot, end: +e.target.value })} />
        <button type="button" className="btn" onClick={add}>Add</button>
      </div>
    </div>
  );
}

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    name: user.name,
    bio: user.bio || '',
    teaches: user.teaches || [],
    wants: user.wants || [],
    availability: user.availability || [],
  });
  const [status, setStatus] = useState('');

  const save = async () => {
    setStatus('Saving…');
    try {
      const { data } = await api.put('/users/me', form);
      setUser(data);
      setStatus('Saved ✓');
    } catch (e) {
      setStatus(errMsg(e));
    }
  };

  return (
    <>
      <h2>Your profile</h2>
      <div className="card">
        <label>Name</label>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <label>Bio</label>
        <textarea rows="3" maxLength="300" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
      </div>
      <SkillEditor title="🎓 I can teach" items={form.teaches} onChange={(teaches) => setForm({ ...form, teaches })} />
      <SkillEditor title="📚 I want to learn" items={form.wants} onChange={(wants) => setForm({ ...form, wants })} />
      <AvailabilityEditor items={form.availability} onChange={(availability) => setForm({ ...form, availability })} />
      <div className="row">
        <button className="btn" onClick={save}>Save profile</button>
        <span className="muted">{status}</span>
      </div>
    </>
  );
}
