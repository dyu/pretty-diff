#!/usr/bin/env node

/*
var fs = require( "fs" );
var path = require( "path" );
var os = require( "os" );
var open = require( "open" );
var diff = require( "./diff" );
*/
import fs from 'fs';
import path from 'path';
import os from 'os';
import open from 'open';
import diff from './diff.js'
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

diff( process.argv.slice( 2 ).join( " " ), function( error, parsedDiff ) {
	if ( error ) {

		// Usage error, assume we're not in a git directory
		if ( error.code === 129 ) {
			process.stderr.write( "Error: Not a git repository\n" );
			return;
		}

		process.stderr.write( error.message );
		return;
	}

	if ( !parsedDiff ) {
		console.log( "No differences" );
		return;
	}

	generatePrettyDiff( parsedDiff );
});

function generatePrettyDiff( parsedDiff ) {
	var template = fs.readFileSync( __dirname + "/template.html", "utf8" );
	var diffHtml = "";
	var tempPath = path.join( os.tmpdir(), "diff.html" );

	for ( var file in parsedDiff ) {
		diffHtml +=
			"<h2>" +
				"<div>" +
					"<button class='collapse' onclick=" +
						"'this.closest(\"h2\").nextElementSibling.classList.toggle(\"hidden\")'" +
					">↕</button>" +
					"<span class='title'>" + file + "</span>" +
				"</div>" +
				"<button class='copy' onclick=" +
					"'navigator.clipboard.writeText(\"" + file + "\")'" +
				">copy path</button>" +
			"</h2>" +
			"<div class='file-diff'>" +
				markUpDiff( parsedDiff[ file ] ) +
			"</div>";
	}

	fs.writeFileSync( tempPath, template.replace( "{{diff}}", diffHtml ) );
  if ('linux' === process.platform) {
    spawn('/usr/bin/xdg-open', [ tempPath ]).stderr.pipe(process.stderr)
  } else {
    open( tempPath );
  }
}

var markUpDiff = function() {
	var diffClasses = {
		"d": "file",
		"i": "file",
		"@": "info",
		"-": "delete",
		"+": "insert",
		" ": "context"
	};

	function escape( str ) {
		return str
			.replace( /\$/g, "$$$$" )
			.replace( /&/g, "&amp;" )
			.replace( /</g, "&lt;" )
			.replace( />/g, "&gt;" )
			.replace( /\t/g, "    " );
	}

	return function( diff ) {
		return diff.map(function( line ) {
			var type = line.charAt( 0 );
			return "<pre class='" + diffClasses[ type ] + "'>" + escape( line ) + "</pre>";
		}).join( "\n" );
	};
}();
