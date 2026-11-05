import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../services/api';
import Stars from '../components/Stars';
import SkillTags from '../components/SkillTags';
import { useSocket } from '../context/SocketContext';

export default function Matches() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const { onlineIds } = useSocket();

  useEffect(() => {
    api.get('/users/matches').then((r) => setData(r.data)).catch((e) => setError(errMsg(e)));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p className="muted">Finding your matches…</p>;

  const { matches, chains } = data;

  return (
    <>
      <h2>Your matches</h2>
      <p className="muted">Ranked by mutual fit, rating, sessions and availability overlap.</p>

      {matches.length === 0 && (
        <div className="card">
          <p>No matches yet. Add skills you can <b>teach</b> and skills you <b>want</b> on your <Link to="/profile">profile</Link>.</p>
        </div>
      )}

      <div className="grid">
        {matches.map((m) => (
          <div className="card match" key={m.user._id}>
            <div className="row between">
              <div>
                <Link to={`/users/${m.user._id}`} className="name">{m.user.name}</Link>{' '}
                {onlineIds.has(m.user._id) && <span className="dot" title="Online" />}
                <div><Stars value={m.user.rating} count={m.user.completedSessions} /></div>
              </div>
              <div className="score" title="Match score">
                {m.score}
                <span>{m.mutual ? 'mutual' : 'one-way'}</span>
              </div>
            </div>
            <p className="muted small">{m.user.bio}</p>
            <div className="swap">
              <div>
                <label>They teach you</label>
                <SkillTags skills={m.theyTeachYou.map((n) => ({ name: n }))} tone="teach" />
              </div>
              <div>
                <label>You teach them</label>
                <SkillTags skills={m.youTeachThem.map((n) => ({ name: n }))} tone="want" />
              </div>
            </div>
            <p className="small muted">
              🕒 {m.overlapHours > 0 ? `${m.overlapHours}h/week overlap` : 'No shared availability yet'}
            </p>
            <div className="row">
              <Link className="btn" to={`/chat/${m.user._id}`}>Message</Link>
              <Link className="btn ghost" to={`/users/${m.user._id}`}>📅 Book session</Link>
            </div>
          </div>
        ))}
      </div>

      {chains.length > 0 && (
        <>
          <h3>🔗 Skill chains</h3>
          <p className="muted">No direct swap found — but a 3-way exchange could work:</p>
          {chains.map((c, i) => (
            <div className="card" key={i}>
              {c.path.map((p, j) => (
                <div key={j} className="small">
                  <b>{p.teacher}</b> teaches <span className="tag teach">{p.skill}</span> to <b>{p.learner}</b>
                </div>
              ))}
            </div>
          ))}
        </>
      )}
    </>
  );
}
