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
  chatObj,
  socket = require( 'socket.io' ),
  crud   = require( './crud'    );
// ------------- END MODULE SCOPE VARIABLES ---------------

// ---------------- BEGIN PUBLIC METHODS ------------------
chatObj = {
  connect : function ( server ) {
    var io = socket.listen( server );

    // Begin io setup
    io
      .set( 'blacklist' , [] )
      .of( '/chat' )
      .on( 'connection', function ( socket ) {
        socket.on( 'adduser',      function () {} );
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
