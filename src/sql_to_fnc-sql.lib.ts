import * as fs from 'fs';
import * as path from 'path';
import { privOwner, privUser } from '../sql_to_fnc.constans';
import { FieldDefinition } from './sql_to_fnc.interfaces';

/**
 * SQL functions GET, DELETE, LIST, SAVE create
 */

function getFunctionList(arr: FieldDefinition[]): string {
  let fieldList = '';
  arr.forEach((item) => {
    fieldList += `          ${item.field},\n`;
  });
  return fieldList.slice(0, -2);
}

function sqlData(elem: FieldDefinition): string {
  switch (elem.type) {
    case 'BOOL':
      return `COALESCE( cast( f_data->>'${elem.field}' as boolean), true)`;
    case 'DATE':
    case 'TIMESTAMPTZ':
    case 'TIMESTAMP':
    case 'INT4':
    case 'INT8':
    case 'INTEGER':
      return `CAST( f_data->>'${elem.field}' as ${elem.type})`;
    case 'VARCHAR':
    case 'BPCHAR':
    default:
      return `f_data->>'${elem.field}'`;
  }
}

export function generateSQL(
  schemaName: string,
  tblName: string,
  sequenceName: string,
  fieldArray: FieldDefinition[],
) {

  if (!fs.existsSync(path.join('dist', 'sql'))) {
    fs.mkdirSync(path.join('dist', 'sql'), {recursive: true});
  }

  // GET
  const getFncName = `${schemaName}.${tblName}_get`;
  const sqlGet = `
    CREATE OR REPLACE FUNCTION ${getFncName}(a_id integer)
      RETURNS TEXT AS
    $BODY$
    BEGIN
      RETURN to_jsonb( u ) FROM (
        SELECT
    ${getFunctionList(fieldArray)} 
        FROM ${schemaName}.${tblName}
        WHERE ${fieldArray[0].field} = a_id
      ) as u;
    END;
    $BODY$
      LANGUAGE plpgsql VOLATILE
                       COST 100;
    COMMENT ON FUNCTION ${getFncName}(integer) IS 'Get ${tblName}';
    ALTER FUNCTION ${getFncName}(integer) OWNER TO ${privOwner};
    GRANT EXECUTE ON FUNCTION ${getFncName}(integer) TO ${privUser};
    `;
  fs.writeFileSync(path.join('dist', 'sql', `fnc_${getFncName}.sql`), sqlGet);

  // DELETE
  const delFncName = `${schemaName}.${tblName}_delete`;
  const sqlDelete = `
    CREATE OR REPLACE FUNCTION ${delFncName}( a_id integer )
      RETURNS TEXT AS
    $BODY$
    BEGIN
      PERFORM 1 FROM ${schemaName}.${tblName} WHERE ${fieldArray[0].field} = a_id;
      IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Item not exist', 'code', 404);
      END IF;
    
      DELETE FROM ${schemaName}.${tblName} WHERE ${fieldArray[0].field} = a_id;
    
      RETURN jsonb_build_object('code', 202 );
    END;
    $BODY$
    LANGUAGE plpgsql VOLATILE
                       COST 100;
    ALTER FUNCTION ${delFncName}(integer) OWNER TO ${privOwner};
    GRANT EXECUTE ON FUNCTION ${delFncName}(integer) TO ${privUser};`;
  fs.writeFileSync(path.join('dist', 'sql', `fnc_${delFncName}.sql`), sqlDelete);

  // LIST
  const listFncName = `${schemaName}.${tblName}_list`;
  const sqlList = `
    CREATE OR  REPLACE FUNCTION ${listFncName}(a_filter character varying)
      RETURNS TEXT AS
    $BODY$
    DECLARE
      f_filter jsonb;
    BEGIN
      f_filter = CAST(a_filter as jsonb);
      RETURN COALESCE(to_jsonb(array_agg( u )),'[]'::jsonb) FROM (
        SELECT
    ${getFunctionList(fieldArray)}
        FROM ${schemaName}.${tblName}
      ) as u;
    END;
    $BODY$
      LANGUAGE plpgsql VOLATILE
                       COST 100;
    COMMENT ON FUNCTION ${listFncName}(character varying) IS 'List';
    ALTER FUNCTION ${listFncName}(character varying) OWNER TO ${privOwner};
    GRANT EXECUTE ON FUNCTION ${listFncName}(character varying) TO ${privUser};
    `;
  fs.writeFileSync(path.join('dist', 'sql', `fnc_${listFncName}.sql`), sqlList);

  // SAVE
  const saveFncName = `${schemaName}.${tblName}_save`;
  let sqlSave = `
    CREATE OR REPLACE FUNCTION ${saveFncName}( a_data character varying )
        RETURNS text AS
    $BODY$
    DECLARE
        f_id    integer;
        f_data  jsonb;
    BEGIN
        f_data = a_data::jsonb;
        f_id   = cast( f_data->>'${fieldArray[0].field}' as integer );
    
        IF f_id > 0 THEN
            UPDATE ${schemaName}.${tblName} SET
    `;
  fieldArray.forEach((item) => {
    sqlSave += `      ${item.field} = ${sqlData(item)},\n`;
  });
  sqlSave = sqlSave.slice(0, -2);
  sqlSave += `
            WHERE ${fieldArray[0].field} = f_id;
        ELSE
            f_id = nextval('${sequenceName}'::regclass);
            INSERT INTO ${schemaName}.${tblName} (
    ${getFunctionList(fieldArray)}
            ) VALUES (
                f_id,
    `;
  fieldArray.forEach((item) => {
    sqlSave += `      ${sqlData(item)},\n`;
  });
  sqlSave = sqlSave.slice(0, -2);
  sqlSave += `
            );
        END IF;
    
        RETURN jsonb_build_object('id', f_id, 'code', 200 );
    END;
    $BODY$
        LANGUAGE plpgsql VOLATILE
                         COST 100;
    ALTER FUNCTION ${saveFncName}(character varying) OWNER TO ${privOwner};
    GRANT EXECUTE ON FUNCTION ${saveFncName}(character varying) TO ${privUser};
    `;
  fs.writeFileSync(path.join('dist', 'sql', `fnc_${saveFncName}.sql`), sqlSave);
}
