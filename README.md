# SQL to Function

Project will create PostgreSQL functions ``_delete``, ``_get``, ``_list``, ``_save`` using DDL CREATE TABLE definition. 
It will also create NestJS ddl definition, service and controller template. 
Of course, this will not meet in 100% yours needs, but will speed up developement.


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
  active             boolean    NOT NULL DEFAULT true,
  login              varchar    NOT NULL,
  password           varchar    NOT NULL
)
```
Main assumptions:
* file should have only table definition
* table name should have schema information. For public: ```CREATE TABLE public.cfg```
* primary key is first element, number type with NEXTVAL() definition
 

## Generation SQL functions

It will create files in dist/sql directory with functions :
* auth.users_delete(id integer)
* auth.users_get(id integer)
* auth.users_list(filter varchar) - filter is not use, prepared for future and manual changes
* auth.users_save(user varchar) - parameter is JSONB object cast on varchar. If id more than zero - will update data, else - will create new record.


## Generation NestJS API

It will generate files:
* dist/api/dto/Users.dto.ts  - with type definition for user
* dist/api/dto/UsersFilter.dto.ts - empty definition for list filter
* dist/api/users.controller.ts - with API endpoints: POST /list, GET :id, POST /, DELETE :id
* dist/api/users.service.ts - with methods covering controller above definitions: list, save, get, delete. All methods call SQL functions.
