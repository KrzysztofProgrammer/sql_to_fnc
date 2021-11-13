# Changelog 
SQL to Function, CRUD generator for NestJS

## Version 0.4.0 _2021-11-14_
* Add to edit HTML generator formfield type recognition for:
  * boolean - mat-slide-toggle
  * date - mat-datepicker, information about placeholder is stored at sql_to_fnc.constans.ts


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
