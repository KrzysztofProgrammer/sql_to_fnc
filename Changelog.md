# Changelog 
SQL to Function, CRUD generator for NestJS

## Version 0.7.4 _2024-07-06_
* Move sql_to_fnc.constans.ts into .env file for better understanding configuration 
* Support null page_size in list method it will give all records
* Nice handle exception in SQL list method if filter is not in JSON format
* Added ErrorResponse DTO

## Version 0.7.3 _2022-10-18_
* Filter on list page will be remembered
* Pagination have on last position length value of table
* Prepare to create more than one filter on list page
* SQL Fix - list will return count of filtered query 
* WWW Fix - remove memory leak. RxJS unsubscribe.

## Version 0.7.1 _2022-08-22_
* Library upgrade causes small fix - missing type definition
* Add linux run in package.json
* Move out getting authorization token from specified tests to common test utils directory
* Handle error during deletion. If not possible - will return code 403 and information "Cannot delete item" 

## Version 0.7.0 _2022-08-18_
* Fix: Upgrade JEST from 26.X to 28.X introduce breaking changes - need some code change

## Version 0.6.0 _2022-06-01_
* Add: Support for snake case table name like CREATE TABLE invoice_items ...
* Add: Support for RxJS subscribe arguments object notation (deprecation warning from RxJS 6.4)

## Version 0.5.1 _2022-02-20_
* Fix: API - delete and save add information about HTML 404 NOT_FOUND response code
* Fix: SQL - check if updated item exist, response with 404 error code

## Version 0.5.0 _2022-01-15_
* Add: edit HTML - validation check on save
* Add: list HTML - clickable row for edit action
* Add: Model NestJS IsOptional()

## Version 0.4.0 _2021-11-14_
* Add: edit HTML - generator formfield type recognition for:
  * boolean - mat-slide-toggle
  * date - mat-datepicker, information about placeholder is stored at sql_to_fnc.constans.ts
* Add COMMENT ON COLUMN parser - use as description at model and add labels on HTML

## Version 0.3.0 _2021-09-12_
* NestJS API directory change - create global dto definition dir and module dir
* Add: filter for list can use more than one field for search
* Add: filter for list can sort by more than one column
* Unification http code 200 to HttpStatus.OK
* Code refactoring - use functions to split big code page, common.ts with global functions
* Fix: edit.component.html - user variable instead of item

## Version 0.2.0 _2021-09-05_

* Fix: filter DTO
* Add: CRUD generator of Angular Module based on Angular Material

## Version 0.1.0 _2021-09-05_

* Add filter implementation for list method

## Version 0.0.2
* Publish with SQL function generator, NestJS CRUD API generator, basic E2E tests generator
