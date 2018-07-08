#!/usr/bin/env node

var tsnode = require('ts-node').register({ module: 'commonjs' });

require('../lib/index.ts');
// var ezDownloader = require('../dist/index.js');
