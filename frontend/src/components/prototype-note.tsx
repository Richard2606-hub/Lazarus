export function PrototypeNote() {
  return (
    <aside className="prototype-note" aria-label="Prototype coverage notice">
      <span className="status-dot" aria-hidden="true" />
      <div>
        <strong>Bounded prototype corpus</strong>
        <p>
          Empty results indicate no match in the current demonstration data, not proof
          that an approach has never been attempted.
        </p>
      </div>
    </aside>
  );
}
