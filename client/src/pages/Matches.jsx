import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { matchAPI } from "../services/api";

const Matches = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    matchAPI
      .getMatches()
      .then((res) => setMatches(res.data))
      .catch((err) => setError(err.response?.data?.message || "Failed to load matches"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="center-text">Finding your matches...</p>;
  if (error) return <p className="error-text">{error}</p>;

  return (
    <div className="page">
      <h2>Your Matches</h2>
      {matches.length === 0 && (
        <p>
          No matches yet. Add skills you want to learn on your{" "}
          <Link to="/profile">profile</Link> to get started.
        </p>
      )}
      <div className="match-list">
        {matches.map((m) => (
          <div className="match-card" key={m.userId}>
            <div className="match-card-header">
              <h3>{m.name}</h3>
              {m.isMutual && <span className="badge">Mutual Match</span>}
            </div>
            <p>Score: {m.score} • Rating: {m.rating?.toFixed?.(1) || "N/A"}</p>
            <p>They teach what you want: {m.theyTeachYouWant.join(", ") || "—"}</p>
            {m.youTeachTheyWant.length > 0 && (
              <p>You teach what they want: {m.youTeachTheyWant.join(", ")}</p>
            )}
            <p>Availability overlap: {m.availabilityOverlap} slot(s)</p>
            <Link to={`/chat/${m.userId}`} className="cta-button-small">
              Message
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Matches;
