import {
  getCourseLabel,
  formatDayPhrase,
  formatDays,
} from "../utils/plannerUtils";

function ForecastSummaryCards({
  forecastedSections,
  sectionForecasts,
  hasForecastProgress,
}) {
  if (!(sectionForecasts.length > 0 && hasForecastProgress)) return null;

  return (
    <div className="forecast-summary-grid">
      {forecastedSections.map((forecast) => {
        const section = forecast.section ?? {};
        const state = forecast.state || "On Track";
        const stateClass = forecast.visualStateClass || "on-track";
        const variance = Number(forecast.variance || 0);
        const forecastShift = Number(forecast.forecastShift || 0);

        return (
          <article
            className={`forecast-summary-card ${stateClass}`}
            key={section.SectionID || `${section.CourseID}-${section.Period}`}
          >
            <span>
              {getCourseLabel(section.CourseID)} · Period{" "}
              {section.Period || "—"}
            </span>

            <strong>{state}</strong>

            <p>
              Now: {forecast.currentLesson?.LessonTitle ?? "Course complete"}
            </p>

            <p>
              {variance === 0
                ? "Current pace matches plan."
                : `${formatDayPhrase(Math.abs(variance))} ${
                    variance > 0 ? "behind plan" : "ahead of plan"
                  }.`}
            </p>

            <p>
              {forecastShift === 0
                ? "Projected: On schedule."
                : `Projected: ${formatDayPhrase(Math.abs(forecastShift))} ${
                    forecastShift > 0 ? "behind" : "ahead"
                  }.`}
            </p>

            <p>
              Buffer remaining: {formatDays(forecast.bufferRemaining)} days
              <br />
              <small>{formatDays(forecast.bufferUsed)} used</small>
            </p>

            <div
              className="buffer-meter"
              aria-label={`${formatDays(
                forecast.bufferRemaining,
              )} buffer days remaining`}
            >
              <div
                className={`buffer-meter-fill ${stateClass}`}
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(0, Number(forecast.bufferRemainingPercent || 0)),
                  )}%`,
                }}
              />
            </div>

            <em className="forecast-recommendation">
              {forecast.recoverabilityMessage || "No action needed."}
            </em>
          </article>
        );
      })}
    </div>
  );
}

export default ForecastSummaryCards;
