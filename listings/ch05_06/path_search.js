/** Path search example solution
 *  See http://eloquentjavascript.net/chapter7.html
 *
 *  Provided road lengths and points on a map, uses hueristics
 *  to find the shortest path.
 *
 *  Provide to city codes to findPathList along with the
 *  code list ( a list of codes for each city)
 *  and road map (road distance keyed by dest1-dest2 code)
 *
*/


/*jslint devel: true, regexp: true, node: true, sloppy: true, vars: true,
    continue: true, white: true, newcap: true, plusplus: true,
    indent: 2, maxerr: 50
*/

var
  siteTable,
  roadTable, roadMap,
  codeList,  codeNameMap,
  pathList,  pathDb,

  createListFromTable,
  makeRoadMap,
  makeCloneMap,
  idx,
  findPathList,
  presentPathList
  ;

createListFromTable = function ( arg_table ) {
  var x, y, title_list ,row_map, output_list;

  title_list  = arg_table[0];
  output_list = [];

  for ( x = 1; x < arg_table.length; x++ ){
    row_map = {};
    for ( y = 0; y < title_list.length; y++ ){
      row_map[title_list[y]] = arg_table[x][y];
    }
    output_list.push(row_map);
  }
  return output_list;
};

makeRoadMap = function ( road_table ){
  var road_map, code, rcode, bit_list, x;

  road_map = {};
  for ( x = 0; x < road_table.length; x++ ){
    code = road_table[x][0];
    bit_list = code.split('-');
    bit_list.reverse();
    rcode = bit_list.join('-');

    // code and reverse code point to same data container
    road_map[code]  = road_table[x][1];
    road_map[rcode] = road_map[code];
  }
  return road_map;
};

makeCloneMap = function ( start_map, add_map ){
  var key, val, map, r_map, x;

  r_map = {};
  for ( x = 0; x < 2; x++ ){
    map = x === 0 ? start_map : add_map;
    for ( key in map ){
      if ( map.hasOwnProperty(key) ){
        r_map[key] = map[key];
      }
    }
  }
  return r_map;
};

// Logic break down:
// We seed a banch_list with a single candidate path.
// The candidate path has a distance of 0, a path list starting
//  with our code_1 argument, and a seen_map which we use to avoid
//  circular paths.
//
// We then consider candidate in a branch_list and start building
// a the next level branch list for the next iteration.
// For each candidate path, we create add to the new branch list 
// new candidate paths for all valid roads.  We find these roads
// by looping though all destinations and seeing if a road from the
// current candidate position (the last element in the currenct
// candidates path list) exists.  We do this by taking the current
// position code, e.g. 'at', and joining it with a proposed postion,
// e.g. 'pt', and then seeing if the resulting code ('at-pt') exists
// in the road_map.  Notice the road_map has two names for each road
// e.g. the corresponding name for 'at-pt' is 'pt-at'.
//
// For each valid destination, we add the distance of the road to the
//  get total distance in the new candidate paths.  Then we consider:
//  * is the position the destination?  If so, we stuff the results
//    into a found path list and continue.
//  * have we seen this desination before in the candidate path?
//    if so, this is a circular path and we drop the candidate.
//  * Otherwise, add this to the new candidates list
//
// Exit condition
// The looping over candidate lists continue until one of the critera
// is met:
//    1. The loop has exceeded a hard limit, e.g. 20 iterations.
//    2. There are no more candidate destination to be found,
//       e.g. the new candidate branch list is empty
//    3. We have found at least 1 solution within the last n
//       iterations, e.g. if we found a solution n iterations ago,
//       regardless if we found any more, we will stop searching.
//       (at writing this limit was 2)
//
//  These number are HEUERISTICS.  A few bits that can be used to prune
//  the tree search more:
//    1. We have x and y coordinates for destinations.  We might
//       favor intermediate directions that are in the right direction.
//    2. We might calculate straight line distance and throw out
//       any candidate whos current distance exceeds this amount by some 
//       multiple, say 1.5x. 
//       If the search failed to find the destination, the algo could be
//       repeated with the number backed-off to 2x, and later to 3x if needed.
//    3. Stop if an iteration results in the total number of solutions
//       exceeding some number.



findPathList = function( code_1, code_2, code_list, road_map ){
  var
    branch_list, z, i, j,
    start_code, dest_code, match_code,
    branch_map, do_seek,
    found_path_list,
    new_branch_list,
    new_branch_map,
    past_found_count,
    had_any_match, new_path_list,
    add_seen_map,
    map_shortest_path
    ;

  found_path_list = [];

  branch_list = [{
    distance  : 0,
    path_list : [ code_1 ],
    seen_map  : {}
  }];

  branch_list[0].seen_map[code_1] = true;

  // loop limited to 20 levels for sanity sake
  // e.g. no path will exceed 20 turns
  HUNT:
  for ( z = 0; z < 20 ; z++ ){

    new_branch_list = [];
    SEEK:
    for ( i = 0; i < branch_list.length; i++ ){
      branch_map = branch_list[i];
      // get last code in path
      start_code = branch_map.path_list.slice(-1)[0];

      FIND:
      for ( j = 0; j < code_list.length; j++ ){
        dest_code  = code_list[j];
        if ( branch_map.seen_map[dest_code] ){ continue FIND; }
        match_code = start_code + '-' + dest_code;
        if ( ! road_map.hasOwnProperty(match_code) ){ continue FIND; }
        new_path_list  = branch_map.path_list.slice(0);
        new_path_list.push(dest_code);

        add_seen_map = {};
        add_seen_map[dest_code] = true;

        new_branch_map = { 
          distance  : branch_map.distance + road_map[ match_code ],
          path_list : new_path_list,
          seen_map  :
            makeCloneMap(branch_map.seen_map, add_seen_map )
        };

        if ( dest_code === code_2 ){
          had_any_match = true;
          found_path_list.push(new_branch_map);
        }
        else {
          new_branch_list.push(new_branch_map);
        }
      }

      // count levels past initial find
      if ( had_any_match ){ past_found_count++; }

      // stop hunting if no paths left, or
      // if we found at least 1 match more than
      // 2 levels ago.
      if ( new_branch_list.length === 0
        || past_found_count > 2
      ){ break HUNT; }
      // otherwise iterate over our newly created path list
      else { branch_list = new_branch_list; }
    }
  }

  // and here we go
  found_path_list.sort(function (row_a_map, row_b_map){
    return row_a_map.distance - row_b_map.distance;
  });

  return found_path_list;
};

presentPathList = function ( path_list, code_name_map ){
  var z, x, row_map, indent_text, code, loc_name;
  for (z = 0; z < path_list.length; z++ ){
    row_map = path_list[z];
    console.log('Proposed path #' + z + ':');
    console.log('Distance : ' + row_map.distance );
    indent_text = '  > ';
    // console.warn(row_map.path_list);
    for ( x = 0; x < row_map.path_list.length; x++ ){
      code = row_map.path_list[x];
      loc_name = code_name_map[code];
      console.log( indent_text + loc_name );
      indent_text = '  ' + indent_text;
    }
  }
};

siteTable = [
  [ 'code', 'name',         'x',    'y' ],
  [ 'ar',   'Airport',     20.0,    0.5 ],
  [ 'at',   'Atuana',      18.0,   -4.0 ],
  [ 'ce',   'Cemetary',    31.0,    0.0 ],
  [ 'hi',   'Hanaiapa',    23.5,    6.0 ],
  [ 'ho',   'Hanapaoa',    31.5,   -3.0 ],
  [ 'hp',   'Hanakee PL',  19.0,   -3.8 ],
  [ 'mf',   'Mt Feani',    15.0,    0.2 ],
  [ 'mo',   'Mt Ootua',    31.2,    0.0 ],
  [ 'mt',   'Mt Temetiu',  13.0,   -5.0 ],
  [ 'pk',   'Pt Kuikui',    0.0,    0.0 ],
  [ 'pt',   'Pt Teoho...', 58.0,    1.0 ],
  [ 'pu',   'Puamau',      44.0,    1.0 ],
  [ 'ta',   'Taaoa',       15.0,   -7.5 ]
];

roadTable = [
  [ 'ar-at',  4.0 ],
  [ 'ar-hi',  6.0 ],
  [ 'ar-mf',  5.0 ],
  [ 'ar-mo', 11.0 ],
  [ 'at-hp',  1.0 ],
  [ 'at-ta',  3.0 ], 
  [ 'ce-hp',  6.0 ],
  [ 'ce-mo',  5.0 ],
  [ 'hi-pk', 19.0 ],
  [ 'ho-mo',  3.0 ],
  [ 'mf-pk', 15.0 ],
  [ 'mf-mt',  8.0 ],
  [ 'mo-pu', 13.0 ],
  [ 'mt-ta',  4.0 ],
  [ 'pk-ta', 15.0 ],
  [ 'pt-pu', 14.0 ]
];


// create list of city codes
codeList    = [];
codeNameMap = {};
for ( idx = 1; idx < siteTable.length; idx++ ){
  codeList.push(siteTable[idx][0]);
  codeNameMap[siteTable[idx][0]] = siteTable[idx][1];
}

// create map of all roads with reverse mapping.
// for example, the resulting map will have an entry for mt-ta
// and ta-ma.  They will point to the same value - the distance
// of the road.
roadMap = makeRoadMap( roadTable );

// This is a test run.  Enter any two location codes from 
// above to get a list of destinations
pathList  = findPathList('mt','ho', codeList, roadMap );

// Here is the presentation.
presentPathList( pathList, codeNameMap );

