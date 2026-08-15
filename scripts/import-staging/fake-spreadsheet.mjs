// Minimal in-memory fakes of the SpreadsheetApp/LockService surface the
// Amplify IM1 importer actually calls (getSheetByName, getLastRow,
// getLastColumn, getRange().getValues()/.setValues()/.setValue(), appendRow,
// copy, tryLock/releaseLock). Used only to prove the guarded write sequence
// is structurally correct — this NEVER touches a real spreadsheet, network,
// or Google API. See AmplifyIm1Importer.js's header for why that distinction
// matters.

export class FakeRange {
  constructor(sheet, row, col, numRows, numCols) {
    this.sheet = sheet;
    this.row = row;
    this.col = col;
    this.numRows = numRows;
    this.numCols = numCols;
  }

  getValues() {
    const result = [];
    for (let r = 0; r < this.numRows; r += 1) {
      const rowValues = this.sheet.values[this.row - 1 + r] || [];
      const slice = [];
      for (let c = 0; c < this.numCols; c += 1) {
        const value = rowValues[this.col - 1 + c];
        slice.push(value === undefined ? "" : value);
      }
      result.push(slice);
    }
    return result;
  }

  setValues(values) {
    for (let r = 0; r < values.length; r += 1) {
      const rowIndex = this.row - 1 + r;
      while (this.sheet.values.length <= rowIndex) this.sheet.values.push([]);
      for (let c = 0; c < values[r].length; c += 1) {
        this.sheet.values[rowIndex][this.col - 1 + c] = values[r][c];
      }
    }
  }

  setValue(value) {
    this.setValues([[value]]);
  }

  clearContent() {
    for (let r = 0; r < this.numRows; r += 1) {
      for (let c = 0; c < this.numCols; c += 1) {
        const row = this.sheet.values[this.row - 1 + r];
        if (row) row[this.col - 1 + c] = "";
      }
    }
  }
}

export class FakeSheet {
  constructor(name, values) {
    this.name = name;
    this.values = values.map((row) => row.slice());
  }

  getLastRow() {
    return this.values.length;
  }

  getLastColumn() {
    return this.values.length > 0 ? this.values[0].length : 0;
  }

  getRange(row, col, numRows, numCols) {
    return new FakeRange(this, row, col, numRows ?? 1, numCols ?? 1);
  }

  getDataRange() {
    return this.getRange(1, 1, this.getLastRow(), this.getLastColumn());
  }

  clearContents() {
    this.values = [];
  }

  deleteRow(rowNumber) {
    this.values.splice(rowNumber - 1, 1);
  }

  appendRow(rowArray) {
    this.values.push(rowArray.slice());
  }

  // Mirrors the real Sheet.insertColumnsAfter(afterPosition, howMany)
  // contract used by LessonsSchemaMigration.js: inserts `howMany` blank
  // columns immediately after the 1-indexed `afterPosition`, shifting every
  // existing cell in every row (including the header row) right by that
  // amount — never rewriting or reordering any existing cell's value.
  insertColumnsAfter(afterPosition, howMany) {
    const count = howMany ?? 1;
    this.values = this.values.map((row) => {
      const newRow = row.slice();
      newRow.splice(afterPosition, 0, ...new Array(count).fill(""));
      return newRow;
    });
  }

  clone() {
    return new FakeSheet(this.name, this.values);
  }
}

let fakeSpreadsheetCounter = 0;

export class FakeSpreadsheet {
  constructor(sheetsByName) {
    this.sheetsByName = sheetsByName;
    fakeSpreadsheetCounter += 1;
    this.id = `fake-spreadsheet-${fakeSpreadsheetCounter}`;
  }

  getSheetByName(name) {
    return this.sheetsByName[name] || null;
  }

  insertSheet(name) {
    if (this.sheetsByName[name]) throw new Error(`Sheet already exists: ${name}`);
    const sheet = new FakeSheet(name, []);
    this.sheetsByName[name] = sheet;
    return sheet;
  }

  deleteSheet(sheet) {
    delete this.sheetsByName[sheet.name];
  }

  getId() {
    return this.id;
  }

  getUrl() {
    return `https://fake.invalid/spreadsheets/${this.id}`;
  }

  // Mirrors the real Spreadsheet.copy(name) contract used by
  // amplifyIm1CreateBackup_: an independent deep copy, never a mutation of
  // the original.
  copy(name) {
    const clonedSheets = {};
    Object.keys(this.sheetsByName).forEach((key) => {
      clonedSheets[key] = this.sheetsByName[key].clone();
    });
    const copy = new FakeSpreadsheet(clonedSheets);
    copy.name = name;
    return copy;
  }
}

function objectsToValues(headers, rowObjects) {
  const dataRows = rowObjects.map((obj) =>
    headers.map((header) => {
      const value = obj[header];
      return value === undefined || value === null ? "" : value;
    }),
  );
  return [headers.slice(), ...dataRows];
}

export function createFakeSheet(headers, rowObjects) {
  return new FakeSheet("sheet", objectsToValues(headers, rowObjects));
}

// sheetsByNameAndRows = { SheetName: [[headerRow...], [dataRow...], ...] }
// Raw-array constructor (as opposed to createFakeSpreadsheetFromFixture's
// object-row constructor) — used by schema-migration tests, which reason
// about headers/rawRows directly, never field-keyed objects.
export function createFakeSpreadsheetFromRawSheets(sheetsByNameAndRows) {
  const sheetsByName = {};
  Object.keys(sheetsByNameAndRows).forEach((name) => {
    sheetsByName[name] = new FakeSheet(name, sheetsByNameAndRows[name]);
  });
  return new FakeSpreadsheet(sheetsByName);
}

// destination = { units: [...rowObjects], lessons: [...rowObjects] }
// sheetHeaders = { units: [...headerNames], lessons: [...headerNames] }
export function createFakeSpreadsheetFromFixture(destination, sheetHeaders) {
  return new FakeSpreadsheet({
    Units: createFakeSheet(sheetHeaders.units, destination.units || []),
    Lessons: createFakeSheet(sheetHeaders.lessons, destination.lessons || []),
  });
}

export function createFakeSpreadsheetApp(spreadsheet) {
  return {
    openById() {
      return spreadsheet;
    },
  };
}

// acquireSucceeds: true (default) always locks; false always fails
// tryLock — used to prove executeAmplifyIm1Import refuses cleanly when the
// lock cannot be obtained, via this injectable boundary rather than any
// real concurrency.
export function createFakeLockService({ acquireSucceeds = true } = {}) {
  let released = false;
  return {
    getScriptLock() {
      return {
        tryLock() {
          return acquireSucceeds;
        },
        releaseLock() {
          released = true;
        },
      };
    },
    wasReleased() {
      return released;
    },
  };
}
