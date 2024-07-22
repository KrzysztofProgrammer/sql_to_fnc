import * as fs from 'fs';
import * as path from 'path';
import { FieldDefinition } from './sql_to_fnc.interfaces';
import { capitalize, isNumber, isBoolean, isString, snakeToCamel, snakeToDash } from './common';
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
  const dtoName = `${snakeToCamel(tblName)}Dto`;
  let tsDto = `import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';

export class ${dtoName} {\n`;
  fieldArray.forEach((item) => {
    // Set swagger decorators
    let tsType = 'string';
    if (isNumber(item)) { tsType = 'number'; }
    if (isBoolean(item)) { tsType = 'boolean'; }
    if (item.notNull) { tsDto += '  @IsNotEmpty()\n'; }
    if (isNumber(item)) { tsDto += '  @IsNumber()\n'; }
    if (isString(item)) { tsDto += '  @IsString()\n'; }
    if (
      (!item.notNull) && (isNumber(item) || isString(item))
    ) {
      tsDto += '  @IsOptional()\n';
    }
    tsDto += `  @ApiProperty({
    description: '${item.description}',
    type: '${tsType}',
    example: '',
  })\n`;
    tsDto += `  ${item.field}: ${tsType};\n\n`;
  });
  tsDto += '}';
  fs.writeFileSync(path.join('dist', 'api', snakeToDash(tblName), 'dto', `${snakeToCamel(tblName)}.dto.ts`), tsDto);
}

/**
 * Error.dto.ts - NestJS global error response definition
 */
function generateErrorDto() {
  let tsErrorDto = `import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({
    description: 'Information about error',
    type: 'string',
    example: 'Login or password invalid',
  })
  error: string;

  @ApiProperty({
    description: 'HTTP error response code',
    type: 'number',
    example: 404,
  })
  code: number;
}`;
  fs.writeFileSync(path.join('dist', 'api', 'dto', 'ErrorResponse.dto.ts'), tsErrorDto);
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
  fs.writeFileSync(path.join('dist', 'api', 'dto', 'FilterItem.dto.ts'), tsFilterDto);
}

/**
 * ListFilterRequest.dto  - NestJS global definition
 */
function generateListFilterRequestDto() {
  let tsItem = `import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';
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
  @IsOptional()
  @ApiProperty({
    description: 'Fields to be sorted',
    type: 'array',
    items: {
      type: 'string',
    },
    example: '[\\'name\\', \\'surname\\']',
    required: false,
  })
  sort?: string[];

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    description: 'Page index',
    type: 'number',
    example: 1,
  })
  page_index: number;

  @IsNumber()
  @ApiProperty({
    description: 'Page size. If empty, all items are returned.',
    type: 'number',
    example: 25,
  })
  page_size?: number;
}`;
  fs.writeFileSync(path.join('dist', 'api', 'dto', 'ListFilterRequest.dto.ts'), tsItem);
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
import { ${snakeToCamel(tblName)}Dto } from './${snakeToCamel(tblName)}.dto';

export class ${snakeToCamel(tblName)}ListResponseDto {
  @IsNumber()
  @ApiProperty({
    description: 'Table item count',
    type: 'number',
    example: '1000',
  })
  cnt: number;

  @ApiProperty({
    description: 'Response item array',
    type: [${snakeToCamel(tblName)}Dto],
    example: [],
  })
  data: ${snakeToCamel(tblName)}Dto[];
}`;
  fs.writeFileSync(path.join('dist', 'api', snakeToDash(tblName), 'dto', `${snakeToCamel(tblName)}ListResponse.dto.ts`), tsListResponseDto);
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
  Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, UseGuards,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ${snakeToCamel(tblName)}Dto } from './dto/${snakeToCamel(tblName)}.dto';
import { ${snakeToCamel(tblName)}ListResponseDto } from './dto/${snakeToCamel(tblName)}ListResponse.dto';
import { ListFilterRequestDto } from '../dto/ListFilterRequest.dto';
import { ${snakeToCamel(tblName)}Service } from './${snakeToDash(tblName)}.service';

@ApiTags('${tblName}')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('${tblName}')
export class ${snakeToCamel(tblName)}Controller {
  constructor(
    private ${snakeToCamel(tblName, false)}Service: ${snakeToCamel(tblName)}Service,
  ) {
  }

  @Post('list')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Database error', type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Invalid credentials', type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.TOO_MANY_REQUESTS, description: 'Too many requests' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Response with list', type: ${snakeToCamel(tblName)}ListResponseDto })
  list(@Body() filter: ListFilterRequestDto): Observable< ${snakeToCamel(tblName)}ListResponseDto > {
    return this.${snakeToCamel(tblName, false)}Service.list(filter);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Database error', type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Invalid credentials', type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.TOO_MANY_REQUESTS, description: 'Too many requests' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Item not found', type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Response description', type: ${snakeToCamel(tblName)}Dto })
  get(@Param('id') id: number): Observable< ${snakeToCamel(tblName)}Dto > {
    return this.${snakeToCamel(tblName, false)}Service.get(id);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Database error', type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Invalid credentials', type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.TOO_MANY_REQUESTS, description: 'Too many requests' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Item not found', type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Response with id' })
  save(@Body() ${snakeToCamel(tblName, false)}: ${capitalize(snakeToCamel(tblName))}Dto) {
    return this.${snakeToCamel(tblName, false)}Service.save(${snakeToCamel(tblName, false)});
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Database error', type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Invalid credentials', type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.TOO_MANY_REQUESTS, description: 'Too many requests' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Item not found', type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Deleted' })
  delete(@Param('id') id: number) {
    return this.${snakeToCamel(tblName, false)}Service.delete(id);
  }
}
`;
  fs.writeFileSync(path.join('dist', 'api', snakeToDash(tblName), `${snakeToDash(tblName)}.controller.ts`), tsController);
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
import { ${snakeToCamel(tblName)}Dto } from './dto/${snakeToCamel(tblName)}.dto';
import { ${snakeToCamel(tblName)}ListResponseDto } from './dto/${snakeToCamel(tblName)}ListResponse.dto';
import { ListFilterRequestDto } from '../dto/ListFilterRequest.dto';
import { DbService } from '../../shared/db/db.service';
import { CustomLogger } from '../../shared/logger/custom-logger';

@Injectable()
export class ${snakeToCamel(tblName)}Service {
  constructor(
    private db: DbService,
    private customLogger: CustomLogger,
  ) {
    this.customLogger.setContext('${snakeToCamel(tblName)} service');
  }
`;

  tsService += `
  list(filter: ListFilterRequestDto): Observable< ${snakeToCamel(tblName)}ListResponseDto > {
    return new Observable<${snakeToCamel(tblName)}ListResponseDto>((observer) => {
      this.db.query('SELECT ${schemaName}.${tblName}_list($1)', [filter]).subscribe({
        next: (respSQL) => {
          if (respSQL.error) {
            observer.error(new HttpException(respSQL.error, respSQL.code));
            return;
          }
          observer.next(respSQL);
          observer.complete();
        },
        error: (dbErr) => observer.error(dbErr),
      });
    });
  }

  save(${snakeToCamel(tblName, false)}: ${snakeToCamel(tblName)}Dto): Observable<any> {
    return new Observable<any>((observer) => {
      this.db.query('SELECT ${schemaName}.${tblName}_save($1)', [JSON.stringify(${snakeToCamel(tblName, false)})]).subscribe({
        next: (respSQL) => {
          if (respSQL.error) {
            observer.error(new HttpException(respSQL.error, respSQL.code));
            return;
          }
          observer.next(respSQL);
          observer.complete();
        },
        error: (dbErr) => observer.error(dbErr),
      });
    });
  }

  get(id: number): Observable<${snakeToCamel(tblName)}Dto> {
    return new Observable((observer) => {
      this.db.query('SELECT ${schemaName}.${tblName}_get($1)', [id]).subscribe({
        next: (respSQL) => {
          if (respSQL.error) {
            observer.error(new HttpException(respSQL.error, respSQL.code));
            return;
          }
          observer.next(respSQL);
          observer.complete();
        },
        error: (dbErr) => observer.error(dbErr),
      });
    });
  }

  delete(id: number) {
    return new Observable((observer) => {
      this.db.query('SELECT ${schemaName}.${tblName}_delete($1)', [id]).subscribe({
        next: (respSQL) => {
          if (respSQL.error) {
            observer.error(new HttpException(respSQL.error, respSQL.code));
            return;
          }
          observer.next(respSQL);
          observer.complete();
        },
        error: (dbErr) => observer.error(dbErr),
      });
    });
  }
}
`;
  fs.writeFileSync(path.join('dist', 'api', snakeToDash(tblName), `${snakeToDash(tblName)}.service.ts`), tsService);
}

/**
 * Module
 */
function generateModule(
  schemaName: string,
  tblName: string,
) {
  let tsModule = `import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { ${snakeToCamel(tblName)}Service } from './${snakeToDash(tblName)}.service';
import { ${snakeToCamel(tblName)}Controller } from './${snakeToDash(tblName)}.controller';

@Module({
  imports: [SharedModule],
  providers: [${snakeToCamel(tblName)}Service],
  exports: [${snakeToCamel(tblName)}Service],
  controllers: [${snakeToCamel(tblName)}Controller],
})
export class ${snakeToCamel(tblName)}Module {}
`;

  fs.writeFileSync(path.join('dist', 'api', snakeToDash(tblName), `${snakeToDash(tblName)}.module.ts`), tsModule);
}

export function generateAPI(
  schemaName: string,
  tblName: string,
  fieldArray: FieldDefinition[],
) {
  // Create module directory
  if (!fs.existsSync(path.join('dist', 'api', snakeToDash(tblName), 'dto'))) {
    fs.mkdirSync(path.join('dist', 'api', snakeToDash(tblName), 'dto'), { recursive: true });
  }
  // Create global DTO directory
  if (!fs.existsSync(path.join('dist', 'api', 'dto'))) {
    fs.mkdirSync(path.join('dist', 'api', 'dto'), { recursive: true });
  }
  generateModelDto(schemaName, tblName, fieldArray);

  generateFilterItemDto();

  generateErrorDto();

  generateListFilterRequestDto();

  generateListResponseDto(schemaName, tblName);

  generateController(schemaName, tblName);

  generateService(schemaName, tblName);

  generateModule(schemaName, tblName);
}
