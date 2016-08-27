'use strict';

const esprima = require('esprima');
const fs = require('fs');


console.log(esprima.parse('let three = 2 + 1'));
