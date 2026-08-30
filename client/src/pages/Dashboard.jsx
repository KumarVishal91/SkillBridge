import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="page">
      <h2>Welcome back, {user?.name}</h2>
      <div className="card-grid">
        <div className="card">
          <h3>Your Teaching Skills</h3>
          {user?.skillsTeach?.length ? (
            <ul>
              {user.skillsTeach.map((s) => (
                <li key={s.name}>{s.name} ({s.level})</li>
              ))}
            </ul>
          ) : (
            <p>No skills added yet. Update your <Link to="/profile">profile</Link>.</p>
          )}
        </div>
        <div className="card">
          <h3>Skills You Want to Learn</h3>
          {user?.skillsWant?.length ? (
            <ul>
              {user.skillsWant.map((s) => (
                <li key={s.name}>{s.name}</li>
              ))}
            </ul>
          ) : (
            <p>No learning goals added yet. Update your <Link to="/profile">profile</Link>.</p>
          )}
        </div>
        <div className="card">
          <h3>Stats</h3>
          <p>Rating: {user?.rating?.toFixed?.(1) || "N/A"}</p>
          <p>Completed sessions: {user?.completedSessions || 0}</p>
        </div>
      </div>
      <Link to="/matches" className="cta-button">Find your matches →</Link>
    </div>
  );
};

export default Dashboard;
