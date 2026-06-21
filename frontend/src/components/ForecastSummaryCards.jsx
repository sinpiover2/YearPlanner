import { getForecastCardSummary } from "../utils/forecastCardUtils";

const severityOrder = {
  "Buffer Exhausted": 0,
  "Needs Attention": 1,
  Monitoring: 2,
  "On Track": 3,
};

function sortForecastsBySeverity(forecastedSections) {
  return forecastedSections
    .map((forecast, index) => ({ forecast, index }))
    .sort((a, b) => {
      const aSeverity = severityOrder[a.forecast.state || "On Track"] ?? 3;
      const bSeverity = severityOrder[b.forecast.state || "On Track"] ?? 3;

      if (aSeverity !== bSeverity) return aSeverity - bSeverity;

      return a.index - b.index;
    })
    .map(({ forecast }) => forecast);
}

function ForecastSummaryCard({ summary }) {
  return (
    <article
      className={`forecast-summary-card ${summary.stateClass}`}
      key={summary.key}
    >
      <div className="forecast-card-header">
        <span>{summary.heading}</span>

        <strong>{summary.state}</strong>
      </div>

      <div className="forecast-card-current">
        <p>Current lesson: {summary.currentLessonText}</p>
      </div>

      <div className="forecast-card-projection">
        <span className="forecast-card-section-label">Projection</span>
        <p>{summary.projectedText}</p>
      </div>

      <div className="forecast-card-action">
        <span className="forecast-card-section-label">Recommendation</span>
        <em className="forecast-recommendation">{summary.recommendation}</em>
      </div>

      <div className="forecast-card-supporting-info">
        <span className="forecast-card-section-label">Details</span>
        <p>{summary.paceText}</p>

        <p>
          Buffer remaining: {summary.bufferRemainingText} days
          <br />
          <small>{summary.bufferUsedText} used</small>
        </p>

        <div className="buffer-meter" aria-label={summary.bufferAriaLabel}>
          <div
            className={`buffer-meter-fill ${summary.stateClass}`}
            style={{
              width: `${summary.meterWidth}%`,
            }}
          />
        </div>
      </div>
    </article>
  );
}

function ForecastSummaryCards({
  forecastedSections,
  sectionForecasts,
  hasForecastProgress,
}) {
  if (!(sectionForecasts.length > 0 && hasForecastProgress)) return null;

  const summaries = sortForecastsBySeverity(forecastedSections).map(
    (forecast) => getForecastCardSummary(forecast),
  );

  return (
    <div className="forecast-summary-grid">
      {summaries.map((summary) => (
        <ForecastSummaryCard summary={summary} key={summary.key} />
      ))}
    </div>
  );
}

export default ForecastSummaryCards;
