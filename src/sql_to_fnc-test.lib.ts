import { FieldDefinition } from "./sql_to_fnc.interfaces";
import * as fs from "fs";
import * as path from "path";

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function testData(elem: FieldDefinition): string {
  switch (elem.type) {
    case 'BOOL':
      return `true`;
    case 'DATE':
    case 'TIMESTAMPTZ':
    case 'TIMESTAMP':
    case 'INT4':
    case 'INT8':
    case 'INTEGER':
      return `0`;
    case 'VARCHAR':
    case 'BPCHAR':
    default:
      return `''`;
  }
}

export function generateTestE2E(
  schemaName: string,
  tblName: string,
  fieldArray: FieldDefinition[],
) {
  if (!fs.existsSync(path.join('dist', 'tests'))) {
    fs.mkdirSync(path.join('dist', 'tests'), {recursive: true});
  }

  let testTs = `import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';

describe('${capitalize(tblName)}', () => {
  let app: INestApplication;
  let jwtToken: string;
  let newId: number; // create, then delete
  const ${tblName}Item : ${capitalize(tblName)}Dto = {\n`;
  fieldArray.forEach((item) => {
    testTs += `     ${item.field}: ${testData(item)},\n`;
  });
  testTs = testTs.slice(0, -2);
testTs += `\n};

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
    .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });
  // TODO: Authorization jwtoken inquire, add more tests for invalid inputs, save and update

  describe('${capitalize(tblName)} service', () => {

    it('/${tblName}/list',
      (done) => request(app.getHttpServer())
        .post('/${tblName}/list')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer '+jwtToken)
        .send({})
        .expect('Content-TYpe', /json/)
        .expect(200)
        .end(done));

    it('/${tblName}/0 GET description',
      (done) => request(app.getHttpServer())
        .get('/${tblName}')
        .expect(200)
        .expect('Content-TYpe', /json/)
        .expect({})
        .end(done));

    it('/${tblName} POST - save / update item',
      (done) => request(app.getHttpServer())
        .post('/${tblName}')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer '+jwtToken)
        .send({})
        .expect('Content-TYpe', /json/)
        .expect(200)
        .end(done));

    it('/${tblName}/0 DELETE Wrong params',
      (done) => request(app.getHttpServer())
        .delete('/${tblName}/0')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer '+jwtToken)
        .expect(404)
        .expect('Content-TYpe', /json/)
        .end(done));
  });
});
  `;
  fs.writeFileSync(path.join('dist','tests',`${tblName}.e2e-spec.ts`), testTs);
}
