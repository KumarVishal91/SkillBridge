export default function Stars({ value = 0, count }) {
  if (!value) return <span className="muted small">No ratings yet</span>;
  return (
    <span className="small">
      <span className="star">★</span> {value.toFixed(1)}
      {count !== undefined && <span className="muted"> ({count})</span>}
    </span>
  );
}
