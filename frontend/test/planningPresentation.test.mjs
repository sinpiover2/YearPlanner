import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test, { after, before } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "vite";

import {
  getCourseNavigation,
  getCourseStatus,
  getSidebarCoursePresentation,
  reconcileUnitSelection,
} from "../src/utils/courseCurriculumModel.js";
import {
  getOptionalDaysPresentation,
  getUnitPlanningModel,
  getUnitPlanningPresentation,
  getUnitState,
} from "../src/utils/unitUtils.js";

let renderSidebarComponent;
let renderUnitsComponent;
let renderLessonTableComponent;
let renderForecastCardsComponent;
let renderYearTimelineComponent;
let renderBuildDirectory;

before(async () => {
  const frontendRoot = fileURLToPath(new URL("..", import.meta.url));
  renderBuildDirectory = await mkdtemp(join(tmpdir(), "year-planner-render-"));
  const entryPath = join(renderBuildDirectory, "planning-render-entry.jsx");
  await writeFile(entryPath, `
    import React from ${JSON.stringify(join(frontendRoot, "node_modules/react/index.js"))};
    import { renderToStaticMarkup } from ${JSON.stringify(join(frontendRoot, "node_modules/react-dom/server.node.js"))};
    import Sidebar from ${JSON.stringify(join(frontendRoot, "src/components/Sidebar.jsx"))};
    import UnitsView from ${JSON.stringify(join(frontendRoot, "src/components/UnitsView.jsx"))};
    import LessonTable from ${JSON.stringify(join(frontendRoot, "src/components/LessonTable.jsx"))};
    import ForecastSummaryCards from ${JSON.stringify(join(frontendRoot, "src/components/ForecastSummaryCards.jsx"))};
    import YearTimeline from ${JSON.stringify(join(frontendRoot, "src/components/YearTimeline.jsx"))};
    export const renderSidebarComponent = (props) =>
      renderToStaticMarkup(React.createElement(Sidebar, props));
    export const renderUnitsComponent = (props) =>
      renderToStaticMarkup(React.createElement(UnitsView, props));
    export const renderLessonTableComponent = (props) =>
      renderToStaticMarkup(React.createElement(LessonTable, props));
    export const renderForecastCardsComponent = (props) =>
      renderToStaticMarkup(React.createElement(ForecastSummaryCards, props));
    export const renderYearTimelineComponent = (props) =>
      renderToStaticMarkup(React.createElement(YearTimeline, props));
  `);
  const result = await build({
    configFile: false,
    root: frontendRoot,
    logLevel: "silent",
    ssr: { noExternal: true },
    build: {
      write: false,
      ssr: entryPath,
      rollupOptions: { output: { format: "esm" } },
    },
  });
  const output = Array.isArray(result) ? result[0].output[0] : result.output[0];
  const bundlePath = join(renderBuildDirectory, "planning-render-bundle.mjs");
  await writeFile(bundlePath, output.code);
  ({ renderSidebarComponent, renderUnitsComponent, renderLessonTableComponent, renderForecastCardsComponent, renderYearTimelineComponent } = await import(pathToFileURL(bundlePath)));
});

after(async () => {
  await rm(renderBuildDirectory, { recursive: true, force: true });
});

const units = [
  { UnitID: "U1", CourseID: "IM1", UnitNumber: 1, SortOrder: 1, RequiredDays: 4, OptionalDays: 0 },
  { UnitID: "U2", CourseID: "IM1", UnitNumber: 2, SortOrder: 2, RequiredDays: 6, OptionalDays: 2 },
];
const lessons = [
  { LessonID: "L1", UnitID: "U1", CourseID: "IM1", SortOrder: 1, PlannedDays: 1 },
  { LessonID: "L2", UnitID: "U1", CourseID: "IM1", SortOrder: 2, PlannedDays: 1 },
];
const progress = [
  { CourseID: "IM1", UnitID: "U1", LessonID: "L1", DayFraction: 1, Finished: true },
];

test("fully planned Unit presentation retains numeric semantics", () => {
  const presentation = getUnitPlanningPresentation(getUnitPlanningModel(progress, units[0]));
  assert.deepEqual(presentation, {
    daysLabel: "1/4 days · 3 remaining",
    daysAccessibleLabel: null,
    status: "in-progress",
    statusLabel: null,
    progressPercent: 25,
    progressLabel: "25% complete",
    requiredDaysLabel: "4",
  });
});

test("unknown and invalid RequiredDays suppress numeric planning claims but retain actuals", () => {
  const unknown = getUnitPlanningPresentation(getUnitPlanningModel(progress, { ...units[0], RequiredDays: "" }));
  const invalid = getUnitPlanningPresentation(getUnitPlanningModel(progress, { ...units[0], RequiredDays: 0 }));

  assert.equal(unknown.daysLabel, "1 logged · Not planned");
  assert.equal(unknown.progressPercent, null);
  assert.equal(unknown.status, null);
  assert.equal(unknown.progressLabel, "Not planned");
  assert.equal(invalid.daysLabel, "1 logged · Invalid value");
  assert.equal(invalid.progressPercent, null);
  assert.equal(invalid.status, null);
});

test("compact unknown Unit planning uses the canonical dash with accessible wording", () => {
  const presentation = getUnitPlanningPresentation(
    getUnitPlanningModel(progress, { ...units[0], RequiredDays: "" }),
    { compact: true },
  );

  assert.equal(presentation.daysLabel, "1 logged · —");
  assert.equal(presentation.daysAccessibleLabel, "1 logged · Not planned");
});

test("optional zero remains distinct from unknown and invalid", () => {
  assert.equal(getOptionalDaysPresentation(getUnitPlanningModel([], units[0])), "0d buffer");
  assert.equal(getOptionalDaysPresentation(getUnitPlanningModel([], { ...units[0], OptionalDays: "" })), "Buffer not planned");
  assert.equal(getOptionalDaysPresentation(getUnitPlanningModel([], { ...units[0], OptionalDays: -1 })), "Invalid buffer value");
});

test("fully planned Sidebar retains numeric progress, pace, zero buffer, lesson count, and navigation", () => {
  const status = getCourseStatus("IM1", units, lessons, progress);
  const navigation = getCourseNavigation("IM1", units, lessons, progress);
  const presentation = getSidebarCoursePresentation(status, navigation);

  assert.equal(presentation.paceLabel, "On pace");
  assert.equal(presentation.progressPercent, 50);
  assert.equal(presentation.unitDaysLabel, "1 of 2 days in unit");
  assert.equal(presentation.bufferLabel, "2d buffer");
  assert.equal(status.completedCount, 1);
  assert.equal(navigation.currentLesson.LessonID, "L2");
  assert.equal(navigation.previousLesson.LessonID, "L1");
});

test("Sidebar preserves an explicit all-zero optional buffer", () => {
  const zeroBufferUnits = units.map((unit) => ({ ...unit, OptionalDays: 0 }));
  const status = getCourseStatus("IM1", zeroBufferUnits, lessons, progress);
  const navigation = getCourseNavigation("IM1", zeroBufferUnits, lessons, progress);

  assert.equal(getSidebarCoursePresentation(status, navigation).bufferLabel, "0d buffer");
});

test("incomplete required-day aggregation exposes known days without numeric progress", () => {
  const incompleteUnits = [{ ...units[0] }, { ...units[1], RequiredDays: "", OptionalDays: "" }];
  const status = getCourseStatus("IM1", incompleteUnits, lessons, progress);
  const navigation = getCourseNavigation("IM1", incompleteUnits, lessons, progress);
  const presentation = getSidebarCoursePresentation(status, navigation);

  assert.equal(presentation.progressPercent, null);
  assert.equal(presentation.unitDaysLabel, "1 logged");
  assert.equal(presentation.requiredDaysLabel, "4 known days");
  assert.equal(presentation.planningLabel, "Planning incomplete");
  assert.equal(presentation.bufferLabel, "Buffer not planned");
  assert.doesNotMatch(presentation.unitDaysLabel, /of 0|%/);
});

test("incomplete or invalid completed-lesson plans suppress variance and pace", () => {
  for (const PlannedDays of ["", 0, "bad"]) {
    const incompleteLessons = [{ ...lessons[0], PlannedDays }, lessons[1]];
    const status = getCourseStatus("IM1", units, incompleteLessons, progress);
    const navigation = getCourseNavigation("IM1", units, incompleteLessons, progress);
    const presentation = getSidebarCoursePresentation(status, navigation);

    assert.equal(presentation.paceAvailable, false);
    assert.equal(presentation.paceLabel, "Pacing unavailable");
    assert.equal(presentation.pacingPlanningLabel, "Planning days incomplete");
    assert.doesNotMatch(presentation.paceLabel, /ahead|behind|On pace|recoverable/i);
  }
});

test("presentation helpers do not mutate inputs", () => {
  const status = getCourseStatus("IM1", units, lessons, progress);
  const navigation = getCourseNavigation("IM1", units, lessons, progress);
  const statusSnapshot = structuredClone(status);
  const navigationSnapshot = structuredClone(navigation);

  getSidebarCoursePresentation(status, navigation);
  assert.deepEqual(status, statusSnapshot);
  assert.deepEqual(navigation, navigationSnapshot);
});

test("canonical Unit state withholds unsafe sequence assertions", () => {
  const sequence = [
    { ...units[0], UnitID: "DONE", RequiredDays: 1 },
    { ...units[0], UnitID: "UNKNOWN", RequiredDays: "" },
    { ...units[0], UnitID: "AFTER", RequiredDays: 3 },
  ];
  const sequenceProgress = [{ UnitID: "DONE", DayFraction: 1 }];

  assert.equal(getUnitState(sequenceProgress, sequence[0], sequence), "complete");
  assert.equal(getUnitState(sequenceProgress, sequence[1], sequence), null);
  assert.equal(getUnitState(sequenceProgress, sequence[2], sequence), null);

  const fullyPlanned = sequence.map((unit, index) => ({
    ...unit,
    RequiredDays: index === 0 ? 1 : 3,
  }));
  assert.equal(getUnitState(sequenceProgress, fullyPlanned[0], fullyPlanned), "complete");
  assert.equal(getUnitState(sequenceProgress, fullyPlanned[1], fullyPlanned), "current");
  assert.equal(getUnitState(sequenceProgress, fullyPlanned[2], fullyPlanned), "upcoming");
});

function renderUnits(
  requiredDays,
  courseUnits = null,
  { showArchivedUnits = false } = {},
) {
  const renderedUnits = courseUnits ?? [{
    ...units[0],
    RequiredDays: requiredDays,
    UnitTitle: "Expressions",
    Purpose: "Build fluency",
  }];
  const selectedUnit = renderedUnits[0];

  return renderUnitsComponent({
    courses: [{ CourseID: "IM1", CourseName: "Math 1" }],
    units: renderedUnits,
    schoolCalendar: [],
    getProjectedUnits: (value) => value,
    selectedCourseId: "IM1",
    selectedUnit,
    selectedUnitLessons: [],
    setSelectedCourseId: () => {},
    setSelectedUnitId: () => {},
    showArchivedUnits,
    setShowArchivedUnits: () => {},
    selectedDailyProgress: progress,
    selectedNavigation: { currentLesson: null, nextLesson: null },
    activeProgressLessonId: null,
    progressInputs: {},
    editingLessonId: null,
    editLessonDraft: null,
    reorderingUnitId: null,
    isAddingLesson: false,
    isAddingLessonSaving: false,
    newLesson: {},
    getLessonProgress: () => ({ actualDays: 0, finished: false }),
    getOutcomeList: () => [],
    formatVarianceCompact: String,
    formatDate: String,
  });
}

test("UnitsView renders complete, unknown, invalid, archive, and indeterminate branches", () => {
  const fullyPlanned = renderUnits(4);
  assert.match(fullyPlanned, /Current/);
  assert.match(fullyPlanned, /1 \/ 4 days/);
  assert.match(fullyPlanned, /aria-label="25% complete"/);

  const unknown = renderUnits("");
  assert.match(unknown, /1 logged · —/);
  assert.match(unknown, /aria-label="1 logged · Not planned"/);
  assert.match(unknown, /role="status">Not planned/);
  assert.doesNotMatch(unknown, /0% complete|Current|Upcoming/);

  const invalid = renderUnits(0);
  assert.match(invalid, /Invalid value/);
  assert.match(invalid, /role="status">Invalid value/);
  assert.doesNotMatch(invalid, /Current|Upcoming/);

  const siblingUnits = [
    { ...units[0], RequiredDays: 4, UnitTitle: "Active" },
    { ...units[1], UnitID: "ARCHIVE", RequiredDays: "", IsArchived: true, UnitTitle: "Archive" },
  ];
  const siblingOutput = renderUnits(4, siblingUnits, { showArchivedUnits: true });
  const archivedCard = siblingOutput.match(
    /<button class="[^"]*archived-unit[^"]*"[^>]*>[\s\S]*?<strong>Archive<\/strong>[\s\S]*?<\/button>/,
  )?.[0];

  assert.match(siblingOutput, /Show Archived Curriculum \(1\)/);
  assert.ok(archivedCard, "archived Unit card should render when archive view is enabled");
  assert.match(archivedCard, /class="units-map-card-state archived">Archived<\/span>/);
  assert.match(archivedCard, /aria-label="0 logged · Not planned">0 logged · —<\/span>/);
  assert.match(archivedCard, /role="status">Not planned<\/div>/);
  assert.match(siblingOutput, /<strong>Active<\/strong>/);
  assert.match(siblingOutput, /class="units-map-card-state current">Current<\/span>/);
  assert.match(siblingOutput, /1 \/ 4 days/);
});

test("Units detail renders the selected Unit's canonical course across course switches", () => {
  const courses = [
    { CourseID: "M8", CourseName: "Math 8" },
    { CourseID: "IM1", CourseName: "Integrated Math 1" },
  ];
  const courseUnits = [
    { UnitID: "M8-U1", CourseID: "M8", UnitNumber: 1, SortOrder: 1, UnitTitle: "Rigid Transformations" },
    { UnitID: "M8-OLD", CourseID: "M8", UnitNumber: 9, SortOrder: 9, UnitTitle: "Archived Math 8", IsArchived: true },
    { UnitID: "IM1-U1", CourseID: "IM1", UnitNumber: 1, SortOrder: 1, UnitTitle: "Patterns and Sequences" },
    { UnitID: "IM1-OLD", CourseID: "IM1", UnitNumber: 9, SortOrder: 9, UnitTitle: "Archived IM1", IsArchived: true },
  ];

  const renderCourse = (selectedCourseId, staleSelectedUnitId, showArchivedUnits) => {
    const selectedCourseUnits = courseUnits.filter(
      (unit) => unit.CourseID === selectedCourseId,
    );
    const selectedUnitId = reconcileUnitSelection({
      selectedUnitId: staleSelectedUnitId,
      courseUnits: selectedCourseUnits,
      showArchivedUnits,
    });
    const selectedUnit = selectedCourseUnits.find(
      (unit) => unit.UnitID === selectedUnitId,
    );

    return renderUnitsComponent({
      courses,
      units: courseUnits,
      schoolCalendar: [],
      getProjectedUnits: (value) => value,
      selectedCourseId,
      selectedUnit,
      selectedUnitLessons: [],
      setSelectedCourseId: () => {},
      setSelectedUnitId: () => {},
      showArchivedUnits,
      setShowArchivedUnits: () => {},
      selectedDailyProgress: [],
      selectedNavigation: { currentLesson: null, nextLesson: null },
      activeProgressLessonId: null,
      progressInputs: {},
      editingLessonId: null,
      editLessonDraft: null,
      reorderingUnitId: null,
      isAddingLesson: false,
      isAddingLessonSaving: false,
      newLesson: {},
      getLessonProgress: () => ({ actualDays: 0, finished: false }),
      getOutcomeList: () => [],
      formatVarianceCompact: String,
      formatDate: String,
    });
  };

  for (const showArchivedUnits of [false, true]) {
    const math8 = renderCourse("M8", "IM1-U1", showArchivedUnits);
    const im1 = renderCourse("IM1", "M8-U1", showArchivedUnits);
    const math8Again = renderCourse("M8", "IM1-U1", showArchivedUnits);

    assert.match(math8, />U1 · Math 8<\/span>/);
    assert.doesNotMatch(math8, /U1 · Integrated Math 1/);
    assert.equal((math8.match(/U1 · Math 8/g) ?? []).length, 1);

    assert.match(im1, />U1 · Integrated Math 1<\/span>/);
    assert.doesNotMatch(im1, /U1 · Math 8/);
    assert.equal((im1.match(/U1 · Integrated Math 1/g) ?? []).length, 1);

    assert.match(math8Again, />U1 · Math 8<\/span>/);
    assert.doesNotMatch(math8Again, /U1 · Integrated Math 1/);
  }
});

function renderSidebar(courseUnits, courseLessons = lessons) {
  const status = getCourseStatus("IM1", courseUnits, courseLessons, progress);
  const navigation = getCourseNavigation("IM1", courseUnits, courseLessons, progress);

  return renderSidebarComponent({
    timeLens: "school",
    setTimeLens: () => {},
    timeLensInfo: { label: "School", value: 10, unit: "days", bar: 50 },
    selectedCourseId: "IM1",
    setSelectedCourseId: () => {},
    setSelectedUnitId: () => {},
    math8Navigation: navigation,
    math1Navigation: navigation,
    math8Status: status,
    math1Status: status,
    selectedSection: null,
    selectedCourseSections: [],
    setSelectedSectionId: () => {},
    renderUnitChips: () => "Sequence navigation",
    math8Units: courseUnits,
    math1Units: courseUnits,
  });
}

test("Sidebar renders fully planned, unknown, and invalid canonical branches", () => {
  const fullyPlanned = renderSidebar(units);
  assert.match(fullyPlanned, /On pace/);
  assert.match(fullyPlanned, /1 of 2 days in unit/);
  assert.match(fullyPlanned, /U1 · Second lesson|U1 · Complete|U1 ·/);
  assert.match(fullyPlanned, /Sequence navigation/);

  const unknownUnits = [{ ...units[0] }, { ...units[1], RequiredDays: "" }];
  const unknown = renderSidebar(unknownUnits);
  assert.match(unknown, /Planning incomplete/);
  assert.match(unknown, /4 known days/);
  assert.doesNotMatch(unknown, /actual of 0 days/);

  const invalidUnits = [{ ...units[0] }, { ...units[1], RequiredDays: 0 }];
  const invalid = renderSidebar(invalidUnits);
  assert.match(invalid, /Invalid required-day value/);
  assert.match(invalid, /Planning data invalid/);
  assert.match(invalid, /role="status">Planning data invalid/);
  assert.doesNotMatch(invalid, /Planning (?:days )?incomplete|actual of 0 days|On pace|ahead|behind|d buffer/);
});

function renderLessonPlan(
  PlannedDays,
  actualDays = 1,
  { lesson = {}, outcomes = [] } = {},
) {
  return renderLessonTableComponent({
    lessonList: [{ LessonID: "L1", UnitID: "U1", LessonNumber: 1, LessonTitle: "Lesson", PlannedDays, ...lesson }],
    selectedDailyProgress: [],
    selectedNavigation: { currentLesson: null, nextLesson: null },
    activeProgressLessonId: null,
    progressInputs: {},
    editingLessonId: null,
    editLessonDraft: null,
    reorderingUnitId: null,
    isAddingLesson: false,
    isAddingLessonSaving: false,
    newLesson: { lessonTitle: "", plannedDays: 1, keyOutcomes: [""] },
    getLessonProgress: () => ({ actualDays, finished: false }),
    getOutcomeList: () => outcomes,
    formatVarianceCompact: (value) => String(value),
  });
}

test("Lesson table renders known, unknown, and invalid PlannedDays without unsafe variance", () => {
  const known = renderLessonPlan(0.5);
  assert.match(known, /aria-label="0\.5 planned days">0\.5d/);
  assert.match(known, />0\.5<\/strong>/);

  const unknown = renderLessonPlan("");
  assert.match(unknown, /aria-label="Not planned">—<\/strong>/);
  assert.doesNotMatch(unknown, />1<\/strong>[\s\S]*class="variance-warning"/);

  const invalid = renderLessonPlan(0);
  assert.match(invalid, /aria-label="Invalid value">Invalid value<\/strong>/);
  assert.doesNotMatch(invalid, />1<\/strong>[\s\S]*class="variance-warning"/);
});

test("Lesson table shows publisher summaries when teacher outcomes are absent", () => {
  const summary = renderLessonPlan("", 0, {
    lesson: { Description: "Let's explore scaled copies and dilations." },
  });

  assert.match(summary, /Publisher summary:/);
  assert.match(summary, /Let&#x27;s explore scaled copies and dilations\./);
  assert.doesNotMatch(summary, /No outcome entered/);

  const teacherOutcome = renderLessonPlan("", 0, {
    lesson: { Description: "Publisher text" },
    outcomes: ["I can identify a dilation."],
  });

  assert.match(teacherOutcome, /I can identify a dilation\./);
  assert.doesNotMatch(teacherOutcome, /Publisher summary:|Publisher text/);
});

test("Forecast cards and timeline render a withheld incomplete-planning state", () => {
  const incompleteForecast = {
    section: { SectionID: "S1", CourseID: "IM1", Period: 1 },
    state: "Pacing unavailable",
    visualStateClass: "unavailable",
    dataComplete: false,
    planningState: "incomplete",
    actualDays: 1,
    currentLesson: { LessonID: "L1", LessonNumber: 1, LessonTitle: "Lesson" },
    variance: null,
    projectedFinishPercent: null,
    endPositionPercent: null,
  };
  const courseUnits = [{ UnitID: "U1", CourseID: "IM1", UnitNumber: 1, SortOrder: 1, RequiredDays: "", OptionalDays: 0 }];
  const courseLessons = [{ LessonID: "L1", UnitID: "U1", CourseID: "IM1", SortOrder: 1, PlannedDays: "" }];

  const cards = renderForecastCardsComponent({
    forecastedSections: [incompleteForecast],
    sectionForecasts: [incompleteForecast],
    hasForecastProgress: true,
  });
  assert.match(cards, /Pacing unavailable/);
  assert.match(cards, /Planning days incomplete/);
  assert.doesNotMatch(cards, /forecast-runway|forecast-recommendation/);

  const timeline = renderYearTimelineComponent({
    forecastedSections: [incompleteForecast],
    units: courseUnits,
    lessons: courseLessons,
    timelineSyncSummaries: [],
  });
  assert.match(timeline, /Planning days incomplete · Pacing unavailable/);
  assert.doesNotMatch(timeline, /unit-timeline-block|unit-timeline-end-marker|unit-timeline-projected-marker|unit-timeline-marker/);
});
