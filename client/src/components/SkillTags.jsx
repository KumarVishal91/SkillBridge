export default function SkillTags({ skills = [], tone = 'teach', highlight = [] }) {
  if (!skills.length) return <span className="muted small">—</span>;
  return (
    <span className="tags">
      {skills.map((s) => (
        <span key={s.name} className={`tag ${tone} ${highlight.includes(s.name) ? 'hl' : ''}`}>
          {s.name}
          {s.level && <em> · {s.level}</em>}
        </span>
      ))}
    </span>
  );
}
