import * as fs from 'fs';
import * as path from 'path';
import { FieldDefinition } from './sql_to_fnc.interfaces';
import { capitalize, snakeToCamel, snakeToDash } from './common';

function testData(elem: FieldDefinition): string {
  switch (elem.type) {
    case 'BOOL':
      return 'true';
    case 'DATE':
    case 'TIMESTAMPTZ':
    case 'TIMESTAMP':
    case 'INT4':
    case 'INT8':
    case 'INTEGER':
      return '0';
    case 'VARCHAR':
    case 'BPCHAR':
    default:
      return '\'\'';
  }
}

/**
 * Test data files
 */
function generateTestData(tblName: string, fieldArray: FieldDefinition[]) {
  if (!fs.existsSync(path.join('dist', 'tests', 'data'))) {
    fs.mkdirSync(path.join('dist', 'tests', 'data'), { recursive: true });
  }
  let testDataTs = `export const ${snakeToCamel(tblName, false)}ValidItem: ${capitalize(snakeToCamel(tblName))}Dto = {\n`;
  fieldArray.forEach((item) => {
    testDataTs += `  ${item.field}: ${testData(item)},\n`;
  });
  testDataTs = testDataTs.slice(0, -1);
  testDataTs += '\n};\n';

  testDataTs += `export const ${snakeToCamel(tblName, false)}WrongItem : ${capitalize(snakeToCamel(tblName))}Dto = {\n`;
  fieldArray.forEach((item) => {
    testDataTs += `  ${item.field}: ${testData(item)},\n`;
  });
  testDataTs = testDataTs.slice(0, -1);
  testDataTs += '\n};\n';

  testDataTs += `export const ${snakeToCamel(tblName, false)}Filter: ListFilterRequestDto = {
  filter: [{ field: '${fieldArray[1].field}', value: '%' }],
  page_index: 0,
  sort_direction: 'asc',
  sort: ['${fieldArray[1].field}'],
  page_size: 25,
}`;

  fs.writeFileSync(path.join('dist', 'tests', 'data', `${snakeToDash(tblName)}.data.ts`), testDataTs);
}

function generateHelpers() {
  if (!fs.existsSync(path.join('dist', 'tests', 'utils'))) {
    fs.mkdirSync(path.join('dist', 'tests', 'utils'), { recursive: true });
  }
  let txt = `
let jwtToken;

export async function getToken() {
    if (jwtToken) {
      return jwtToken;
    }
    // TODO: Authorization jwtToken inquire
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send(validLogin)
      .expect(200);
    expect(response).toBeDefined();
    expect(response.body).toBeDefined();
    expect(response.body.access_token).toBeDefined();
    jwtToken = response.body.access_token;
    expect(jwtToken).toMatch(/^[A-Za-z0-9-_=]+\\.[A-Za-z0-9-_=]+\\.?[A-Za-z0-9-_.+/=]*$/); // jwt regex
    return jwtToken;
}
  `;
  fs.writeFileSync(path.join('dist', 'tests', 'utils', 'get-token.ts'), txt);
}

export function generateTestE2E(
  schemaName: string,
  tblName: string,
  fieldArray: FieldDefinition[],
) {
  if (!fs.existsSync(path.join('dist', 'tests'))) {
    fs.mkdirSync(path.join('dist', 'tests'), { recursive: true });
  }


  let testTs = `import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import {
  ${snakeToCamel(tblName, false)}Filter,
  ${snakeToCamel(tblName, false)}ValidItem,
  ${snakeToCamel(tblName, false)}WrongItem,
} from './data/${snakeToDash(tblName)}.data';
import { getToken } from './utils/get-token'

describe('${snakeToCamel(tblName)}', () => {
  let app: INestApplication;
  let jwtToken: string;
  let itemFromList: any; // first item from list
  let newId: number; // create, then delete

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    jwtToken = await getToken();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {});

  describe('${snakeToCamel(tblName)} service', () => {
    it('/${tblName} POST - save save new item',
      (done) => {
        request(app.getHttpServer())
          .post('/${tblName}')
          .set('Accept', 'application/json')
          .set('Authorization', \`Bearer \${jwtToken}\`)
          .send(${snakeToCamel(tblName, false)}ValidItem)
          .expect('Content-Type', /json/)
          .end((err, res) => {
            expect(res.statusCode).toEqual(200);
            expect(res.body).toBeDefined();
            expect(res.body.id).toBeDefined();
            // eslint-disable-next-line prefer-destructuring
            newId = res.body.id;
            if (err) {
              done(err);
              return;
            }
            done();
          });
      });

    it('/${tblName} POST - update item',
      (done) => {
        const updateItem = JSON.parse(JSON.stringify(${snakeToCamel(tblName, false)}ValidItem));
        updateItem.id = newId;
        request(app.getHttpServer())
          .post('/${tblName}')
          .set('Accept', 'application/json')
          .set('Authorization', \`Bearer \${jwtToken}\`)
          .send(updateItem)
          .expect('Content-Type', /json/)
          .end((err, res) => {
            expect(res.statusCode).toEqual(200);
            expect(res.body).toBeDefined();
            expect(res.body.id).toBeDefined();
            newId = res.body.id;
            if (err) {
              done(err);
              return;
            }
            done();
          });
      });

    it('/${tblName}/list - load entries from API',
      (done) => { 
        request(app.getHttpServer())
          .post('/${tblName}/list')
          .set('Accept', 'application/json')
          .set('Authorization', \`Bearer \${jwtToken}\`)
          .send(${snakeToCamel(tblName, false)}Filter)
          .expect('Content-Type', /json/)
          .end((err, res) => {
            expect(res.statusCode).toEqual(200);
            expect(res.body.data).toBeDefined();           
            expect(res.body.data.length).toBeGreaterThan(0);
            expect(res.body.data[0]).toBeDefined();
            itemFromList = res.body.data[0];
            if (err) {
              done(err);
              return;
            }
            done();
          });
      });

    it('/${tblName}/number GET first item description',
      () => request(app.getHttpServer())
        .get(\`/${tblName}/\${itemFromList.${fieldArray[0].field}}\`)
        .set('Authorization', \`Bearer \${jwtToken}\`)
        .expect(200)
        .expect('Content-Type', /json/));

    it('/${tblName}/0 DELETE Wrong params',
      () => request(app.getHttpServer())
        .delete('/${tblName}/0')
        .set('Accept', 'application/json')
        .set('Authorization', \`Bearer \${jwtToken}\`)
        .expect(404)
        .expect('Content-Type', /json/));

    it('/${tblName}/number DELETE',
      () => request(app.getHttpServer())
        .delete(\`/${tblName}/\${newId}\`)
        .set('Accept', 'application/json')
        .set('Authorization', \`Bearer \${jwtToken}\`)
        .expect(200)
        .expect('Content-Type', /json/));

    it.todo('Add test deleting when deletion is not possible');
    it.todo('Add tests for invalid inputs, save and update');
  });
});
`;
  fs.writeFileSync(path.join('dist', 'tests', `${snakeToDash(tblName)}.e2e-spec.ts`), testTs);

  generateTestData(tblName, fieldArray);

  generateHelpers();
}
