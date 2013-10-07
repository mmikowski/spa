/*
 * spa.model.js
 * Model module
*/

/*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/
/*global TAFFY, $, spa */

spa.model = (function () {
  'use strict';
  var
    configMap = { anon_id : 'a0' },
    stateMap  = {
      anon_user      : null,
      cid_serial     : 0,
      is_connected   : false,
      people_cid_map : {},
      people_db      : TAFFY(),
      user           : null
    },

    isFakeData = true,

    personProto, makeCid, clearPeopleDb, completeLogin,
    makePerson, removePerson, people, chat, initModule;

  // The people object API
  // ---------------------
  // The people object is available at spa.model.people.
  // The people object provides methods and events to manage
  // a collection of person objects. Its public methods include:
  //   * get_user() - return the current user person object.
  //     If the current user is not signed-in, an anonymous person
  //     object is returned.
  //   * get_db() - return the TaffyDB database of all the person
  //     objects - including the current user - presorted.
  //   * get_by_cid( <client_id> ) - return a person object with
  //     provided unique id.
  //   * login( <user_name> ) - login as the user with the provided
  //     user name. The current user object is changed to reflect
  //     the new identity. Successful completion of login
  //     publishes a 'spa-login' global custom event.
  //   * logout()- revert the current user object to anonymous.
  //     This method publishes a 'spa-logout' global custom event.
  //
  // jQuery global custom events published by the object include:
  //   * spa-login - This is published when a user login process
  //     completes. The updated user object is provided as data.
  //   * spa-logout - This is published when a logout completes.
  //     The former user object is provided as data.
  //
  // Each person is represented by a person object.
  // Person objects provide the following methods:
  //   * get_is_user() - return true if object is the current user
  //   * get_is_anon() - return true if object is anonymous
  //
  // The attributes for a person object include:
  //   * cid - string client id. This is always defined, and
  //     is only different from the id attribute
  //     if the client data is not synced with the backend.
  //   * id - the unique id. This may be undefined if the
  //     object is not synced with the backend.
  //   * name - the string name of the user.
  //   * css_map - a map of attributes used for avatar
  //     presentation.
  //
  personProto = {
    get_is_user : function () {
      return this.cid === stateMap.user.cid;
    },
    get_is_anon : function () {
      return this.cid === stateMap.anon_user.cid;
    }
  };

  makeCid = function () {
    return 'c' + String( stateMap.cid_serial++ );
  };

  clearPeopleDb = function () {
    var user = stateMap.user;
    stateMap.people_db      = TAFFY();
    stateMap.people_cid_map = {};
    if ( user ) {
      stateMap.people_db.insert( user );
      stateMap.people_cid_map[ user.cid ] = user;
    }
  };

  completeLogin = function ( user_list ) {
    var user_map = user_list[ 0 ];
    delete stateMap.people_cid_map[ user_map.cid ];
    stateMap.user.cid     = user_map._id;
    stateMap.user.id      = user_map._id;
    stateMap.user.css_map = user_map.css_map;
    stateMap.people_cid_map[ user_map._id ] = stateMap.user;

    // When we add chat, we should join here
    $.gevent.publish( 'spa-login', [ stateMap.user ] );
  };

  makePerson = function ( person_map ) {
    var person,
      cid     = person_map.cid,
      css_map = person_map.css_map,
      id      = person_map.id,
      name    = person_map.name;

    if ( cid === undefined || ! name ) {
      throw 'client id and name required';
    }

    person         = Object.create( personProto );
    person.cid     = cid;
    person.name    = name;
    person.css_map = css_map;

    if ( id ) { person.id = id; }

    stateMap.people_cid_map[ cid ] = person;

    stateMap.people_db.insert( person );
    return person;
  };

  removePerson = function ( person ) {
    if ( ! person ) { return false; }
    // cannot remove anonymous person
    if ( person.id === configMap.anon_id ) {
      return false;
    }

    stateMap.people_db({ cid : person.cid }).remove();
    if ( person.cid ) {
      delete stateMap.people_cid_map[ person.cid ];
    }
    return true;
  };

  people = (function () {
    var get_by_cid, get_db, get_user, login, logout;

    get_by_cid = function ( cid ) {
      return stateMap.people_cid_map[ cid ];
    };

    get_db = function () { return stateMap.people_db; };

    get_user = function () { return stateMap.user; };

    login = function ( name ) {
      var sio = isFakeData ? spa.fake.mockSio : spa.data.getSio();

      stateMap.user = makePerson({
        cid     : makeCid(),
        css_map : {top : 25, left : 25, 'background-color':'#8f8'},
        name    : name
      });

      sio.on( 'userupdate', completeLogin );

      sio.emit( 'adduser', {
        cid     : stateMap.user.cid,
        css_map : stateMap.user.css_map,
        name    : stateMap.user.name
      });
    };

    logout = function () {
      var is_removed, user = stateMap.user;
      // when we add chat, we should leave the chatroom here

      is_removed    = removePerson( user );
      stateMap.user = stateMap.anon_user;

      $.gevent.publish( 'spa-logout', [ user ] );
      return is_removed;
    };

    return {
      get_by_cid : get_by_cid,
      get_db     : get_db,
      get_user   : get_user,
      login      : login,
      logout     : logout
    };
  }());

  // The chat object API
  // -------------------
  // The chat object is available at spa.model.chat.
  // The chat object provides methods and events to manage
  // chat messaging. Its public methods include:
  //  * join() - joins the chat room. This routine sets up
  //    the chat protocol with the backend including publishers
  //    for 'spa-listchange' and 'spa-updatechat' global
  //    custom events. If the current user is anonymous,
  //    join() aborts and returns false.
  // ...
  //
  // jQuery global custom events published by the object include:
  // ...
  //  * spa-listchange - This is published when the list of
  //    online people changes in length (i.e. when a person
  //    joins or leaves a chat) or when their contents change
  //    (i.e. when a person's avatar details change).
  //    A subscriber to this event should get the people_db
  //    from the people model for the updated data.
  // ...
  //
  chat = (function () {
    var
      _publish_listchange,
      _update_list, _leave_chat, join_chat;


    // Begin internal methods
    _update_list = function( arg_list ) {
      var i, person_map, make_person_map,
        people_list      = arg_list[ 0 ];

      clearPeopleDb();

      PERSON:
      for ( i = 0; i < people_list.length; i++ ) {
        person_map = people_list[ i ];

        if ( ! person_map.name ) { continue PERSON; }

        // if user defined, update css_map and skip remainder
        if ( stateMap.user && stateMap.user.id === person_map._id ) {
          stateMap.user.css_map = person_map.css_map;
          continue PERSON;
        }

        make_person_map = {
          cid     : person_map._id,
          css_map : person_map.css_map,
          id      : person_map._id,
          name    : person_map.name
        };

        makePerson( make_person_map );
      }

      stateMap.people_db.sort( 'name' );
    };

    _publish_listchange = function ( arg_list ) {
      _update_list( arg_list );
      $.gevent.publish( 'spa-listchange', [ arg_list ] );
    };
    // End internal methods

    _leave_chat = function () {
      var sio = isFakeData ? spa.fake.mockSio : spa.data.getSio();
      stateMap.is_connected = false;
      if ( sio ) { sio.emit( 'leavechat' ); }
    };

    join_chat  = function () {
      var sio;

      if ( stateMap.is_connected ) { return false; }

      if ( stateMap.user.get_is_anon() ) {
        console.warn( 'User must be defined before joining chat');
        return false;
      }

      sio = isFakeData ? spa.fake.mockSio : spa.data.getSio();
      sio.on( 'listchange', _publish_listchange );
      stateMap.is_connected = true;
      return true;
    };

    return {
      _leave : _leave_chat,
      join   : join_chat
    };
  }());

  initModule = function () {
    // initialize anonymous person
    stateMap.anon_user = makePerson({
      cid   : configMap.anon_id,
      id    : configMap.anon_id,
      name  : 'anonymous'
    });
    stateMap.user = stateMap.anon_user;
  };

  return {
    initModule : initModule,
    chat       : chat,
    people     : people
  };
}());
