function clampPercent(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return Math.min(100, Math.max(0, num));
}

function formatPercent(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "n/a";
  return `${Math.round(num)}%`;
}

function buildAriaLabel(runway) {
  const current = formatPercent(runway?.currentPositionPercent);
  const projected = formatPercent(runway?.projectedFinishPercent);
  const end = formatPercent(runway?.endPositionPercent);
  const overflow = Number(runway?.overflowPercent || 0);

  if (overflow > 0) {
    return `Runway: current position ${current}, projected finish ${projected}, end of available runway ${end}, overflow ${Math.round(
      overflow,
    )} percent.`;
  }

  return `Runway: current position ${current}, projected finish ${projected}, end of available runway ${end}.`;
}

function ForecastRunway({ runway }) {
  const stateClass = runway?.stateClass || "on-track";

  const currentPosition = clampPercent(runway?.currentPositionPercent);
  const projectedRaw = Number(runway?.projectedFinishPercent);
  const projectedPosition = clampPercent(runway?.projectedFinishPercent);
  const endPosition = clampPercent(runway?.endPositionPercent ?? 100);

  const hasProjected = Number.isFinite(projectedRaw);
  const hasEnd = endPosition !== null;
  const hasOverflow =
    hasProjected &&
    hasEnd &&
    projectedRaw > Number(runway?.endPositionPercent ?? 100);

  const overflowWithinTrackWidth =
    hasOverflow && endPosition !== null
      ? Math.max(0, Math.min(projectedRaw, 100) - endPosition)
      : 0;

  const projectedMarkerPosition =
    projectedPosition !== null ? projectedPosition : null;

  return (
    <div
      className={`forecast-runway ${stateClass}`}
      role="group"
      aria-label={buildAriaLabel(runway)}
    >
      <div className="forecast-runway-track" aria-hidden="true">
        {hasOverflow &&
          overflowWithinTrackWidth > 0 &&
          endPosition !== null && (
            <span
              className="forecast-runway-overflow"
              style={{
                left: `${endPosition}%`,
                width: `${overflowWithinTrackWidth}%`,
              }}
            />
          )}

        {currentPosition !== null && (
          <span
            className="forecast-runway-marker forecast-runway-marker-current"
            title="Current position"
            style={{
              left: `${currentPosition}%`,
            }}
          />
        )}

        {endPosition !== null && (
          <span
            className="forecast-runway-marker forecast-runway-marker-end"
            title="Last day / end position"
            style={{
              left: `${endPosition}%`,
            }}
          />
        )}

        {projectedMarkerPosition !== null && (
          <span
            className="forecast-runway-marker forecast-runway-marker-projected"
            title="Projected finish"
            style={{
              left: `${projectedMarkerPosition}%`,
            }}
          />
        )}
      </div>
    </div>
  );
}

export default ForecastRunway;
