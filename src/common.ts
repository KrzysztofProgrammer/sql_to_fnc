import {FieldDefinition} from "./sql_to_fnc.interfaces";

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function isNumber(item: FieldDefinition): boolean {
  if (['INT4', 'INT8', 'INTEGER'].indexOf(item.type.toUpperCase()) >= 0) {
    return true;
  }
  return false;
}

export function isString(item: FieldDefinition): boolean {
  if (
    (item.type.toUpperCase().indexOf('VARCHAR') >= 0)
    || (item.type.toUpperCase().indexOf('BPCHAR') >= 0)
    || (item.type.toUpperCase().indexOf('TEXT') >= 0)
  ) return true;
  return false;
}
