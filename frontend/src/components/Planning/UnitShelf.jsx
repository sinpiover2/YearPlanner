function UnitShelf({ shelf }) {
  return (
    <footer className="unit-shelf">
      <button className="unit-shelf-toggle">⌃</button>
      <span className="unit-shelf-label">{shelf.unitLabel}</span>

      <div className="unit-shelf-items">
        {shelf.items.map((item) => (
          <button className="unit-shelf-item" key={item.id}>
            {item.title}
          </button>
        ))}
      </div>

      <span className="unit-shelf-summary">{shelf.summary}</span>
    </footer>
  );
}

export default UnitShelf;
