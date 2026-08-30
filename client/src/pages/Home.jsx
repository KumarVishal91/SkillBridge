import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="page hero">
      <h1>SkillBridge</h1>
      <p>Learn what you want by teaching what you know.</p>
      <p>
        No money changes hands — trade React for Python, design for guitar, whatever
        you've got for whatever you want.
      </p>
      {user ? (
        <Link to="/dashboard" className="cta-button">Go to Dashboard</Link>
      ) : (
        <Link to="/register" className="cta-button">Get Started</Link>
      )}
    </div>
  );
};

export default Home;
