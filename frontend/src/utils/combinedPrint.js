// Authenticated roster Apps Script web app. It owns the combined print
// document (lesson + roster) so student data never has to reach this
// frontend; see apps-script-roster/ and docs/Architecture/ROSTER_INFORMATION_MODEL.md.
export const COMBINED_PRINT_URL =
  "https://script.google.com/a/macros/scottsvalleyusd.org/s/AKfycbz3pelDrU-DTrDmIp4KDt3LAYIOv263Z7ijAgCBAEX2CykwmCDLFzV2EZkX4rftq4TU/exec";

// Navigates to the authenticated roster Apps Script via a hidden form POST
// (not fetch) so lesson payloads never have to fit in a URL and no CORS
// exception is needed — it's a normal top-level browser navigation. The
// Apps Script renders every lesson + roster pair as one document and the
// browser prints once there.
function submitCombinedPrintForm(fields) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = COMBINED_PRINT_URL;
  form.target = "_blank";
  form.style.display = "none";

  Object.entries(fields).forEach(([name, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
  form.remove();
}

// Prints a single Lesson Session (used by "Print lesson").
export function printLessonSession({ sectionId, sessionDate, lessonPayload }) {
  submitCombinedPrintForm({
    sectionId,
    sessionDate,
    lessonPayload: JSON.stringify(lessonPayload),
  });
}

// Prints every Lesson Session meeting on a given day (used by "Print Day"),
// as one document: lesson, roster, lesson, roster, ... so duplex printing
// places each roster on the back of its lesson.
export function printLessonSessions(entries) {
  submitCombinedPrintForm({
    payloads: JSON.stringify(entries),
  });
}
