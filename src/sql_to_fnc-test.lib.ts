import { FieldDefinition } from "./sql_to_fnc.interfaces";
import * as fs from "fs";
import * as path from "path";
import { capitalize } from "./common";



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
  if (!fs.existsSync(path.join('dist', 'tests', 'data'))) {
    fs.mkdirSync(path.join('dist', 'tests', 'data'), {recursive: true});
  }

  let testTs = `import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { ${tblName}Filter, ${tblName}ValidItem, ${tblName}WrongItem } from './data/${capitalize(tblName)}.data';


describe('${capitalize(tblName)}', () => {
  let app: INestApplication;
  let jwtToken: string;
  let itemFromList: any; // first item from list
  let newId: number; // create, then delete

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

  beforeEach(async (done) => {
    if (jwtToken) {
      done();
      return;
    }
    // TODO: Authorization jwtoken inquire
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send(validLogin)
      .expect(200);
    jwtToken = response.body.access_token;
    expect(jwtToken).toMatch(/^[A-Za-z0-9-_=]+\\.[A-Za-z0-9-_=]+\\.?[A-Za-z0-9-_.+/=]*$/); // jwt regex
    done();
  });

  describe('${capitalize(tblName)} service', () => {

    it('/${tblName}/list',
      (done) => request(app.getHttpServer())
        .post('/${tblName}/list')
        .set('Accept', 'application/json')
        .set('Authorization', \`Bearer \${jwtToken}\`)
        .send(${tblName}Filter)
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          // expect(res.body).toHaveLength(1);
          // eslint-disable-next-line prefer-destructuring
          itemFromList = res.body[0];
          if (err) {
            return done(err);
          }
          return done();
        }));

    it('/${tblName}/number GET first item description',
      (done) => request(app.getHttpServer())
        .get(\`/${tblName}/\${itemFromList.${fieldArray[0].field}}\`)
        .set('Authorization', \`Bearer \${jwtToken}\`)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(done));

    it('/${tblName} POST - save / update item',
      (done) => request(app.getHttpServer())
        .post('/${tblName}')
        .set('Accept', 'application/json')
        .set('Authorization', \`Bearer \${jwtToken}\`)
        .send(${tblName}ValidItem)
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          // console.log(res.body);
          expect(res.body).toBeDefined();
          expect(res.body.id).toBeDefined();
          // eslint-disable-next-line prefer-destructuring
          newId = res.body.id;
          if (err) {
            return done(err);
          }
          return done();
        }));

    it('/${tblName}/0 DELETE Wrong params',
      (done) => request(app.getHttpServer())
        .delete('/${tblName}/0')
        .set('Accept', 'application/json')
        .set('Authorization', \`Bearer \${jwtToken}\`)
        .expect(404)
        .expect('Content-Type', /json/)
        .end(done));
   
    it('/${tblName}/number DELETE',
      (done) => request(app.getHttpServer())
        .delete(\`/${tblName}/\${newId}\`)
        .set('Accept', 'application/json')
        .set('Authorization', \`Bearer \${jwtToken}\`)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(done));

     // TODO: Add more tests for invalid inputs, save and update
  });
});
  `;
  fs.writeFileSync(path.join('dist','tests',`${tblName}.e2e-spec.ts`), testTs);


  /**
   * Test data
   */
  let testDataTs = `export const ${tblName}ValidItem: ${capitalize(tblName)}Dto = {\n`;
fieldArray.forEach((item) => {
  testDataTs += `     ${item.field}: ${testData(item)},\n`;
});
  testDataTs = testDataTs.slice(0, -2);
testDataTs += '\n};\n'

testDataTs += `export const ${tblName}WrongItem : ${capitalize(tblName)}Dto = {\n`;
  fieldArray.forEach((item) => {
    testDataTs += `     ${item.field}: ${testData(item)},\n`;
  });
  testDataTs = testDataTs.slice(0, -2);
  testDataTs += '\n};\n'

  testDataTs +=`export const ${tblName}Filter: ListFilterRequestDto = {
  filter: [{ field: '${fieldArray[1].field}', value: '%' }],
  page_index: 1,
  sort_direction: 'asc',
  sort: ['${fieldArray[1].field}'],
  page_size: 25,
}`;


  fs.writeFileSync(path.join('dist','tests','data',`${tblName}.data.ts`), testDataTs);
}
