import { FieldDefinition } from './sql_to_fnc.interfaces';

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function snakeToCamel(str: string, setCapitalize: boolean = true): string {
  let word = str;
  if (setCapitalize) {
    word = str.charAt(0).toUpperCase() + str.slice(1);
  }
  return word.replace(/([_][a-z])/g,
    (group) =>
      group
        .toUpperCase()
        .replace('_', ''),
  );
}

export function snakeToDash(str: string): string {
  return str.toLowerCase().replace('_', '-');
}

export function isNumber(item: FieldDefinition): boolean {
  if (['INT4', 'INT8', 'INTEGER', 'INT'].indexOf(item.type.toUpperCase()) >= 0) {
    return true;
  }
  return false;
}

export function isString(item: FieldDefinition): boolean {
  if (['VARCHAR', 'BPCHAR', 'TEXT'].indexOf(item.type.toUpperCase()) >= 0) {
    return true;
  }
  return false;
}

export function isBoolean(item: FieldDefinition): boolean {
  if (['BOOL', 'BOOLEAN'].indexOf(item.type.toUpperCase()) >= 0) {
    return true;
  }
  return false;
}

export function isDate(item: FieldDefinition): boolean {
  if (['DATE', 'TIMESTAMP'].indexOf(item.type.toUpperCase()) >= 0) {
    return true;
  }
  return false;
}

/**
 *  Check if there is comment, if not - stay with field name
 */
export function getDescription(tblName: string, fieldName: string, sqlFileContent: string) {
  let response = fieldName;
  sqlFileContent.split('\n').forEach((line) => {
    const elems = line.trim().split(/\s+/);
    if (elems.length < 6) { return; }
    if (elems[0].toUpperCase() !== 'COMMENT') {
      return;
    }
    if (elems[1].toUpperCase() !== 'ON') {
      return;
    }
    if (elems[2].toUpperCase() !== 'COLUMN') {
      return;
    }
    if (elems[3].toUpperCase().indexOf(`${tblName.toUpperCase()}.${fieldName.toUpperCase()}`) === -1) {
      return;
    }
    const descArr = line.trim().split('\'');
    response = descArr[1];
    return;
  });
  return response;
}
