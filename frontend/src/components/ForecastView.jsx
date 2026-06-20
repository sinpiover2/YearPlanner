import YearOutlookStrip from "./YearOutlookStrip";
import YearTimeline from "./YearTimeline";
import ForecastSummaryCards from "./ForecastSummaryCards";

function ForecastView({
  overallForecastStateClass,
  overallForecastMessage,
  overallForecastDetail,
  forecastedSections,
  units,
  lessons,
  timelineSyncSummaries,
  sectionForecasts,
  hasForecastProgress,
}) {
  return (
    <section className="workspace-panel forecast-panel">
      <div className="forecast-header">
        <h2>Pacing Forecast</h2>
        <p>
          A calm check on section pacing, buffer remaining, and whether anything
          needs attention.
        </p>
      </div>

      <section className="forecast-section">
        <h3>Pacing Summary</h3>

        <div className={`forecast-status-banner ${overallForecastStateClass}`}>
          <strong>{overallForecastMessage}</strong>
          <span>{overallForecastDetail}</span>
        </div>

        <YearOutlookStrip forecastedSections={forecastedSections} />

        <YearTimeline
          forecastedSections={forecastedSections}
          units={units}
          lessons={lessons}
          timelineSyncSummaries={timelineSyncSummaries}
        />

        <ForecastSummaryCards
          forecastedSections={forecastedSections}
          sectionForecasts={sectionForecasts}
          hasForecastProgress={hasForecastProgress}
        />
      </section>
    </section>
  );
}

export default ForecastView;
