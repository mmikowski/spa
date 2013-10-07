/*jslint devel: true, regexp: true, node: true, sloppy: true, vars: true,
    continue: true, white: true, newcap: true, plusplus: true,
    indent: 2, maxerr: 50
*/

var
  fsModule     = require( 'fs'  ),
  jsvEngine    = require( 'JSV' ).JSV,
  fileDataMap  = {},
  isLoaded     = false,
  regex_suri   = /^[^#]+#\//,
  resolvePath,
  runValidate,
  watchRead,
  processFile
  ;

resolvePath = function ( arg_map, arg_path_list ) {
  var key;
  while ( true ) {
    key = arg_path_list.shift();
    if ( key === undefined ){ break; }

    if ( ! arg_map.hasOwnProperty( key ) ){ throw null; }
    arg_map = arg_map[ key ];
  }
  return arg_map;
};

runValidate = function () {
  var
    i, schema_path_list, instance_path_list,
    instance_map = fileDataMap.instance_map,
    schema_file  = fileDataMap.schema_map,
    env          = jsvEngine.createEnvironment(),
    
    report       = env.validate( instance_map, schema_file ),
    report_list  = []
    ;

  console.log('Begin validation');
  console.log(report);
  for ( i = 0; i < report.errors.length; i ++ ){
    schema_path_list = report.errors[i].schemaUri
      .replace( regex_suri, '')
      .split('/');
    schema_path_list.push('help_msg');

    instance_path_list = report.errors[i].uri
      .replace( regex_suri, '')
      .split('/');

    // report_list.push(JSON.stringify(report.errors[i]));
    report_list.push(
      instance_path_list.join('.')
      + ' : ( value of "'
      + String(resolvePath(
          fileDataMap.instance_map,
          instance_path_list
        ))
      + ' "):\n'
      + schema_path_list.join('.')
      + ' : '
      + resolvePath(
          fileDataMap.schema_map,
          schema_path_list
        )
    );
  }

  if ( report_list.length === 0 ){
    console.log('pass ...');
  }
  else {
    console.warn( 'fail:...' );
    console.warn( report_list.join('\n'));
  }
  console.log('End validation');
};

watchRead = function () {
  if ( fileDataMap.instance_map && fileDataMap.schema_map ){
    isLoaded = true;
    console.log('Load complete');
    runValidate();
  }
  else {
    setTimeout( watchRead,200 );
    console.log('Loading...');
  }
  return isLoaded;
};

processFile = function ( error, data, s_key ) {
  if ( error ) { throw( error ); }
  fileDataMap[ s_key ] = JSON.parse( data );
};

fsModule.readFile(
  'data/sample.schema.json',
  'utf8',
  function ( error, data ){ processFile( error, data, 'schema_map'); }
);

fsModule.readFile(
  'data/sample.instance.json',
  'utf8',
  function ( error, data ){ processFile( error, data, 'instance_map'); }
);

if ( ! isLoaded ) { watchRead(); }

