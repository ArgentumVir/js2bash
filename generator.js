'use strict';

const esprima = require('esprima');
const fs = require('fs');

const params = getParams();
validateParams(params);

const readStream = fs.createReadStream(params.input);
const writeStream = fs.createWriteStream(params.output, {'flags': 'w'});

console.log(JSON.stringify(esprima.parse(params.input)));

function getParams() {
	const arguements = process.argv.slice(2);
	let lastArguement = null;
	let params = {
		input: null,
		output: null,
		overwrite: false
	};

	// Gets the arguements we care about (aka not 'node <this file>')
	arguements.forEach(function (val) {
		switch (val) {
			case '--input':
				lastArguement = 'input';
				break;
			case '--output':
				lastArguement = 'output';
				break;
			case '--overwrite':
				lastArguement = 'overwrite';
				break;
			default:
				if (lastArguement) {
					params[lastArguement] = val;
					lastArguement = null;
				} else {
					writeUseage();
					throw new Error(`Unexpected arguement '${val}'`);
				}
		}
	});

	if (!params.output) { params.output = `${params.input}.sh`; }
	return params;
}

function validateParams(params) {
    if(!params.input) {
        writeUseage();
        throw new Error('No input file recieved. ');
    }
    else if (!fs.existsSync(params.input)) {
        throw new Error(`Input file '${params.input}' not found. `);
    } else if(fs.existsSync(params.output) && !params.overwrite) {
        throw new Error(`Output file '${params.output}' already exists and overwriting is set to false. `);
    }
}

function writeUseage() {
	console.log('Useage: node generator.js --input <JS FILE> --output <Filename (Optional)> --overwrite <true/false (Optional)>');
}
