import * as fs from 'fs';
import * as path from 'path';
import { FieldDefinition } from './sql_to_fnc.interfaces';
import { capitalize, isNumber, isBoolean, isDate, snakeToCamel, snakeToDash } from './common';
import * as dotenv from 'dotenv';

dotenv.config();
const datePlaceholder = process.env.DATE_PLACEHOLDER;
/**
 * Module
 */
function generateModule(
  schemaName: string,
  tblName: string,
) {
  const moduleTs = `import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListComponent } from './list/list.component';
import { EditComponent } from './edit/edit.component';
import { MaterialModule } from '../shared/material.module';
import { ${snakeToCamel(tblName)}Service } from './${snakeToDash(tblName)}.service';
import { ${snakeToCamel(tblName)}RoutingModule } from './${snakeToDash(tblName)}-routing.module';

@NgModule({
  declarations: [
    ListComponent,
    EditComponent,
  ],
  imports: [
    CommonModule,
    MaterialModule,
    ${snakeToCamel(tblName)}RoutingModule,
  ],
  providers: [
    ${snakeToCamel(tblName)}Service,
  ],
})
export class ${snakeToCamel(tblName)}Module { }
`;
  fs.writeFileSync(path.join('dist', 'www', `${snakeToDash(tblName)}.module.ts`  ), moduleTs);
}

/**
 * Routing module
 */
function generateRouting(
  schemaName: string,
  tblName: string,
) {
  const moduleTs = `import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListComponent } from './list/list.component';
import { EditComponent } from './edit/edit.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full',
  },
  {
    path: 'list',
    component: ListComponent,
  },
  {
    path: 'edit/:id',
    component: EditComponent,
  },
];

@NgModule({
  declarations: [],
  imports: [
    RouterModule.forChild(routes),
  ],
})
export class ${snakeToCamel(tblName)}RoutingModule { }
`;
  fs.writeFileSync(path.join('dist', 'www', `${snakeToDash(tblName)}-routing.module.ts`  ), moduleTs);
}

/**
 * Service
 */
function generateService(
  schemaName: string,
  tblName: string,
) {
  const serviceTs = `import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Configuration,
  ListFilterRequestDto,
  ${snakeToCamel(tblName)}Dto,
  ${snakeToCamel(tblName)}ListResponseDto,
  ${snakeToCamel(tblName)}Service as Api${snakeToCamel(tblName)}Service,
} from '../api';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ${snakeToCamel(tblName)}Service {
  constructor(
    private httpClient: HttpClient,
    private api${snakeToCamel(tblName)}Service: Api${snakeToCamel(tblName)}Service,
  ) {
    const basePath = environment.apiUrl;
    const conf = new Configuration();
    this.api${snakeToCamel(tblName)}Service = new Api${snakeToCamel(tblName)}Service(this.httpClient, basePath, conf);
  }
  
  public savedFilter: ListFilterRequestDto = {
    filter: [],
    sort: [],
    page_size: 25,
    sort_direction: 'asc',
    page_index: 0,
  };

  public getFilterValue(fieldName: string): string {
    let result = this.savedFilter.filter?.find((item) => item.field === fieldName)?.value;
    if ( !result ) {
      result = '';
    }
    return result;
  }

  public list(body: ListFilterRequestDto): Observable< ${snakeToCamel(tblName)}ListResponseDto > {
    return this.api${snakeToCamel(tblName)}Service.${snakeToCamel(tblName, false)}ControllerList(body);
  }

  public delete(id: number) {
    return this.api${snakeToCamel(tblName)}Service.${snakeToCamel(tblName, false)}ControllerDelete(id);
  }

  public save(body: ${snakeToCamel(tblName)}Dto) {
    return this.api${snakeToCamel(tblName)}Service.${snakeToCamel(tblName, false)}ControllerAdd(body);
  }

  public view(id: number): Observable< ${snakeToCamel(tblName)}Dto> {
    return this.api${snakeToCamel(tblName)}Service.${snakeToCamel(tblName, false)}ControllerGet(id);
  }

  // public getGroups() {
  //   return this.api${snakeToCamel(tblName)}Service.${snakeToCamel(tblName, false)}ControllerGetGroups();
  // }
}`;
  fs.writeFileSync(path.join('dist', 'www', `${snakeToDash(tblName)}.service.ts`  ), serviceTs);
}

/**
 * Datasource for list
 */
function generateDataSource(
  schemaName: string,
  tblName: string,
) {
  const dsTS = `import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { ${snakeToCamel(tblName)}Dto, ListFilterRequestDto } from '../api';
import { ${snakeToCamel(tblName)}Service } from './${snakeToDash(tblName)}.service';

export class ${snakeToCamel(tblName)}Datasource extends DataSource< ${snakeToCamel(tblName)}Dto> {
  private ${snakeToCamel(tblName, false)}Subject = new BehaviorSubject<${snakeToCamel(tblName)}Dto[]>([]);

  private loadingSubject = new BehaviorSubject<boolean>(false);

  public loading$ = this.loadingSubject.asObservable();

  public cntSubject = new BehaviorSubject<number>(0);

  constructor(
    private ${snakeToCamel(tblName, false)}Service: ${snakeToCamel(tblName)}Service,
    private alertService: AlertService,
  ) {
    super();
  }

  load(filter?: ListFilterRequestDto) {
    this.loadingSubject.next(true);
    if (filter) {
      this.${snakeToCamel(tblName, false)}Service.savedFilter = filter;
    }
    this.${snakeToCamel(tblName, false)}Service.list(this.${snakeToCamel(tblName, false)}Service.savedFilter)
      .pipe(
        catchError((err) => {
          this.alertService.clear();
          this.alertService.error(err.error.message);
          return of([]);
        }),
        finalize(() => this.loadingSubject.next(false)),
      )
      .subscribe({
        next: (items) => {
          if ('data' in items) {
            this.cntSubject.next(items.cnt);
            this.${snakeToCamel(tblName, false)}Subject.next(items.data);
          }
        },
      });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars-experimental
  connect(collectionViewer: CollectionViewer): Observable<${snakeToCamel(tblName)}Dto[]> {
    return this.${snakeToCamel(tblName, false)}Subject.asObservable();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars-experimental
  disconnect(collectionViewer: CollectionViewer): void {
    this.${snakeToCamel(tblName, false)}Subject.complete();
    this.loadingSubject.complete();
    this.cntSubject.complete();
  }
}`;
  fs.writeFileSync(path.join('dist', 'www', `${snakeToDash(tblName)}.datasource.ts`  ), dsTS);
}

/**
 * Edit
 */
function generateEditTs(
  schemaName: string,
  tblName: string,
  fieldArray: FieldDefinition[],
) {
  let ts = `import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertService } from '../../shared/alert/alert.service';
import { ${snakeToCamel(tblName)}Dto } from '../../api';
import { ${snakeToCamel(tblName)}Service } from '../${snakeToDash(tblName)}.service';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.scss'],
})
export class EditComponent implements OnDestroy {
  form: FormGroup;
  
  private destroy$ = new Subject<void>();

  item: ${snakeToCamel(tblName)}Dto | undefined;

  constructor(
    private ${snakeToCamel(tblName, false)}Service: ${snakeToCamel(tblName)}Service,
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private alert: AlertService,
  ) {
    this.form = this.fb.group({\n`;
  fieldArray.forEach((item) => {
    ts += `      ${item.field}: [`;
    if (isNumber(item)) {
      ts += '0';
    } else if (isBoolean(item)) {
      ts += 'true';
    } else {
      ts += '\'\'';
    }
    if (item.notNull) { ts += ', Validators.required';}
    ts += '],\n';
  });
  ts += `    });
    this.route.params
      .pipe(
        takeUntil(this.destroy$),
        filter((params) => params.id),
      )
      .subscribe((params) => {
        if (params.id.toString() === '0') { return; }
        this.${snakeToCamel(tblName, false)}Service.view(params.id).subscribe({
          next: (item) => {
            this.item = item;
            this.form.patchValue(item);
          },
        });
      });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  save() {
    if (this.form.invalid) {
      Object.keys(this.form.controls).forEach((field) => {
        const control = this.form.get(field);
        control?.markAsTouched({ onlySelf: true });
      });
      this.alert.error('There is error on form.');
      return;
    }
    this.${snakeToCamel(tblName, false)}Service.save(this.form.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.router.navigate(['/${tblName}/list']).then();
        },
        error: (error) => {
          this.alert.error(error.error.message);
        },
      });
  }

  close() {
    this.router.navigate(['/${tblName}/list']).then();
  }
}
`;
  fs.writeFileSync(path.join('dist', 'www', 'edit', 'edit.component.ts' ), ts);
}

function generateEditScss() {
  const ts = `mat-form-field {
  display: block;
}

mat-card-footer {
  justify-content: flex-end;
}
`;
  fs.writeFileSync(path.join('dist', 'www', 'edit', 'edit.component.scss' ), ts);
}

function generateFormField(item: FieldDefinition): string {
  if (isBoolean(item)) {
    return `
      <mat-form-field class="full-width-input">
        <mat-slide-toggle formControlName="${item.field}">TODO: ${item.description}</mat-slide-toggle>
        <textarea matInput hidden></textarea>
        <mat-error></mat-error>
      </mat-form-field>
    `;
  }
  if (isDate(item)) {
    return `      
      <mat-form-field class="full-width-input">
        <mat-label>TODO: ${item.description}</mat-label>
        <input matInput formControlName="${item.field}" [matDatepicker]="picker${snakeToCamel(item.field)}" placeholder="${datePlaceholder}"/>
        <mat-datepicker-toggle matSuffix [for]="picker${snakeToCamel(item.field)}"></mat-datepicker-toggle>
        <mat-datepicker #picker${snakeToCamel(item.field)}></mat-datepicker>
        <mat-error></mat-error>
      </mat-form-field>`;
  }
  return `
      <mat-form-field class="full-width-input">
        <mat-label>TODO: ${item.description}</mat-label>
        <input matInput formControlName="${item.field}" />
        <mat-error></mat-error>
      </mat-form-field>
    `;
}

function generateEditHtml(
  schemaName: string,
  tblName: string,
  fieldArray: FieldDefinition[],
) {
  let ts = `<mat-card>
  <mat-card-header>
    <h2 *ngIf="item">Edit</h2>
    <h2 *ngIf="!item">Add</h2>
  </mat-card-header>
  <mat-card-content>
    <form [formGroup]="form">\n`;

  fieldArray.forEach((item) => {
    ts += generateFormField(item);
  });

  ts += `
    </form>
  </mat-card-content>

  <mat-card-footer>
    <button mat-button (click)="close()"><mat-icon>close</mat-icon>Close</button>
    <button mat-button (click)="save()"><mat-icon>save</mat-icon>Save</button>
  </mat-card-footer>

</mat-card>
`;
  fs.writeFileSync(path.join('dist', 'www', 'edit', 'edit.component.html' ), ts);
}

/**
 * List
 */
function generateListTs(
  schemaName: string,
  tblName: string,
  fieldArray: FieldDefinition[],
) {
  let ts = `import {
  AfterViewInit, Component, OnInit, ViewChild, OnDestroy
} from '@angular/core';
import { MatSort, SortDirection } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { merge, Subject, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, tap, takeUntil } from 'rxjs/operators';
import { FormBuilder, FormGroup } from '@angular/forms';
import { DeleteDialogComponent } from '../../shared/delete-dialog/delete-dialog.component';
import { AlertService } from '../../shared/alert/alert.service';
import { ${snakeToCamel(tblName)}Service } from '../${snakeToDash(tblName)}.service';
import { ${snakeToCamel(tblName)}Dto, FilterItemDto } from '../../api';
import { ${snakeToCamel(tblName)}Datasource } from '../${snakeToDash(tblName)}.datasource';

/**
 * Server side pagination list based on
 * https://github.com/angular-university/angular-material-course/tree/2-data-table-finished
 * https://blog.angular-university.io/angular-material-data-table/
 */
@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
})
export class ListComponent implements OnInit, AfterViewInit, OnDestroy {
  list: ${snakeToCamel(tblName)}Dto[] = [];
  
  private destroy$ = new Subject<void>();

  // TODO: Remove unnecessary columns, (leave actions)
  displayedColumns = [`;
  fieldArray.forEach((item) => {
    ts += `'${item.field}', `;
  });
  ts += ` 'actions'];

  // @ts-ignore
  public listTable: ${snakeToCamel(tblName)}Datasource;

  @ViewChild(MatSort, { static: false }) sort!: MatSort;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  
  searchForm: FormGroup;

  dataSize: number = 0;
  
  pageSizeOpt: number[] = [25, 50, 100];
  
  public filter: {
    pageSize: number;
    pageIndex: number;
    sortActive: string;
    sortDirection: SortDirection;
  } = {
      pageSize: 25,
      pageIndex: 0,
      sortActive: '',
      sortDirection: 'asc',
    };

  constructor(
    private ${snakeToCamel(tblName, false)}Service: ${snakeToCamel(tblName)}Service,
    private router: Router,
    public dialog: MatDialog,
    private alertService: AlertService,
    private fb: FormBuilder,
  ) {
    this.searchForm = this.fb.group({
      in${capitalize(fieldArray[1].field)}: [this.${snakeToCamel(tblName, false)}Service.getFilterValue('${fieldArray[1].field}')],
    });
  }

  ngOnInit(): void {
    this.listTable = new ${snakeToCamel(tblName)}Datasource(this.${snakeToCamel(tblName, false)}Service, this.alertService);
    this.listTable.cntSubject
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cnt) => {
          this.dataSize = cnt;
          this.pageSizeOpt = [25, 50, cnt]; 
        },
      });
    if (this.${snakeToCamel(tblName, false)}Service.savedFilter) {
      this.filter.pageIndex = this.${snakeToCamel(tblName, false)}Service.savedFilter.page_index;
      this.filter.pageSize = this.${snakeToCamel(tblName, false)}Service.savedFilter.page_size;
      this.filter.sortDirection = this.${snakeToCamel(tblName, false)}Service.savedFilter.sort_direction;
      if (this.${snakeToCamel(tblName, false)}Service.savedFilter.sort) {
        this.filter.sortActive = this.${snakeToCamel(tblName, false)}Service.savedFilter.sort[0];
      }
    }
    this.listTable.load();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  ngAfterViewInit(): void {
    this.sort.sortChange
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (sort) => {
          this.filter.sortDirection = sort.direction;
          this.filter.sortActive = sort.active;
          this.paginator.pageIndex = 0; 
        },
      });
    const arrEvents: Observable<any>[] = [];
    Object.values(this.searchForm.controls).forEach((control) => {
      arrEvents.push(control.valueChanges);
    });
    // fromEvent(this.search${capitalize(fieldArray[1].field)}Input.nativeElement, 'keyup'),
    merge(
      ...arrEvents,
    ).pipe(
      takeUntil(this.destroy$),
      debounceTime(150),
      distinctUntilChanged(),
      tap(() => {
        this.paginator.pageIndex = 0;
        this.load();
      }),
    ).subscribe();

    merge(
      this.sort.sortChange,
      this.paginator.page,
    ).pipe(
      takeUntil(this.destroy$),
      tap(() => this.load()),
    ).subscribe();
  }

  load() {
    // Check if elements are initialized
    if (!this.sort) {
      return;
    }
    const filter: FilterItemDto[] = [];
    Object.keys(this.searchForm.controls).forEach((key) => {
      const control = this.searchForm.get(key);
      const value = control?.value;
      if (value && value !== '')
        filter.push({
          field: key.toLowerCase().substring(2),
          value: value,
        });
    });
    const sort = [];
    if (this.filter.sortActive) {
      sort.push(this.filter.sortActive);
    }

    this.listTable?.load({
      filter,
      sort,
      page_index: this.paginator?.pageIndex,
      page_size: this.paginator?.pageSize,
      sort_direction: this.filter.sortDirection,
    });
  }

  edit(id: number) {
    this.router.navigate([\`/${tblName}/edit/\${id}\`]).then();
  }

  deleteDlg(row: ${snakeToCamel(tblName)}Dto) {
    const dlg = this.dialog.open(DeleteDialogComponent, { data: { title: \`\${row.${fieldArray[1].field}}\` } });
    dlg.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((result) => {
      if (!result) { return; }
      this.${snakeToCamel(tblName, false)}Service.delete(parseInt(row.${fieldArray[0].field})).subscribe({
        next: () => {
          this.alertService.success('Item deleted');
          this.load();
        },
        error: (error) => {
          this.alertService.error(error.error.message);
        },
      });
    });
  }
}
  `;
  fs.writeFileSync(path.join('dist', 'www', 'list', 'list.component.ts' ), ts);
}

function generateListScss() {
  const ts = `table {
  width: 100%;
}

.mat-row .mat-cell {
  border-bottom: 1px solid transparent;
  border-top: 1px solid transparent;
}

.mat-row:hover .mat-cell {
  border-color: currentColor;
}

.column-desc {
  cursor: pointer;
}

.column-dt {
  cursor: pointer;
}

.column-actions {
  width: 120px;
}

.spinner-container {
  height: 360px;
  width: 390px;
  position: fixed;
}

.spinner-container mat-spinner {
  margin: 130px auto 0 auto;
}

.header-item {
  margin-left: 5px;
  margin-right: 5px;
}
`;
  fs.writeFileSync(path.join('dist', 'www', 'list', 'list.component.scss' ), ts);
}

function generateListHtml(
  schemaName: string,
  tblName: string,
  fieldArray: FieldDefinition[],
) {
  let ts = `<mat-card class="mat-elevation-z4">
  <mat-card-content>
    <form [formGroup]="searchForm">
      <div class="flex-container">
      <div>
        List
      </div>
      <div>
        <button mat-raised-button (click)="edit(0)" class="header-item">
          <mat-icon>add</mat-icon>
          Add
        </button>
        <mat-form-field class="header-item">
          <mat-label>Search ${fieldArray[1].field}</mat-label>
          <input matInput placeholder="Search field" formControlName="in${capitalize(fieldArray[1].field)}">
        </mat-form-field>
      </div>
    </div>
    </form>
  </mat-card-content>
</mat-card>

<br/>
<mat-card  class="mat-elevation-z4">
  <mat-card-content>
    <div class="spinner-container" *ngIf="listTable.loading$ | async">
      <mat-spinner></mat-spinner>
    </div>

    <table mat-table matSort [dataSource]="listTable">\n\n`;
  fieldArray.forEach((item) => {
    ts += `      <ng-container matColumnDef="${item.field}">
        <th mat-header-cell mat-sort-header *matHeaderCellDef>
          TODO: ${item.field}
        </th>
        <td
          (click)="edit(item.${fieldArray[0].field})" 
          mat-cell 
          *matCellDef="let item" class="column-dt">
          {{item.${item.field}}}
        </td>
      </ng-container>`;
    ts += '\n\n';
  });

  ts += `      <ng-container matColumnDef="actions" stickyEnd>
        <th mat-header-cell *matHeaderCellDef></th>
        <td mat-cell *matCellDef="let item" class="column-actions">
          <button mat-icon-button (click)="edit(item.${fieldArray[0].field})"><mat-icon>edit</mat-icon></button>
          <button mat-icon-button (click)="deleteDlg(item)"><mat-icon>delete</mat-icon></button>
        </td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>

      <tr
        mat-row
        *matRowDef="let row; columns: displayedColumns;"
        class="table-row"></tr>

    </table>

    <mat-paginator
      [pageSizeOptions]="pageSizeOpt"
      [pageSize]="filter.pageSize"
      [pageIndex]="filter.pageIndex"
      [length]="dataSize"
      showFirstLastButtons
      aria-label="Choose page">
    </mat-paginator>

  </mat-card-content>
</mat-card>
`;
  fs.writeFileSync(path.join('dist', 'www', 'list', 'list.component.html' ), ts);
}

export function generateAngularModule(
  schemaName: string,
  tblName: string,
  fieldArray: FieldDefinition[],
) {
  if (!fs.existsSync(path.join('dist', 'www'))) {
    fs.mkdirSync(path.join('dist', 'www'), { recursive: true });
  }

  generateModule(schemaName, tblName);

  generateRouting(schemaName, tblName);

  generateService(schemaName, tblName);

  generateDataSource(schemaName, tblName);

  if (!fs.existsSync(path.join('dist', 'www', 'edit'))) {
    fs.mkdirSync(path.join('dist', 'www', 'edit'), { recursive: true });
  }
  generateEditTs(schemaName, tblName, fieldArray);

  generateEditScss();

  generateEditHtml(schemaName, tblName, fieldArray);

  if (!fs.existsSync(path.join('dist', 'www', 'list'))) {
    fs.mkdirSync(path.join('dist', 'www', 'list'), { recursive: true });
  }

  generateListScss();

  generateListHtml(schemaName, tblName, fieldArray);

  generateListTs(schemaName, tblName, fieldArray);
}
