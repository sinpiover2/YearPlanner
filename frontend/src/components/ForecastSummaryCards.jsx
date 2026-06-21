import { getForecastCardSummary } from "../utils/forecastCardUtils";

function ForecastSummaryCards({
  forecastedSections,
  sectionForecasts,
  hasForecastProgress,
}) {
  if (!(sectionForecasts.length > 0 && hasForecastProgress)) return null;

  return (
    <div className="forecast-summary-grid">
      {forecastedSections.map((forecast) => {
        const summary = getForecastCardSummary(forecast);

        return (
          <article
            className={`forecast-summary-card ${summary.stateClass}`}
            key={summary.key}
          >
            <div>
              <span>{summary.heading}</span>

              <strong>{summary.state}</strong>
            </div>

            <div>
              <p>Current lesson: {summary.currentLessonText}</p>
            </div>

            <div>
              <p>{summary.projectedText}</p>
            </div>

            <div>
              <em className="forecast-recommendation">
                {summary.recommendation}
              </em>
            </div>

            <div>
              <p>{summary.paceText}</p>

              <p>
                Buffer remaining: {summary.bufferRemainingText} days
                <br />
                <small>{summary.bufferUsedText} used</small>
              </p>

              <div
                className="buffer-meter"
                aria-label={summary.bufferAriaLabel}
              >
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
      })}
    </div>
  );
}

export default ForecastSummaryCards;
