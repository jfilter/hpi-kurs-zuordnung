#! /usr/bin/env node

const mri = require('mri');

const { getPossibleSpecializations } = require('./specializations');

const argv = mri(process.argv.slice(2), {
  boolean: ['help', 'h', 'version', 'v'], // TODO
});

const showError = err => {
  console.error(err.message || err + '');
  process.exit(1);
};

const path = argv._[1];
if ('string' !== typeof path || !path) showError('Missing path.');

getPossibleSpecializations(path);
