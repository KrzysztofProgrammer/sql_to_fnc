import * as fs from 'fs';
import * as path from 'path';
import { FieldDefinition } from './sql_to_fnc.interfaces';
/**
 * Generate API NestJS templates
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function isNumber(item: FieldDefinition): boolean {
  if (['INT4', 'INT8', 'INTEGER'].indexOf(item.type.toUpperCase()) >= 0) {
    return true;
  }
  return false;
}

function isString(item: FieldDefinition): boolean {
  if (
    (item.type.toUpperCase().indexOf('VARCHAR') >= 0)
    || (item.type.toUpperCase().indexOf('BPCHAR') >= 0)
    || (item.type.toUpperCase().indexOf('TEXT') >= 0)
  ) return true;
  return false;
}

export function generateAPI(
  schemaName: string,
  tblName: string,
  fieldArray: FieldDefinition[],
) {

  if (!fs.existsSync(path.join('dist', 'api', 'dto'))) {
    fs.mkdirSync(path.join('dist', 'api', 'dto'), { recursive: true });
  }

  /**
   * model DTO
   */
  const dtoName = `${capitalize(tblName)}Dto`;
  let tsDto = `import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ${dtoName} {\n`;
  fieldArray.forEach((item) => {
    // Set swagger decorators
    let tsType = 'string';
    if (isNumber(item)) { tsType = 'number'; }
    if (item.notNull) { tsDto += '  @IsNotEmpty()\n'; }
    if (isNumber(item)) { tsDto += '  @IsNumber()\n'; }
    if (isString(item)) { tsDto += '  @IsString()\n'; }
    tsDto += `  @ApiProperty({
    description: '',
    type: '${tsType}',
    example: '',
  })\n`;
    tsDto += `  ${item.field}: ${tsType};\n\n`;
  });
  tsDto += '}';
  fs.writeFileSync(path.join('dist', 'api', 'dto', `${capitalize(tblName)}.dto.ts`), tsDto);

  /**
   * Filter Dto
   */
  const filterDtoName = `${capitalize(tblName)}FilterDto`;
  let tsFilterDto = `import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ${filterDtoName} {\n`;
  tsFilterDto += '}';
  fs.writeFileSync(path.join('dist', 'api', 'dto', `${capitalize(tblName)}Filter.dto.ts`), tsFilterDto);

  /**
   * Controller
   */
  const tsController = `import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus, Param , Post, UseGuards,
} from '@nestjs/common';
import { ${capitalize(tblName)}Dto } from './dto/${capitalize(tblName)}.dto';
import { ${capitalize(tblName)}FilterDto } from './dto/${capitalize(tblName)}Filter.dto';
import { ${capitalize(tblName)}Service } from './${tblName}.service';

@ApiTags('${tblName}')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('${tblName}')
export class ${capitalize(tblName)}Controller {
  constructor(
    private ${tblName}Service: ${capitalize(tblName)}Service,
  ) {
  }

  @Post('list')
  @HttpCode(200)
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Database error' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Invalid credentials' })
  @ApiResponse({ status: 200, description: 'Response with list' })
  list(@Body() filter: ${capitalize(tblName)}FilterDto) {
    return this.${tblName}Service.list(filter);
  }

  @Get(':id')
  @HttpCode(200)
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Database error' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Invalid credentials' })
  @ApiResponse({ status: 200, description: 'Response description', type: ${capitalize(tblName)}Dto })
  get(@Param('id') id: number) {
    return this.${tblName}Service.get(id);
  }

  @Post()
  @HttpCode(200)
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Database error' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Invalid credentials' })
  @ApiResponse({ status: 200, description: 'Response with id' })
  add(@Body() ${tblName}: ${capitalize(tblName)}Dto) {
    return this.${tblName}Service.save(${tblName});
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Database error' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Invalid credentials' })
  @ApiResponse({ status: 200, description: 'Deleted' })
  delete(@Param('id') id: number) {
    return this.${tblName}Service.delete(id);
  }
}
`;
  fs.writeFileSync(path.join('dist', 'api', `${tblName}.controller.ts`), tsController);

  /**
   * service
   */
  let tsService = `import { HttpException, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ${capitalize(tblName)}Dto } from './dto/${capitalize(tblName)}.dto';
import { ${capitalize(tblName)}FilterDto } from './dto/${capitalize(tblName)}Filter.dto';
import { DbService } from '../../shared/db/db.service';

@Injectable()
export class ${capitalize(tblName)}Service {
  constructor(
    private db: DbService,
    private customLogger: CustomLogger,
  ) {
    this.customLogger.setContext('${capitalize(tblName)} service');
  }
`;

  tsService += `
  list(filter: ${capitalize(tblName)}FilterDto): Observable<${capitalize(tblName)}Dto[]> {
    return new Observable<${capitalize(tblName)}Dto[]>((observer) => {
      this.db.query('SELECT ${schemaName}.${tblName}_list($1)', [filter]).subscribe(
        (respSQL) => {
          if (respSQL.error) {
            observer.error(new HttpException(respSQL.error, respSQL.code));
            return;
          }
          observer.next(respSQL);
          observer.complete();
        },
        (dbErr) => {
          observer.error(dbErr);
        },
      );
    });
  }

  save(${tblName}: ${capitalize(tblName)}Dto): Observable<any> {
    return new Observable<any>((observer) => {
      this.db.query('SELECT ${schemaName}.${tblName}_save($1)', [JSON.stringify(${tblName})]).subscribe(
        (respSQL) => {
          if (respSQL.error) {
            observer.error(new HttpException(respSQL.error, respSQL.code));
            return;
          }
          observer.next(respSQL);
          observer.complete();
        },
        (dbErr) => {
          this.customLogger.error(dbErr);
          observer.error(dbErr);
        },
      );
    });
  }

  get(id: number): Observable<${capitalize(tblName)}Dto> {
    return new Observable((observer) => {
      this.db.query('SELECT ${schemaName}.${tblName}_get($1)', [id]).subscribe(
        (respSQL) => {
          if (respSQL.error) {
            observer.error(new HttpException(respSQL.error, respSQL.code));
            return;
          }
          observer.next(respSQL);
          observer.complete();
        },
        (dbErr) => {
          this.customLogger.error(dbErr);
          observer.error(dbErr);
        },
      );
    });
  }

  delete(id: number) {
    return new Observable((observer) => {
      this.db.query('SELECT ${schemaName}.${tblName}_delete($1)', [id]).subscribe(
        (respSQL) => {
          if (respSQL.error) {
            observer.error(new HttpException(respSQL.error, respSQL.code));
            return;
          }
          observer.next(respSQL);
          observer.complete();
        },
        (dbErr) => {
          this.customLogger.error(dbErr);
          observer.error(dbErr);
        },
      );
    });
  }
}
`;
  fs.writeFileSync(path.join('dist', 'api', `${tblName}.service.ts`), tsService);
}
