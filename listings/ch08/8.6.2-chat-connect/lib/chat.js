/*
 * chat.js - module to provide chat messaging
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
  emitUserList, signIn, chatObj,
  socket = require( 'socket.io' ),
  crud   = require( './crud'    ),

  makeMongoId = crud.makeMongoId,
  chatterMap  = {};
// ------------- END MODULE SCOPE VARIABLES ---------------

// ---------------- BEGIN UTILITY METHODS -----------------
// emitUserList - broadcast user list to all connected clients
//
emitUserList = function ( io ) {
  crud.read(
    'user',
    { is_online : true },
    {},
    function ( result_list ) {
      io
        .of( '/chat' )
        .emit( 'listchange', result_list );
    }
  );
};

// signIn - update is_online property and chatterMap
//
signIn = function ( io, user_map, socket ) {
  crud.update(
    'user',
    { '_id'     : user_map._id },
    { is_online : true         },
    function ( result_map ) {
      emitUserList( io );
      user_map.is_online = true;
      socket.emit( 'userupdate', user_map );
    }
  );

  chatterMap[ user_map._id ] = socket;
  socket.user_id = user_map._id;
};
// ----------------- END UTILITY METHODS ------------------

// ---------------- BEGIN PUBLIC METHODS ------------------
chatObj = {
  connect : function ( server ) {
    var io = socket.listen( server );

    // Begin io setup
    io
      .set( 'blacklist' , [] )
      .of( '/chat' )
      .on( 'connection', function ( socket ) {

        // Begin /adduser/ message handler
        // Summary   : Provides sign in capability.
        // Arguments : A single user_map object.
        //   user_map should have the following properties:
        //     name    = the name of the user
        //     cid     = the client id
        // Action    :
        //   If a user with the provided username already exists
        //     in Mongo, use the existing user object and ignore
        //     other input.
        //   If a user with the provided username does not exist
        //     in Mongo, create one and use it.
        //   Send a 'userupdate' message to the sender so that
        //     a login cycle can complete.  Ensure the client id
        //     is passed back so the client can correlate the user,
        //     but do not store it in MongoDB.
        //   Mark the user as online and send the updated online
        //     user list to all clients, including the client that
        //     originated the 'adduser' message.
        //
        socket.on( 'adduser', function ( user_map ) {
          crud.read(
            'user',
            { name : user_map.name },
            {},
            function ( result_list ) {
              var 
                result_map,
                cid = user_map.cid;

              delete user_map.cid;

              // use existing user with provided name
              if ( result_list.length > 0 ) {
                result_map     = result_list[ 0 ];
                result_map.cid = cid;
                signIn( io, result_map, socket );
              }

              // create user with new name
              else {
                user_map.is_online = true;
                crud.construct(
                  'user',
                  user_map,
                  function ( result_list ) {
                    result_map     = result_list[ 0 ];
                    result_map.cid = cid;
                    chatterMap[ result_map._id ] = socket;
                    socket.user_id = result_map._id;
                    socket.emit( 'userupdate', result_map );
                    emitUserList( io );
                  }
                );
              }
            }
          );
        });
        // End /adduser/ message handler

        socket.on( 'updatechat',   function () {} );
        socket.on( 'leavechat',    function () {} );
        socket.on( 'disconnect',   function () {} );
        socket.on( 'updateavatar', function () {} );
      }
    );
    // End io setup

    return io;
  }
};

module.exports = chatObj;
// ----------------- END PUBLIC METHODS -------------------
