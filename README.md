# SQL to PostgreSQL function, CRUD generator for NestJS

Project will generate PostgreSQL functions ``_delete``, ``_get``, ``_list``, ``_save`` using DDL CREATE TABLE definition. 
It will also create NestJS dto definition, service, controller template and basic E2E tests. 
Of course, this will not meet in 100% yours needs, but will speed up development time.

## Usage
! Important ! Before usage please reconfigure database user inside sql_to_fnc.constants.ts

*Windows usage:*
```
ts-node-script .\sql_to_fnc.ts .\table.example.sql
```

where **table.sql** is file with DDL table definition.


## Generation SQL

Example table.sql definition:
```
CREATE TABLE auth.users
(
  id                 integer    NOT NULL DEFAULT NEXTVAL('users_serial'::regclass),
  login              varchar    NOT NULL,
  active             boolean    NOT NULL DEFAULT true,
  password           varchar    NOT NULL
)
```
Main assumptions:
* file should have only table definition
* table name should have schema information. For public: ```CREATE TABLE public.cfg```
* primary key is first element, number type with NEXTVAL() definition
* second element (in this case - login) will be searchable at list method (inside filter)
 

## Generation SQL functions

It will create files in dist/sql directory with functions :
* auth.users_delete(id integer)
* auth.users_get(id integer)
* auth.users_list(filter varchar) - filter is prepared for Angular Materials Server Side pagination
* auth.users_save(user varchar) - parameter is JSONB object cast on varchar. If id more than zero - will update data, else - will create new record.


## Generation NestJS API

It will generate files:
* dist/api/dto/Users.dto.ts  - with type definition for user
* dist/api/dto/UsersFilter.dto.ts - list filter. Example: ```{"filter": "%", "page_size": 25, "page_index": 1, "sort_direction": "asc"}```
* dist/api/dto/UsersListResponse.dto.ts  - response from list function with table count information and data array - filtered user table
* dist/api/users.controller.ts - with API endpoints: POST /list, GET :id, POST /, DELETE :id
* dist/api/users.service.ts - with methods covering controller above definitions: list, save, get, delete. All methods call SQL functions.

## Generation E2E supertest files

It will generate:
* dist/tests/data/users.data.ts - contain valid user data, invalid user data and filter data. This should be filled by needs.
* dist/tests/users.e2e-spec.ts - contain supertest template with test cases:
   * POST /users/list - with filter data, get first element from list and use it
   * GET /users/{number} - use above data for fetch item
   * POST /users  - save valid data
   * DELETE /users/0 - check wrong data
   * DELETE /users/{number} - delete added above data 
