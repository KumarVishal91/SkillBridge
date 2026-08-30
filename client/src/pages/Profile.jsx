import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { userAPI } from "../services/api";

const parseSkillInput = (text) =>
  text
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((name) => ({ name, level: "intermediate" }));

const Profile = () => {
  const { user, setUser } = useAuth();
  const [bio, setBio] = useState(user?.bio || "");
  const [teachInput, setTeachInput] = useState(
    (user?.skillsTeach || []).map((s) => s.name).join(", ")
  );
  const [wantInput, setWantInput] = useState(
    (user?.skillsWant || []).map((s) => s.name).join(", ")
  );
  const [status, setStatus] = useState("");

  const handleSave = async (e) => {
    e.preventDefault();
    setStatus("Saving...");
    try {
      const res = await userAPI.updateProfile({
        bio,
        skillsTeach: parseSkillInput(teachInput),
        skillsWant: parseSkillInput(wantInput),
      });
      setUser(res.data);
      setStatus("Saved!");
    } catch (err) {
      setStatus(err.response?.data?.message || "Failed to save");
    }
  };

  return (
    <div className="page">
      <h2>Your Profile</h2>
      <form onSubmit={handleSave} className="profile-form">
        <label>
          Bio
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={500} />
        </label>
        <label>
          Skills you can teach (comma separated)
          <input
            type="text"
            value={teachInput}
            onChange={(e) => setTeachInput(e.target.value)}
            placeholder="React, Node.js, UI Design"
          />
        </label>
        <label>
          Skills you want to learn (comma separated)
          <input
            type="text"
            value={wantInput}
            onChange={(e) => setWantInput(e.target.value)}
            placeholder="Python, Machine Learning"
          />
        </label>
        <button type="submit">Save Profile</button>
        {status && <p>{status}</p>}
      </form>
    </div>
  );
};

export default Profile;
