/*
 * crud.js - module to provide CRUD db capabilities
*/

/*jslint         node    : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/
/*global */

// ------------ BEGIN MODULE SCOPE VARIABLES --------------
'use strict';
var
  checkType,    constructObj, readObj,
  updateObj,    destroyObj;
// ------------- END MODULE SCOPE VARIABLES ---------------

// ---------------- BEGIN PUBLIC METHODS ------------------
checkType    = function () {};
constructObj = function () {};
readObj      = function () {};
updateObj    = function () {};
destroyObj   = function () {};

module.exports = {
  makeMongoId : null,
  checkType   : checkType,
  construct   : constructObj,
  read        : readObj,
  update      : updateObj,
  destroy     : destroyObj
};
// ----------------- END PUBLIC METHODS -----------------

// ------------- BEGIN MODULE INITIALIZATION --------------
console.log( '** CRUD module loaded **' );
// -------------- END MODULE INITIALIZATION ---------------
