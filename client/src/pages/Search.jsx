import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../services/api';
import Stars from '../components/Stars';
import SkillTags from '../components/SkillTags';

export default function Search() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const search = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.get('/users/search', { params: { q } });
      setResults(data);
    } catch (err) {
      setError(errMsg(err));
    }
  };

  return (
    <>
      <h2>Find a teacher</h2>
      <form className="row" onSubmit={search}>
        <input placeholder="e.g. guitar, python, spanish…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn">Search</button>
      </form>
      {error && <p className="error">{error}</p>}
      {results && results.length === 0 && <p className="muted">Nobody teaches “{q}” yet.</p>}
      <div className="grid">
        {(results || []).map((u) => (
          <div className="card" key={u._id}>
            <Link to={`/users/${u._id}`} className="name">{u.name}</Link>
            <div><Stars value={u.rating} count={u.completedSessions} /></div>
            <p className="muted small">{u.bio}</p>
            <label>Teaches</label>
            <SkillTags skills={u.teaches} highlight={[q.trim().toLowerCase()]} />
            <div style={{ marginTop: 12 }}>
              <Link className="btn" to={`/chat/${u._id}`}>Message</Link>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
