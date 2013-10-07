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

var
  // utility and handlers
  makePeopleStr, onLogin, onListchange,
  onSetchatee,  onUpdatechat,

  // test functions
  testInitialState,    loginAsFred,    testUserAndPeople,
  testWilmaMsg,        sendPebblesMsg, testMsgToPebbles,
  testPebblesResponse,

  // event handlers
  loginEvent, changeEvent, chateeEvent, msgEvent,
  loginData, changeData, msgData, chateeData,

  // indexes
  changeIdx = 0, chateeIdx = 0, msgIdx = 0,

  // deferred objects
  $deferLogin      = $.Deferred(),
  $deferChangeList = [ $.Deferred() ],
  $deferChateeList = [ $.Deferred() ],
  $deferMsgList    = [ $.Deferred() ];

// utility to make a string of online person names
makePeopleStr = function ( people_db ) {
  var people_list = [];
  people_db().each(function( person, idx ) {
    people_list.push( person.name );
  });
  return people_list.sort().join( ',' );
};

// event handler for 'spa-login'
onLogin = function ( event, arg ) {
  loginEvent = event;
  loginData  = arg;
  $deferLogin.resolve();
};

// event handler for 'spa-listchange'
onListchange = function ( event, arg ) {
  changeEvent = event;
  changeData  = arg;
  $deferChangeList[ changeIdx ].resolve();
  changeIdx++;
  $deferChangeList[ changeIdx ] = $.Deferred();
};

// event handler for 'spa-updatechat'
onUpdatechat = function ( event, arg ) {
  msgEvent = event;
  msgData  = arg;
  $deferMsgList[ msgIdx ].resolve();
  msgIdx++;
  $deferMsgList[ msgIdx ] = $.Deferred();
};

// event handler for 'spa-setchatee'
onSetchatee = function ( event, arg ) {
  chateeEvent = event;
  chateeData  = arg;
  $deferChateeList[ chateeIdx ].resolve();
  chateeIdx++;
  $deferChateeList[ chateeIdx ] = $.Deferred();
};

// Begin /testInitialState/
testInitialState = function ( test ) {
  var $t, user, people_db, people_str, test_str;
  test.expect( 2 );

  // initialize our SPA
  spa.initModule( null );
  spa.model.setDataMode( 'fake' );

  // create a jQuery object
  $t = $('<div/>');

  // subscribe functions to global custom events
  $.gevent.subscribe( $t, 'spa-login',      onLogin      );
  $.gevent.subscribe( $t, 'spa-listchange', onListchange );
  $.gevent.subscribe( $t, 'spa-setchatee',  onSetchatee  );
  $.gevent.subscribe( $t, 'spa-updatechat', onUpdatechat );

  // test the user in the initial state
  user     = spa.model.people.get_user();
  test_str = 'user is anonymous';
  test.ok( user.get_is_anon(), test_str );

  // test the list of online persons
  test_str = 'expected user only contains anonymous';
  people_db  = spa.model.people.get_db();
  people_str = makePeopleStr( people_db );
  test.ok( people_str === 'anonymous', test_str );

  // proceed to next test without blocking
  test.done();
};
// End /testInitialState/

// Begin /loginAsFred/
loginAsFred = function ( test ) {
  var user, people_db, people_str, test_str;
  test.expect( 6 );

  // login as 'Fred'
  spa.model.people.login( 'Fred' );
  test_str = 'log in as Fred';
  test.ok( true, test_str );

  // test user attributes before login completes
  user     = spa.model.people.get_user();
  test_str = 'user is no longer anonymous';
  test.ok( ! user.get_is_anon(), test_str );

  test_str = 'usr name is "Fred"';
  test.ok( user.name === 'Fred', test_str );

  test_str = 'user id is undefined as login is incomplete';
  test.ok( ! user.id, test_str );

  test_str = 'user cid is c0';
  test.ok( user.cid === 'c0', test_str );

  test_str   = 'user list is as expected';
  people_db  = spa.model.people.get_db();
  people_str = makePeopleStr( people_db );
  test.ok( people_str === 'Fred,anonymous', test_str );

  // proceed to next test when both conditions are met:
  //   + login is complete (spa-login event)
  //   + the list of online persons has been updated
  //     (spa-listchange event)
  $.when( $deferLogin, $deferChangeList[ 0 ] )
    .then( test.done );
};
// End /loginAsFred/

// Begin /testUserAndPeople/
testUserAndPeople = function ( test ) {
  var
    user, cloned_user,
    people_db, people_str,
    user_str, test_str;
  test.expect( 4 );

  // test user attributes
  test_str = 'login as Fred complete';
  test.ok( true, test_str );

  user        = spa.model.people.get_user();
  test_str    = 'Fred has expected attributes';
  cloned_user = $.extend( true, {}, user );

  delete cloned_user.___id;
  delete cloned_user.___s;
  delete cloned_user.get_is_anon;
  delete cloned_user.get_is_user;

  test.deepEqual(
    cloned_user,
    { cid     : 'id_5',
      css_map : { top: 25, left: 25, 'background-color': '#8f8' },
      id      : 'id_5',
      name    : 'Fred'
    },
    test_str
  );

  // test the list of online persons
  test_str = 'receipt of listchange complete';
  test.ok( true, test_str );

  people_db  = spa.model.people.get_db();
  people_str = makePeopleStr( people_db );
  user_str = 'Betty,Fred,Mike,Pebbles,Wilma';
  test_str = 'user list provided is expected - ' + user_str;

  test.ok( people_str === user_str, test_str );

  // proceed to next test when both conditions are met:
  //   + first message has been received (spa-updatechat event)
  //     (this is the example message from 'Wilma')
  //   + chatee change has occurred (spa-setchatee event)
  $.when($deferMsgList[ 0 ], $deferChateeList[ 0 ] )
    .then( test.done );
};
// End /testUserAndPeople/

// Begin /testWilmaMsg/
testWilmaMsg = function ( test ) {
  var test_str;
  test.expect( 4 );

  // test message received from 'Wilma'
  test_str = 'Message is as expected';
  test.deepEqual(
    msgData,
    { dest_id: 'id_5',
      dest_name: 'Fred',
      sender_id: 'id_04',
      msg_text: 'Hi there Fred!  Wilma here.'
    },
    test_str
  );

  // test chatee attributes
  test.ok( chateeData.new_chatee.cid  === 'id_04' );
  test.ok( chateeData.new_chatee.id   === 'id_04' );
  test.ok( chateeData.new_chatee.name === 'Wilma' );

  // proceed to next test without blocking
  test.done();
};
// End /testWilmaMsg/

// Begin /sendPebblesMsg/
sendPebblesMsg = function ( test ) {
  var test_str, chatee;
  test.expect( 1 );

  // set_chatee to 'Pebbles'
  spa.model.chat.set_chatee( 'id_03' );

  // send_msg to 'Pebbles'
  spa.model.chat.send_msg( 'whats up, tricks?' );

  // test get_chatee() results
  chatee = spa.model.chat.get_chatee();
  test_str = 'Chatee is as expected';
  test.ok( chatee.name === 'Pebbles', test_str );

  // proceed to next test when both conditions are met:
  //   + chatee has been set (spa-setchatee event)
  //   + message has been sent (spa-updatechat event)
  $.when( $deferMsgList[ 1 ], $deferChateeList[ 1] )
    .then( test.done );
};
// End /sendPebblesMsg/

// Begin /testMsgToPebbles/
testMsgToPebbles = function ( test ) {
  var test_str;
  test.expect( 2 );

  // test the chatee attributes
  test_str = 'Pebbles is the chatee name';
  test.ok(
    chateeData.new_chatee.name === 'Pebbles',
    test_str
  );

  // test the message sent
  test_str = 'message change is as expected';
  test.ok( msgData.msg_text === 'whats up, tricks?', test_str );

  // proceed to the next test when
  //   + A response has been received from 'Pebbles'
  //    (spa-updatechat event)
  $deferMsgList[ 2 ].done( test.done );
};
// End /testMsgToPebbles/

// Begin /testPebblesResponse/
testPebblesResponse = function ( test ) {
  var test_str;
  test.expect( 1 );

  // test the message received from 'Pebbles'
  test_str = 'Message is as expected';
  test.deepEqual(
    msgData,
    { dest_id: 'id_5',
      dest_name: 'Fred',
      sender_id: 'id_03',
      msg_text: 'Thanks for the note, Fred'
    },
    test_str
  );

  // proceed to next test without blocking
  test.done();
};
// End /testPebblesResponse/

module.exports = {
  testInitialState     : testInitialState,
  loginAsFred          : loginAsFred,
  testUserAndPeople    : testUserAndPeople,
  testWilmaMsg         : testWilmaMsg,
  sendPebblesMsg       : sendPebblesMsg,
  testMsgToPebbles     : testMsgToPebbles,
  testPebblesResponse  : testPebblesResponse
};
// End of test suite
