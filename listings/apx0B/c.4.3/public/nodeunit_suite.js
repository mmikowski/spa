/*
 * nodeunit_suite.js
 * Unit test suite for SPA
 *
 * Please run using /nodeunit <this_file>/
*/

/*jslint         node    : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/
/*global $, spa */

// third-party modules and globals
global.jQuery = require( 'jquery' );
global.TAFFY  = require( './js/jq/taffydb-2.6.2.js' ).taffy;
global.$      = global.jQuery;
require( './js/jq/jquery.event.gevent-0.1.9.js' );

// our modules and globals
global.spa = null;
require( './js/spa.js'       );
require( './js/spa.util.js'  );
require( './js/spa.fake.js'  );
require( './js/spa.data.js'  );
require( './js/spa.model.js' );

// Begin /testAcct/ initialize and login
var testAcct = function ( test ) {
  var $t, test_str, user, on_login,
    $defer = $.Deferred();

  // set expected test count
  test.expect( 1 );

  // define handler for 'spa-login' event
  on_login = function (){ $defer.resolve(); };

  // initialize
  spa.initModule( null );
  spa.model.setDataMode( 'fake' );

  // create a jQuery object and subscribe
  $t = $('<div/>');
  $.gevent.subscribe( $t, 'spa-login', on_login );

  spa.model.people.login( 'Fred' );

  // confirm user is no longer anonymous
  user     = spa.model.people.get_user();
  test_str = 'user is no longer anonymous';
  test.ok( ! user.get_is_anon(), test_str );

  // declare finished once sign-in is complete
  $defer.done( test.done );
};
// End /testAcct/ initial setup and login

module.exports = { testAcct : testAcct };
