#!/usr/bin/env node

'use strict';

var cliArgs = require("command-line-args");
var parse5 = require('parse5');
var css = require('css');
var fs = require('fs');

var cli = cliArgs([
  {
    name: "input",
    type: String,
    alias: "i",
    defaultOption: true,
    multiple: true,
    description: (
      "Polymer source html files."
    )
  },
]);

var options = cli.parse();

function loadFile(filePath, deferred, secondPath) {
  fs.readFile(filePath, 'utf-8', function(err, content) {
    if (err) {
      if (secondPath) {
        getFile(secondPath, deferred);
      } else {
        console.log("ERROR finding " + filePath);
        deferred.reject(err);
      }
    } else {
      deferred.resolve(content);
    }
  });
}

function walk(node, predicate) {
  predicate(node);

  if (node.childNodes) {
    node.childNodes.forEach((child) => { walk(child, predicate); });
  }

  if (node.nodeName == 'template') {
    node.content.childNodes.forEach((child) => { walk(child, predicate); });
  }
}

function locationSnippet(location, content) {
 var val = content.substring(location.start, location.end).split('\n'); 
 
 return val;
}

function lint(content) {
  var warnings = [];
  var ast = parse5.parse(content, {locationInfo: true}); // see options arg?
  walk(ast, (node) => {
    if (node.attrs) {
      node.attrs.forEach((attr) => {
        var attrloc = node.__location.attrs[attr.name];

        // Check for inline styles.
        if (attr.name == 'style') {
          warnings.push(['inline style', attr, attrloc]);
        }

        if (attr.name == 'dom-if') {
          warnings.push(['dom-if', attr, attrloc]);
        }

        // Check for single quoted attribte values.
        if (attrloc) {  // Synthetic attributes have no location.
          var s = content.substring(attrloc.startOffset, attrloc.endOffset);
          var parts = s.split('=');
          if (parts.length == 2) {
            var val = parts[1];
            if (val[0] == '\'' || val[val.length-1] == '\'') {
              warnings.push(['single-quoted attribute value', attr, attrloc]);
            }
          }
        }
      });
    }

    if (node.nodeName == 'style') {
      var raw = node.childNodes[0].value;
      var cssom = css.parse(raw);
      var formatted = css.stringify(cssom);
      // TODO(banksean): add CSS checks (spacing btw rules etc).
    }
  });
  return warnings;
}

options.input.forEach((input) => {
  loadFile(input, {
    resolve: (content) => {
      var warnings = lint(content);
      if (warnings.length > 0) {
        console.error(warnings);
      }
    },
    reject: (err) => {
      console.error('Could not open file: ' + err);
    }
  });
});
