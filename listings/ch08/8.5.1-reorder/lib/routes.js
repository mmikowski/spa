/*
 * routes.js - module to provide routing
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
  loadSchema, checkSchema, configRoutes,
  mongodb     = require( 'mongodb' ),
  fsHandle    = require( 'fs'      ),
  JSV         = require( 'JSV'     ).JSV,
  crud        = require( './crud'  ),

  mongoServer = new mongodb.Server(
    'localhost',
    mongodb.Connection.DEFAULT_PORT
  ),
  dbHandle    = new mongodb.Db(
    'spa', mongoServer, { safe : true }
  ),
  validator   = JSV.createEnvironment(),

  makeMongoId = mongodb.ObjectID,
  objTypeMap  = { 'user': {} };
// ------------- END MODULE SCOPE VARIABLES ---------------

// --------------- BEGIN UTILITY METHODS ------------------
loadSchema = function ( schema_name, schema_path ) {
  fsHandle.readFile( schema_path, 'utf8', function ( err, data ) {
    objTypeMap[ schema_name ] = JSON.parse( data );
  });
};

checkSchema = function ( obj_type, obj_map, callback ) {
  var
    schema_map = objTypeMap[ obj_type ],
    report_map = validator.validate( obj_map, schema_map );

  callback( report_map.errors );
};
// ---------------- END UTILITY METHODS -------------------

// ---------------- BEGIN PUBLIC METHODS ------------------
configRoutes = function ( app, server ) {
  app.get( '/', function ( request, response ) {
    response.redirect( '/spa.html' );
  });

  app.all( '/:obj_type/*?', function ( request, response, next ) {
    response.contentType( 'json' );

    if ( objTypeMap[ request.params.obj_type ] ) {
      next();
    }
    else {
      response.send({ error_msg : request.params.obj_type
        + ' is not a valid object type'
      });
    }
  });

  app.get( '/:obj_type/list', function ( request, response ) {
    dbHandle.collection(
      request.params.obj_type,
      function ( outer_error, collection ) {
        collection.find().toArray(
          function ( inner_error, map_list ) {
            response.send( map_list );
          }
        );
      }
    );
  });

  app.post( '/:obj_type/create', function ( request, response ) {
    var
      obj_type = request.params.obj_type,
      obj_map  = request.body;

    checkSchema(
      obj_type, obj_map,
      function ( error_list ) {
        if ( error_list.length === 0 ) {
          dbHandle.collection(
            obj_type,
            function ( outer_error, collection ) {
              var options_map = { safe: true };

              collection.insert(
                obj_map,
                options_map,
                function ( inner_error, result_map ) {
                  response.send( result_map );
                }
              );
            }
          );
        }
        else {
          response.send({
            error_msg  : 'Input document not valid',
            error_list : error_list
          });
        }
      }
    );
  });

  app.get( '/:obj_type/read/:id', function ( request, response ) {
    var find_map = { _id: makeMongoId( request.params.id ) };
    dbHandle.collection(
      request.params.obj_type,
      function ( outer_error, collection ) {
        collection.findOne(
          find_map,
          function ( inner_error, result_map ) {
            response.send( result_map );
          }
        );
      }
    );
  });

  app.post( '/:obj_type/update/:id', function ( request, response ) {
    var
      find_map = { _id: makeMongoId( request.params.id ) },
      obj_map  = request.body,
      obj_type = request.params.obj_type;

    checkSchema(
      obj_type, obj_map,
      function ( error_list ) {
        if ( error_list.length === 0 ) {
          dbHandle.collection(
            obj_type,
            function ( outer_error, collection ) {
              var
                sort_order = [],
                options_map = {
                  'new' : true, upsert: false, safe: true
                };

              collection.findAndModify(
                find_map,
                sort_order,
                obj_map,
                options_map,
                function ( inner_error, updated_map ) {
                  response.send( updated_map );
                }
              );
            }
          );
        }
        else {
          response.send({
            error_msg  : 'Input document not valid',
            error_list : error_list
          });
        }
      }
    );
  });

  app.get( '/:obj_type/delete/:id', function ( request, response ) {
    var find_map = { _id: makeMongoId( request.params.id ) };

    dbHandle.collection(
      request.params.obj_type,
      function ( outer_error, collection ) {
        var options_map = { safe: true, single: true };

        collection.remove(
          find_map,
          options_map,
          function ( inner_error, delete_count ) {
            response.send({ delete_count: delete_count });
          }
        );
      }
    );
  });
};

module.exports = { configRoutes : configRoutes };
// ----------------- END PUBLIC METHODS -------------------

// ------------- BEGIN MODULE INITIALIZATION --------------
dbHandle.open( function () {
  console.log( '** Connected to MongoDB **' );
});

// load schemas into memory (objTypeMap)
(function () {
  var schema_name, schema_path;
  for ( schema_name in objTypeMap ) {
    if ( objTypeMap.hasOwnProperty( schema_name ) ) {
      schema_path = __dirname + '/' + schema_name + '.json';
      loadSchema( schema_name, schema_path );
    }
  }
}());
// -------------- END MODULE INITIALIZATION ---------------
