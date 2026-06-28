import YearTimeline from "./YearTimeline";
import ForecastSummaryCards from "./ForecastSummaryCards";

const showYearOutlook = false;

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
      </div>

      <section className="forecast-section">
        <div className={`forecast-status-banner ${overallForecastStateClass}`}>
          <strong>{overallForecastMessage}</strong>
          <span>{overallForecastDetail}</span>
        </div>

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
