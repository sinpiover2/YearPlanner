import { getForecastCardSummary } from "../utils/forecastCardUtils";

const severityOrder = {
  "Buffer Exhausted": 0,
  "Needs Attention": 1,
  Monitoring: 2,
  "On Track": 3,
};

function isOnTrackForecast(forecast) {
  return (forecast.state || "On Track") === "On Track";
}

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

function summarizeForecastWithDebug(forecast) {
  console.log(
    forecast.section?.Period,
    forecast.state,
    forecast.projectionState,
  );

  return getForecastCardSummary(forecast);
}

function getAttentionGroups(forecastedSections) {
  const sortedForecasts = sortForecastsBySeverity(forecastedSections);

  return {
    attentionSummaries: sortedForecasts
      .filter((forecast) => !isOnTrackForecast(forecast))
      .map((forecast) => summarizeForecastWithDebug(forecast)),
    onTrackSummaries: sortedForecasts
      .filter(isOnTrackForecast)
      .map((forecast) => summarizeForecastWithDebug(forecast)),
  };
}

function ForecastSummaryCard({ summary }) {
  return (
    <article className={`forecast-summary-card ${summary.stateClass}`}>
      <div className="forecast-card-header">
        <span>{summary.heading}</span>

        <strong>{summary.state}</strong>
      </div>

      <div className="forecast-card-body">
        {summary.currentLessonText && (
          <p>Current lesson: {summary.currentLessonText}</p>
        )}
        <p>{summary.paceText}</p>
        <p>{summary.projectionState}</p>
        <p>{summary.projectedText}</p>
        <p>{summary.recoverabilityText}</p>

        <em className="forecast-recommendation">{summary.recommendation}</em>
      </div>
    </article>
  );
}

function OnTrackSummaryCard({ summaries }) {
  if (summaries.length === 0) return null;

  const sectionList = summaries.map((summary) => summary.heading).join(" and ");
  const sectionLabel = summaries.length === 1 ? "section is" : "sections are";

  return (
    <article className="forecast-summary-card on-track forecast-summary-card-calm">
      <div className="forecast-card-header">
        <span>Everything else</span>

        <strong>Comfortably on pace.</strong>
      </div>

      <p>
        {sectionList} {sectionLabel} on track. No action needed.
      </p>
    </article>
  );
}

function ForecastSummaryCards({
  forecastedSections,
  sectionForecasts,
  hasForecastProgress,
}) {
  if (!(sectionForecasts.length > 0 && hasForecastProgress)) return null;

  const { attentionSummaries, onTrackSummaries } =
    getAttentionGroups(forecastedSections);

  return (
    <div className="forecast-summary-grid">
      {attentionSummaries.map((summary) => (
        <ForecastSummaryCard summary={summary} key={summary.key} />
      ))}

      <OnTrackSummaryCard summaries={onTrackSummaries} />
    </div>
  );
}

export default ForecastSummaryCards;
