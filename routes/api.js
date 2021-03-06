const express = require('express');
const playerFields = require('./playerFields');
const filterDeps = require('../util/filterDeps');
const spec = require('./spec');

const api = new express.Router();
const subkeys = playerFields.subkeys;

// Player endpoints middleware
api.use('/players/:account_id/:info?', (req, res, cb) => {
  if (isNaN(Number(req.params.account_id))) {
    return cb('invalid account_id');
  }
  // Enable significance filter by default, disable it if 0 is passed
  if (req.query.significant === '0') {
    delete req.query.significant;
  } else {
    req.query.significant = 1;
  }
  let filterCols = [];
  Object.keys(req.query).forEach((key) => {
    // numberify and arrayify everything in query
    req.query[key] = [].concat(req.query[key]).map(e =>
      (isNaN(Number(e)) ? e : Number(e))
    );
    // build array of required projections due to filters
    filterCols = filterCols.concat(filterDeps[key] || []);
  });
  req.queryObj = {
    project: ['match_id', 'player_slot', 'radiant_win'].concat(filterCols).concat((req.query.sort || []).filter(f => subkeys[f])),
    filter: req.query || {},
    sort: req.query.sort,
    limit: Number(req.query.limit),
    offset: Number(req.query.offset),
  };
  return cb();
});

// API spec
api.get('/', (req, res) => {
  res.json(spec);
});

// API endpoints
Object.keys(spec.paths).forEach((path) => {
  Object.keys(spec.paths[path]).forEach((verb) => {
    const {
      route,
      func,
    } = spec.paths[path][verb];
    api[verb](route(), func);
  });
});

module.exports = api;
