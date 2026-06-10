import { useEffect, useState } from 'react'
import './App.css'
import { fetchPlannerData } from './api'

function formatDate(value) {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'America/Los_Angeles',
  })
}

function getProjectedUnits(courseUnits, schoolCalendar) {
  const schoolDays = schoolCalendar.filter(
    (day) => day.DayType === 'School'
  )

  let cursor = 0

  return courseUnits.map((unit) => {
    const requiredDays = Number(unit.RequiredDays || 0)

    const startDay = schoolDays[cursor]
    const endDay = schoolDays[cursor + requiredDays - 1]

    cursor += requiredDays

    return {
      ...unit,
      projectedStart: startDay?.Date ?? null,
      projectedEnd: endDay?.Date ?? null,
    }
  })
}

function App() {
  const [plannerData, setPlannerData] = useState(null)
  const [status, setStatus] = useState('Loading planner data...')

  useEffect(() => {
    fetchPlannerData()
      .then((data) => {
        setPlannerData(data)
        setStatus('Connected to Google Sheets')
      })
      .catch((error) => {
        console.error(error)
        setStatus('Could not connect to Google Sheets')
      })
  }, [])

  const courses = plannerData?.courses ?? []
  const units = plannerData?.units ?? []
  const schoolCalendar = plannerData?.schoolCalendar ?? []

  const instructionalDays = schoolCalendar.filter(
    (day) => day.DayType === 'School'
  ).length

  const math8Units = units.filter((unit) => unit.CourseID === 'M8')
  const math1Units = units.filter((unit) => unit.CourseID === 'IM1')

  const getRequiredDays = (courseUnits) =>
    courseUnits.reduce(
      (sum, unit) => sum + Number(unit.RequiredDays || 0),
      0
    )

  const getOptionalDays = (courseUnits) =>
    courseUnits.reduce(
      (sum, unit) => sum + Number(unit.OptionalDays || 0),
      0
    )

  const math8RequiredDays = getRequiredDays(math8Units)
  const math1RequiredDays = getRequiredDays(math1Units)

  const math8OptionalDays = getOptionalDays(math8Units)
  const math1OptionalDays = getOptionalDays(math1Units)

  const math8Remaining = instructionalDays - math8RequiredDays
  const math1Remaining = instructionalDays - math1RequiredDays

  return (
    <main className="app">
      <header className="header">
        <div>
          <p className="eyebrow">2026–2027</p>
          <h1>Year Planner</h1>
          <p className="subtitle">
            Curriculum timeline for Math 8 and Integrated Math 1
          </p>
        </div>
      </header>

      <section className="cards">
        <div className="card">
          <p>Total instructional days</p>
          <h2>{instructionalDays || '—'}</h2>
        </div>

        <div className="card course-metric">
          <p>Math 8</p>
          <h2>{math8RequiredDays || '—'}</h2>
          <span>
            {math8OptionalDays} optional • {math8Remaining} buffer
          </span>
        </div>

        <div className="card course-metric">
          <p>Math 1</p>
          <h2>{math1RequiredDays || '—'}</h2>
          <span>
            {math1OptionalDays} optional • {math1Remaining} buffer
          </span>
        </div>
      </section>

      <section className="panel">
        <h2>Timeline Dashboard</h2>

        {courses.map((course) => {
          const courseUnits = units
            .filter((unit) => unit.CourseID === course.CourseID)
            .sort(
              (a, b) => Number(a.SortOrder) - Number(b.SortOrder)
            )

          const projectedUnits = getProjectedUnits(
            courseUnits,
            schoolCalendar
          )

          const totalDays = getRequiredDays(courseUnits)
          const optionalDays = getOptionalDays(courseUnits)

          return (
            <div
              className="timeline-course"
              key={course.CourseID}
            >
              <div className="timeline-header">
                <div>
                  <h3>{course.CourseName}</h3>

                  <p className="timeline-meta">
                    {totalDays} required • {optionalDays} optional
                  </p>
                </div>
              </div>

              <div className="timeline-row">
                {projectedUnits.map((unit) => {
                  const requiredDays = Number(
                    unit.RequiredDays || 0
                  )

                  const hasProjectedDates =
                    unit.projectedStart &&
                    unit.projectedEnd

                  return (
                    <div
                      className="unit-block"
                      key={unit.UnitID}
                      style={{ flexGrow: requiredDays }}
                      title={`${unit.UnitTitle}: ${requiredDays} days`}
                    >
                      <span>U{unit.UnitNumber}</span>

                      <strong>
                        {unit.UnitTitle}
                      </strong>

                      <small>{requiredDays}d</small>

                      <em
                        className={
                          hasProjectedDates
                            ? 'date-pill'
                            : 'date-pill pending'
                        }
                      >
                        {hasProjectedDates
                          ? `${formatDate(
                              unit.projectedStart
                            )}–${formatDate(
                              unit.projectedEnd
                            )}`
                          : 'Pending'}
                      </em>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </section>
    </main>
  )
}

export default App