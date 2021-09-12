import * as fs from 'fs';
import * as path from 'path';
import { FieldDefinition } from './sql_to_fnc.interfaces';
import { capitalize, isNumber, isString } from "./common";
/**
 * Generate API NestJS templates
 */

function generateModelDto(
  schemaName: string,
  tblName: string,
  fieldArray: FieldDefinition[],
) {
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
  fs.writeFileSync(path.join('dist', 'api', tblName, 'dto', `${capitalize(tblName)}.dto.ts`), tsDto);
}

/**
 * FilterItem.dto.ts - NestJS global definition
 */
function generateFilterItemDto() {
  /**
   * FilterItem Dto
   */
  let tsFilterDto = `import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class FilterItemDto {
  @IsString()
  @ApiProperty({
    description: 'Field name to be search on',
    type: 'string',
    example: 'name',
  })
  field: string;

  @IsString()
  @ApiProperty({
    description: 'Search value',
    type: 'string',
    example: 'Kowalski',
  })
  value: string;
}`;
  fs.writeFileSync(path.join('dist', 'api', 'dto', `FilterItem.dto.ts`), tsFilterDto);
}

/**
 * ListFilterRequest.dto  - NestJS global definition
 */
function generateListFilterRequestDto() {
  let tsItem =`import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { FilterItemDto } from './FilterItem.dto';

export class ListFilterRequestDto {
  @IsArray()
  @ApiProperty({
    description: 'List filtered fields with search values',
    type: [FilterItemDto],
    required: false,
  })
  filter: FilterItemDto[];
  
  @IsString()
  @ApiProperty({
    description: 'Sort direction',
    type: 'string',
    enum: ['asc', 'desc', ''],
    example: 'asc',
  })
  sort_direction: string;
  
  @IsArray()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Fields to be sorted',
    type: '[string]',
    example: '[\\'name\\', \\'surname\\']',
    required: false,
  })
  sort: string[];
  
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    description: 'Page index',
    type: 'number',
    example: '1',
  })
  page_index: number;
  
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    description: 'Page size',
    type: 'number',
    example: 25,
  })
  page_size: number;
}`;
  fs.writeFileSync(path.join('dist', 'api', 'dto', `ListFilterRequest.dto.ts`), tsItem);
}

/**
 * List Response Dto
 */
function generateListResponseDto(
  schemaName: string,
  tblName: string,
) {
  let tsListResponseDto = `import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ${capitalize(tblName)}Dto } from './${capitalize(tblName)}.dto';

export class ${capitalize(tblName)}ListResponseDto {
  @IsNumber()
  @ApiProperty({
    description: 'Table item count',
    type: 'number',
    example: '1000',
  })
  cnt: number;

  @ApiProperty({
    description: 'Response item array',
    type: [${capitalize(tblName)}],
    example: [],
  })
  data: ${capitalize(tblName)}Dto[];
}`;
  fs.writeFileSync(path.join('dist', 'api', tblName, 'dto', `${capitalize(tblName)}ListResponse.dto.ts`), tsListResponseDto);
}

/**
 * Controller
 */
function generateController(
  schemaName: string,
  tblName: string,
) {
  const tsController = `import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus, Param , Post, UseGuards,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ${capitalize(tblName)}Dto } from './dto/${capitalize(tblName)}.dto';
import { ${capitalize(tblName)}ListResponseDto } from './dto/${capitalize(tblName)}ListResponse.dto';
import { ListFilterRequestDto } from '../dto/ListFilterRequest.dto';
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
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Database error' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Invalid credentials' })
  @ApiResponse({ status: HttpStatus.TOO_MANY_REQUESTS, description: 'Too many requests' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Response with list', type: ${capitalize(tblName)}ListResponseDto })
  list(@Body() filter: ListFilterRequestDto): Observable< ${capitalize(tblName)}ListResponseDto > {
    return this.${tblName}Service.list(filter);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Database error' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Invalid credentials' })
  @ApiResponse({ status: HttpStatus.TOO_MANY_REQUESTS, description: 'Too many requests' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Response description', type: ${capitalize(tblName)}Dto })
  get(@Param('id') id: number): Observable< ${capitalize(tblName)}Dto > {
    return this.${tblName}Service.get(id);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Database error' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Invalid credentials' })
  @ApiResponse({ status: HttpStatus.TOO_MANY_REQUESTS, description: 'Too many requests' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Response with id' })
  add(@Body() ${tblName}: ${capitalize(tblName)}Dto) {
    return this.${tblName}Service.save(${tblName});
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Database error' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Invalid credentials' })
  @ApiResponse({ status: HttpStatus.TOO_MANY_REQUESTS, description: 'Too many requests' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Deleted' })
  delete(@Param('id') id: number) {
    return this.${tblName}Service.delete(id);
  }
}
`;
  fs.writeFileSync(path.join('dist', 'api', tblName, `${tblName}.controller.ts`), tsController);
}

/**
 * Service
 */
function generateService(
  schemaName: string,
  tblName: string,
) {
  let tsService = `import { HttpException, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ${capitalize(tblName)}Dto } from './dto/${capitalize(tblName)}.dto';
import { ${capitalize(tblName)}ListResponseDto } from './dto/${capitalize(tblName)}ListResponse.dto';
import { ListFilterRequestDto } from '../dto/ListFilterRequest.dto';
import { DbService } from '../../shared/db/db.service';
import { CustomLogger } from '../../shared/logger/custom-logger';

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
  list(filter: ListFilterRequestDto): Observable< ${capitalize(tblName)}ListResponseDto > {
    return new Observable<${capitalize(tblName)}ListResponseDto>((observer) => {
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
  fs.writeFileSync(path.join('dist', 'api', tblName, `${tblName}.service.ts`), tsService);
}

export function generateAPI(
  schemaName: string,
  tblName: string,
  fieldArray: FieldDefinition[],
) {
  // Create module directory
  if (!fs.existsSync(path.join('dist', 'api', tblName, 'dto'))) {
    fs.mkdirSync(path.join('dist', 'api', tblName, 'dto'), { recursive: true });
  }
  // Create global DTO directory
  if (!fs.existsSync(path.join('dist', 'api', 'dto'))) {
    fs.mkdirSync(path.join('dist', 'api', 'dto'), { recursive: true });
  }
  generateModelDto(schemaName, tblName, fieldArray);

  generateFilterItemDto();

  generateListFilterRequestDto();

  generateListResponseDto(schemaName, tblName);

  generateController(schemaName, tblName);

  generateService(schemaName, tblName);
}
