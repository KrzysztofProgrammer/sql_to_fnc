import * as fs from 'fs';
import * as path from 'path';
import { generateSQL } from './src/sql_to_fnc-sql.lib';
import { generateAPI } from './src/sql_to_fnc-api.lib';
import { FieldDefinition } from './src/sql_to_fnc.interfaces';

const args = process.argv.slice(2);
if (!args[0]) {
  console.log('Add SQL file with table definition');
  process.exit(-1);
}

if (!fs.existsSync(args[0])) {
  console.error('File not exist');
  process.exit(-1);
}

if (path.extname(args[0]).toUpperCase() !== '.SQL') {
  console.log('File is not SQL file');
  process.exit(-1);
}

const sqlFile = fs.readFileSync(args[0], {
  encoding: 'ascii',
});

/**
 * Analyze and process SQL table definition
 */
let tblName = '';
let schemaName = '';
let sequenceName = '';

const fieldArray: FieldDefinition[] = [];
sqlFile.split('\n').forEach((line) => {
  const elems = line.trim().split(/\s+/);
  if (elems[0].toUpperCase() === 'CREATE') {
    schemaName = elems[2].split('.')[0];
    tblName = elems[2].split('.')[1];
    return;
  }
  if (['(', ')'].indexOf(elems[0].substr(0,1)) >= 0) {
    return;
  }
  if (elems[0] === '') {
    return;
  }
  fieldArray.push({
    field: elems[0],
    type: elems[1].toUpperCase(),
    notNull: line.toUpperCase().indexOf('NOT NULL') >= 0,
  });
  // Check sequence name
  const nextVal = line.toUpperCase().indexOf('NEXTVAL(');
  if (nextVal >= 0) {
    const lastElem = line.indexOf('\'', nextVal + 9);
    sequenceName = line.substring(nextVal + 9, lastElem);
    // console.log('line: ', line);
    // console.log('Sequence line', nextVal, lastElem, sequenceName);
  }
  // console.log('V: ', elems[0], ', T: ', elems[1]);
});

if (!schemaName) {
  console.log('Table should have schema defined');
  process.exit(-1);
}

generateSQL(schemaName, tblName, sequenceName, fieldArray);

// console.log(getFncName);
generateAPI(schemaName, tblName, fieldArray);
