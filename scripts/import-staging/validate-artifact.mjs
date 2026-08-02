// Read-only, profile-driven validation for deterministic curriculum artifacts.

export const KNOWN_TYPES = new Set([
  "Meet & Greet", "Pre-Unit Check", "Explore", "Lesson", "Practice",
  "Practice Day", "Mid-Unit Check", "Sub-Unit Quiz", "Assessment",
  "Performance Task", "Reflection", "Unit Synthesis and Reflection", "Investigate",
]);

export const M8_TYPES = new Set([
  "Pre-Unit Check", "Explore", "Lesson", "Practice Day", "Sub-Unit Quiz",
  "Performance Task", "Unit Synthesis and Reflection", "Investigate",
]);

export const EXPECTED_UNIT_COUNTS = {
  1: { fixed: 13, flexible: 0 }, 2: { fixed: 24, flexible: 0 },
  3: { fixed: 25, flexible: 0 }, 4: { fixed: 22, flexible: 0 },
  5: { fixed: 22, flexible: 1 }, 6: { fixed: 30, flexible: 0 },
  7: { fixed: 26, flexible: 1 },
};

export const M8_EXPECTED_UNIT_COUNTS = {
  1: { fixed: 21, flexible: 0 }, 2: { fixed: 17, flexible: 0 },
  3: { fixed: 20, flexible: 0 }, 4: { fixed: 21, flexible: 0 },
  5: { fixed: 22, flexible: 1 }, 6: { fixed: 18, flexible: 1 },
  7: { fixed: 21, flexible: 0 }, 8: { fixed: 21, flexible: 0 },
};

const nonblank = (value) => typeof value === "string" && value.trim().length > 0;

function validateCommon(artifact, errors) {
  if (!nonblank(artifact.schemaVersion)) errors.push("Missing or invalid schemaVersion.");
  if (!artifact.course || !nonblank(artifact.course.courseId)) errors.push("Missing or invalid course.courseId.");
  if (!Array.isArray(artifact.units)) errors.push("Missing or invalid units array.");
}

function validatePlacement(item, itemLabel, unitLabel, state, errors) {
  const hasOrder = item.order !== null && item.order !== undefined;
  const hasRule = nonblank(item.placementRule);
  if (hasOrder === hasRule) {
    errors.push(`${itemLabel}: has ${hasOrder ? "both an order and a placementRule" : "neither an order nor a placementRule"} — fixed and flexible are mutually exclusive.`);
    return;
  }
  if (hasOrder) {
    state.fixed += 1;
    if (!Number.isInteger(item.order) || item.order <= 0) errors.push(`${itemLabel}: order must be a positive integer.`);
    else if (state.orders.has(item.order)) errors.push(`${unitLabel}: duplicate order value ${item.order}.`);
    else state.orders.add(item.order);
  } else state.flexible += 1;
}

function validateIm1(artifact, errors, warnings) {
  const unitIds = new Set();
  const itemIds = new Set();
  for (const unit of artifact.units) {
    const unitLabel = `Unit ${unit?.unitNumber ?? "?"} (${unit?.unitId ?? "no unitId"})`;
    if (!nonblank(unit.unitId)) errors.push(`${unitLabel}: missing unitId.`);
    if (typeof unit.unitNumber !== "number") errors.push(`${unitLabel}: missing/invalid unitNumber.`);
    if (!nonblank(unit.title)) errors.push(`${unitLabel}: missing title.`);
    if (!Array.isArray(unit.items)) { errors.push(`${unitLabel}: missing items array.`); continue; }
    if (unitIds.has(unit.unitId)) errors.push(`Duplicate unitId: ${unit.unitId}`);
    unitIds.add(unit.unitId);
    for (const field of ["requiredDays", "optionalDays"]) {
      const entry = unit[field];
      const statuses = ["value_provided", "not_provided", "not_yet_verified"];
      if (!entry || typeof entry.status !== "string") errors.push(`${unitLabel}: missing/invalid ${field}.status.`);
      else if (!statuses.includes(entry.status)) errors.push(`${unitLabel}: ${field}.status "${entry.status}" is not one of ${statuses.join(", ")}.`);
      else if (entry.status === "value_provided" && typeof entry.value !== "number") errors.push(`${unitLabel}: ${field}.status is "value_provided" but value is not a number.`);
      else if (entry.status !== "value_provided" && entry.value !== null) errors.push(`${unitLabel}: ${field}.status is "${entry.status}" but value is not null.`);
    }
    const state = { fixed: 0, flexible: 0, orders: new Set() };
    for (const item of unit.items) {
      const label = `${unitLabel} item "${item?.title ?? "?"}" (${item?.itemId ?? "no itemId"})`;
      if (!nonblank(item.itemId)) errors.push(`${label}: missing itemId.`);
      if (!nonblank(item.type)) errors.push(`${label}: missing type.`);
      if (!nonblank(item.title)) errors.push(`${label}: missing title.`);
      if (!nonblank(item.summary)) errors.push(`${label}: missing summary.`);
      if (typeof item.isOptional !== "boolean") errors.push(`${label}: isOptional must be a boolean.`);
      if (itemIds.has(item.itemId)) errors.push(`Duplicate itemId across artifact: ${item.itemId}`);
      itemIds.add(item.itemId);
      if (nonblank(item.type) && !KNOWN_TYPES.has(item.type)) warnings.push(`${label}: Type "${item.type}" is not in the known-literal list — preserved as-is.`);
      validatePlacement(item, label, unitLabel, state, errors);
    }
    const expected = EXPECTED_UNIT_COUNTS[unit.unitNumber];
    if (!expected) warnings.push(`${unitLabel}: no expected-count entry on file for this unit number — completeness not checked.`);
    else {
      if (state.fixed !== expected.fixed) errors.push(`${unitLabel}: expected ${expected.fixed} fixed-placement items, found ${state.fixed}.`);
      if (state.flexible !== expected.flexible) errors.push(`${unitLabel}: expected ${expected.flexible} flexible-placement item(s), found ${state.flexible}.`);
    }
  }
  if (artifact.units.length !== Object.keys(EXPECTED_UNIT_COUNTS).length) warnings.push(`Artifact contains ${artifact.units.length} units; ${Object.keys(EXPECTED_UNIT_COUNTS).length} expected on file. This is a warning, not an error, in case the artifact deliberately covers a subset of units.`);
}

function validateEvidenceField(item, field, label, errors) {
  const statusField = `${field}Status`;
  const status = item[statusField];
  const value = item[field];
  const allowed = ["value_provided", "confirmed_absent", "not_found_in_reviewable_source"];
  if (!allowed.includes(status)) errors.push(`${label}: ${statusField} "${status}" is invalid.`);
  if (status === "value_provided") {
    const valid = field === "isOptional" ? value === true : nonblank(value);
    if (!valid) errors.push(`${label}: ${statusField} is value_provided but ${field} has no legal supplied value.`);
  } else if (allowed.includes(status) && value !== null) errors.push(`${label}: ${statusField} is ${status} but ${field} is not null.`);
  if (status === "not_found_in_reviewable_source" && (!item.provenance || !nonblank(item.provenance.evidence))) {
    errors.push(`${label}: unresolved ${field} requires provenance evidence.`);
  }
}

function validateM8(artifact, errors) {
  if (artifact.schemaVersion !== "2.0.0") errors.push('Math 8 profile requires schemaVersion "2.0.0".');
  if (artifact.course?.courseId !== "M8" || artifact.course?.courseLabel !== "Math 8") errors.push("Math 8 profile requires the approved course identity.");
  const gen = artifact.generator;
  for (const field of ["script", "sourceTranscription", "extraction", "extractionSha256"]) if (!nonblank(gen?.[field])) errors.push(`Math 8 generator.${field} is required.`);
  if (gen?.suppliedUnitsFullyExtracted !== true) errors.push("Math 8 suppliedUnitsFullyExtracted must be true.");
  if (gen?.authoritativeCourseCompleteness !== "unconfirmed") errors.push("Math 8 authoritative course completeness must remain unconfirmed.");
  const unitIds = new Set();
  const itemIds = new Set();
  const investigateRules = new Map([
    [5, "Use anytime in this course after Unit 5, Lesson 15."],
    [6, "Use anytime in this grade after Unit 6, Lesson 9."],
  ]);
  for (const unit of artifact.units) {
    const unitLabel = `Unit ${unit?.unitNumber ?? "?"} (${unit?.unitId ?? "no unitId"})`;
    if (!nonblank(unit.unitId) || unit.unitId !== `AMP-M8-U${unit.unitNumber}`) errors.push(`${unitLabel}: invalid unitId.`);
    if (unitIds.has(unit.unitId)) errors.push(`Duplicate unitId: ${unit.unitId}`);
    unitIds.add(unit.unitId);
    if (!nonblank(unit.title) || !nonblank(unit.purpose) || !Array.isArray(unit.items)) errors.push(`${unitLabel}: missing title, purpose, or items.`);
    for (const field of ["requiredDays", "optionalDays"]) if (unit[field]?.status !== "confirmed_absent" || unit[field]?.value !== null) errors.push(`${unitLabel}: ${field} must be null with confirmed_absent status.`);
    const state = { fixed: 0, flexible: 0, orders: new Set() };
    for (const item of unit.items ?? []) {
      const label = `${unitLabel} item (${item?.itemId ?? "no itemId"})`;
      if (!nonblank(item.itemId)) errors.push(`${label}: missing itemId.`);
      if (itemIds.has(item.itemId)) errors.push(`Duplicate itemId across artifact: ${item.itemId}`);
      itemIds.add(item.itemId);
      validatePlacement(item, label, unitLabel, state, errors);
      const expectedId = item.order === null ? /^AMP-M8-U\d+-F[1-9]\d*$/ : `${unit.unitId}-I${String(item.order).padStart(2, "0")}`;
      if (expectedId instanceof RegExp ? !expectedId.test(item.itemId) : item.itemId !== expectedId) errors.push(`${label}: itemId does not match placement identity.`);
      for (const field of ["type", "title", "subtitle", "summary", "isOptional"]) validateEvidenceField(item, field, label, errors);
      if (item.type !== null && !M8_TYPES.has(item.type)) errors.push(`${label}: Type "${item.type}" is not in the Math 8 literal vocabulary.`);
      if (item.type === null && !(unit.unitNumber === 1 && item.order === 1 && item.typeStatus === "confirmed_absent")) errors.push(`${label}: null Type is allowed only for Unit 1 order 1 with confirmed_absent status.`);
      if (item.type === "Investigate" && item.placementRule !== investigateRules.get(unit.unitNumber)) errors.push(`${label}: Investigate placementRule does not match the publisher rule exactly.`);
    }
    const expected = M8_EXPECTED_UNIT_COUNTS[unit.unitNumber];
    if (!expected) errors.push(`${unitLabel}: unexpected unit number.`);
    else {
      if (state.fixed !== expected.fixed) errors.push(`${unitLabel}: expected ${expected.fixed} fixed-placement items, found ${state.fixed}.`);
      if (state.flexible !== expected.flexible) errors.push(`${unitLabel}: expected ${expected.flexible} flexible-placement item(s), found ${state.flexible}.`);
    }
  }
  if (artifact.units.length !== 8) errors.push(`Math 8 artifact must contain exactly 8 units, found ${artifact.units.length}.`);
}

export function validateArtifact(artifact) {
  const errors = [];
  const warnings = [];
  if (!artifact || typeof artifact !== "object") return { valid: false, errors: ["Artifact is not an object."], warnings };
  validateCommon(artifact, errors);
  if (!Array.isArray(artifact.units)) return { valid: false, errors, warnings };
  if (artifact.validationProfile === "amplify-m8") validateM8(artifact, errors);
  else if (artifact.validationProfile === undefined || artifact.validationProfile === "amplify-im1") validateIm1(artifact, errors, warnings);
  else errors.push(`Unknown validationProfile: ${artifact.validationProfile}`);
  return { valid: errors.length === 0, errors, warnings };
}
