// Shared "Sort students by" control rendered wherever roster printing is
// initiated (standalone Print Rosters, Print lesson, Print Day). sortBy/
// onChange are fully controlled by the caller so the same session-remembered
// value stays in sync across every placement.
function RosterSortToggle({ name, sortBy, onChange }) {
  return (
    <fieldset className="roster-sort-toggle">
      <legend>Sort students by</legend>
      <label className="roster-sort-toggle-option">
        <input
          type="radio"
          name={name}
          value="last"
          checked={sortBy === "last"}
          onChange={() => onChange("last")}
        />
        Last name
      </label>
      <label className="roster-sort-toggle-option">
        <input
          type="radio"
          name={name}
          value="first"
          checked={sortBy === "first"}
          onChange={() => onChange("first")}
        />
        First name
      </label>
    </fieldset>
  );
}

export default RosterSortToggle;
