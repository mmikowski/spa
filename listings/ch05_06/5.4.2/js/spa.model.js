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
      people_cid_map : {},
      people_db      : TAFFY()
    },

    isFakeData = true,

    personProto, makePerson, people, initModule;

  personProto = {
    get_is_user : function () {
      return this.cid === stateMap.user.cid;
    },
    get_is_anon : function () {
      return this.cid === stateMap.anon_user.cid;
    }
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

  people = {
    get_db      : function () { return stateMap.people_db; },
    get_cid_map : function () { return stateMap.people_cid_map; }
  };

  initModule = function () {
    var i, people_list, person_map;

    // initialize anonymous person
    stateMap.anon_user = makePerson({
      cid   : configMap.anon_id,
      id    : configMap.anon_id,
      name  : 'anonymous'
    });
    stateMap.user = stateMap.anon_user;

    if ( isFakeData ) {
      people_list = spa.fake.getPeopleList();
      for ( i = 0; i < people_list.length; i++ ) {
        person_map = people_list[ i ];
        makePerson({
          cid     : person_map._id,
          css_map : person_map.css_map,
          id      : person_map._id,
          name    : person_map.name
        });
      }
    }
  };

  return {
    initModule : initModule,
    people     : people
  };
}());
