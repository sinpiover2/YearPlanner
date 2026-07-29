// Read-only structural/semantic validation of an Amplify IM1 staging artifact
// (the shape produced by generate-artifact.mjs). Performs zero writes and
// zero network/PDF access — operates entirely on the artifact object already
// in memory.
//
// Literal Type preservation only: this file does not map Types onto any
// conceptual-role taxonomy (see AMPLIFY_IM1_IMPORT_IMPLEMENTATION_SPEC.md §3).
// KNOWN_TYPES exists only to decide "recognized vs. worth a warning" — an
// unrecognized Type is never an error, per that same section's explicit
// "unknown-type behavior: must never crash, drop the row, or silently
// discard it."

export const KNOWN_TYPES = new Set([
  "Meet & Greet",
  "Pre-Unit Check",
  "Explore",
  "Lesson",
  "Practice",
  "Practice Day",
  "Mid-Unit Check",
  "Sub-Unit Quiz",
  "Assessment",
  "Performance Task",
  "Reflection",
  "Unit Synthesis and Reflection",
  "Investigate",
]);

// Expected fixed/flexible item counts, transcribed by hand directly from
// IM1_Curriculum_Extraction.md's own Instructional Items tables — kept
// independent of amplify-im1-source.mjs so this check can catch drift
// between the transcription and the document it's supposed to mirror,
// not just confirm the transcription agrees with itself.
export const EXPECTED_UNIT_COUNTS = {
  1: { fixed: 13, flexible: 0 },
  2: { fixed: 24, flexible: 0 },
  3: { fixed: 25, flexible: 0 },
  4: { fixed: 22, flexible: 0 },
  5: { fixed: 22, flexible: 1 },
  6: { fixed: 30, flexible: 0 },
  7: { fixed: 26, flexible: 1 },
};

function isNonBlankString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function validateArtifact(artifact) {
  const errors = [];
  const warnings = [];

  if (!artifact || typeof artifact !== "object") {
    return { valid: false, errors: ["Artifact is not an object."], warnings };
  }

  if (!isNonBlankString(artifact.schemaVersion)) {
    errors.push("Missing or invalid schemaVersion.");
  }
  if (!artifact.course || !isNonBlankString(artifact.course.courseId)) {
    errors.push("Missing or invalid course.courseId.");
  }
  if (!Array.isArray(artifact.units)) {
    errors.push("Missing or invalid units array.");
    return { valid: false, errors, warnings };
  }

  const seenUnitIds = new Set();
  const seenItemIds = new Set();

  for (const unit of artifact.units) {
    const unitLabel = `Unit ${unit?.unitNumber ?? "?"} (${unit?.unitId ?? "no unitId"})`;

    // --- Structural: unit ---
    if (!isNonBlankString(unit.unitId)) errors.push(`${unitLabel}: missing unitId.`);
    if (typeof unit.unitNumber !== "number") errors.push(`${unitLabel}: missing/invalid unitNumber.`);
    if (!isNonBlankString(unit.title)) errors.push(`${unitLabel}: missing title.`);
    if (!Array.isArray(unit.items)) {
      errors.push(`${unitLabel}: missing items array.`);
      continue;
    }

    // --- Unit ID collision ---
    if (seenUnitIds.has(unit.unitId)) {
      errors.push(`Duplicate unitId: ${unit.unitId}`);
    }
    seenUnitIds.add(unit.unitId);

    // --- requiredDays/optionalDays shape ---
    for (const field of ["requiredDays", "optionalDays"]) {
      const entry = unit[field];
      if (!entry || typeof entry.status !== "string") {
        errors.push(`${unitLabel}: missing/invalid ${field}.status.`);
        continue;
      }
      const validStatuses = ["value_provided", "not_provided", "not_yet_verified"];
      if (!validStatuses.includes(entry.status)) {
        errors.push(`${unitLabel}: ${field}.status "${entry.status}" is not one of ${validStatuses.join(", ")}.`);
      }
      if (entry.status === "value_provided" && typeof entry.value !== "number") {
        errors.push(`${unitLabel}: ${field}.status is "value_provided" but value is not a number.`);
      }
      if (entry.status !== "value_provided" && entry.value !== null) {
        errors.push(`${unitLabel}: ${field}.status is "${entry.status}" but value is not null.`);
      }
    }

    let fixedCount = 0;
    let flexibleCount = 0;
    const seenOrdersInUnit = new Set();

    for (const item of unit.items) {
      const itemLabel = `${unitLabel} item "${item?.title ?? "?"}" (${item?.itemId ?? "no itemId"})`;

      // --- Structural: item ---
      if (!isNonBlankString(item.itemId)) errors.push(`${itemLabel}: missing itemId.`);
      if (!isNonBlankString(item.type)) errors.push(`${itemLabel}: missing type.`);
      if (!isNonBlankString(item.title)) errors.push(`${itemLabel}: missing title.`);
      if (!isNonBlankString(item.summary)) errors.push(`${itemLabel}: missing summary.`);
      if (typeof item.isOptional !== "boolean") errors.push(`${itemLabel}: isOptional must be a boolean.`);

      // --- Item ID collision (global — IDs are expected to be globally unique) ---
      if (seenItemIds.has(item.itemId)) {
        errors.push(`Duplicate itemId across artifact: ${item.itemId}`);
      }
      seenItemIds.add(item.itemId);

      // --- Literal Type: unrecognized is a warning, never an error ---
      if (isNonBlankString(item.type) && !KNOWN_TYPES.has(item.type)) {
        warnings.push(`${itemLabel}: Type "${item.type}" is not in the known-literal list — preserved as-is.`);
      }

      // --- Ordering/placement: fixed XOR flexible, never both, never neither ---
      const hasOrder = item.order !== null && item.order !== undefined;
      const hasPlacementRule = isNonBlankString(item.placementRule);

      if (hasOrder && hasPlacementRule) {
        errors.push(`${itemLabel}: has both an order and a placementRule — fixed and flexible are mutually exclusive.`);
      } else if (!hasOrder && !hasPlacementRule) {
        errors.push(`${itemLabel}: has neither an order nor a placementRule — every item must be one or the other.`);
      } else if (hasOrder) {
        fixedCount += 1;
        if (typeof item.order !== "number" || item.order <= 0 || !Number.isInteger(item.order)) {
          errors.push(`${itemLabel}: order must be a positive integer.`);
        } else if (seenOrdersInUnit.has(item.order)) {
          errors.push(`${unitLabel}: duplicate order value ${item.order}.`);
        } else {
          seenOrdersInUnit.add(item.order);
        }
      } else {
        flexibleCount += 1;
      }
    }

    // --- Completeness: compare against the independently-transcribed expected counts ---
    const expected = EXPECTED_UNIT_COUNTS[unit.unitNumber];
    if (!expected) {
      warnings.push(`${unitLabel}: no expected-count entry on file for this unit number — completeness not checked.`);
    } else {
      if (fixedCount !== expected.fixed) {
        errors.push(
          `${unitLabel}: expected ${expected.fixed} fixed-placement items, found ${fixedCount}.`,
        );
      }
      if (flexibleCount !== expected.flexible) {
        errors.push(
          `${unitLabel}: expected ${expected.flexible} flexible-placement item(s), found ${flexibleCount}.`,
        );
      }
    }
  }

  if (artifact.units.length !== Object.keys(EXPECTED_UNIT_COUNTS).length) {
    warnings.push(
      `Artifact contains ${artifact.units.length} units; ${Object.keys(EXPECTED_UNIT_COUNTS).length} expected on file. ` +
        `This is a warning, not an error, in case the artifact deliberately covers a subset of units.`,
    );
  }

  return { valid: errors.length === 0, errors, warnings };
}
