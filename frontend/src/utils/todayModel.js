const TODAY_TIME_LABELS_BY_PERIOD = {
  1: "8:15",
  2: "9:40",
  3: "11:00",
  5: "1:10",
  6: "2:35",
};

function getTodayTimeLabel(section) {
  return TODAY_TIME_LABELS_BY_PERIOD[Number(section?.Period)] ?? "—";
}

function getTodayDateParts(date = new Date()) {
  return {
    weekday: date.toLocaleDateString("en-US", { weekday: "long" }),
    dateLabel: date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
    }),
  };
}

function getTodayModel({
  selectedCourseId,
  selectedSection,
  selectedCourseSections,
  units,
  lessons,
  dailyProgress,
  getCourseLabel,
  getProgressForSection,
  getCourseNavigation,
}) {
  const orderedSections = [...selectedCourseSections].sort(
    (a, b) => Number(a.Period || 999) - Number(b.Period || 999),
  );

  const currentSection =
    orderedSections.find(
      (section) => section.SectionID === selectedSection?.SectionID,
    ) ??
    orderedSections[0] ??
    null;

  const currentIndex = currentSection
    ? orderedSections.findIndex(
        (section) => section.SectionID === currentSection.SectionID,
      )
    : -1;

  const flowItems = orderedSections.map((section, index) => {
    const sectionProgress = getProgressForSection(dailyProgress, section);
    const navigation = getCourseNavigation(
      section.CourseID,
      units,
      lessons,
      sectionProgress,
    );

    const state =
      index < currentIndex
        ? "complete"
        : index === currentIndex
          ? "current"
          : "upcoming";

    return {
      id: section.SectionID,
      section,
      state,
      timeLabel: getTodayTimeLabel(section),
      courseLabel: getCourseLabel(section.CourseID),
      lesson: navigation.currentLesson,
      unit: navigation.currentUnit,
      lessonNumber: navigation.currentLessonNumber,
      totalLessonsInUnit: navigation.totalLessonsInUnit,
    };
  });

  const currentItem =
    flowItems.find((item) => item.state === "current") ?? flowItems[0] ?? null;

  const { weekday, dateLabel } = getTodayDateParts();

  return {
    weekday,
    dateLabel,
    statusText: currentItem ? "You're set for today." : "No classes scheduled.",
    currentItem,
    flowItems,
    selectedCourseLabel: getCourseLabel(selectedCourseId),
  };
}

export {
  TODAY_TIME_LABELS_BY_PERIOD,
  getTodayTimeLabel,
  getTodayDateParts,
  getTodayModel,
};
