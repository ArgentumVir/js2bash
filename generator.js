'use strict';

const esprima = require('esprima');
const fs = require('fs');

const params = getParams();
validateParams(params);

const readStream = fs.createReadStream(params.input);
const writeStream = fs.createWriteStream(params.output, {'flags': 'w'});
let comments = [];


readStream.on('data', (chunk) => {
	let metadata = esprima.parse(chunk, { comment: true});
	console.log(JSON.stringify(metadata));

	if (metadata.comments) {
		for(let i in metadata.comments) {
			comments.push(metadata.comments[i]);
		}
	}

	for(let i in metadata.body) {
		selectOutput(metadata.body[i]);
	}

	// console.log(JSON.stringify(comments));
});

readStream.on('end', () => {
	writeStream.write('read pause');
});

function selectOutput (statement) {
	//console.log(JSON.stringify(statement));
	switch (statement.type) {
		case 'VariableDeclaration':
			console.log('VariableDeclaration');
			varDeclaration(statement);
			break;
		case 'ExpressionStatement':
			console.log('ExpressionStatement');
			handleObject(statement);
			break;
		default:
	}
}

function varDeclaration(statement) {
	console.log(JSON.stringify(statement));
	let output = '';
	let left = '';
	let right = '';
	let variable = statement.declarations[0].id.name;
	let operator = statement.declarations[0].init.operator;

	right = parseExpression(statement.declarations[0].init.right);
	left = parseExpression(statement.declarations[0].init.left);


	output += `${variable}=${left}${operator}${right}\r\n`;
	writeStream.write(output);
}

function handleObject(statement) {
	if (statement.expression.callee.object.name === 'console') {
		handleConsole(statement);
	}
}

function handleConsole (statement) {
	if (statement.expression.callee.property.name === 'log') {
		print(statement);
	}
}

function print(statement) {
	let output = '';
	let string = statement.expression.arguments[0].value;
	output += `printf '%s\\n' "${string}"\r\n`;
	writeStream.write(output);
}

function parseExpression(exp) {
	let newExp = '';

	switch (exp.type) {
		case 'Literal':
			console.log(exp.type);
			newExp = exp.value;
			break;
		case 'Identifier':
			console.log(exp.type);
			break;
		case 'BinaryExpression':
			console.log(exp.type);
			let left = parseExpression(exp.left);
			let right = parseExpression(exp.right);
			let operator = exp.operator;
			newExp = `(${left}${operator}${right})`
			break;
	}

	return newExp;
}

function getParams() {
	const arguements = process.argv.slice(2);
	let lastSwitch = null;
	let params = {
		input: null,
		output: null,
		overwrite: false
	};

	// Gets the arguements we care about (aka not 'node <this file>')
	arguements.forEach(function (arg) {
		switch (arg) {
			case '--input':
				lastSwitch = 'input';
				break;
			case '--output':
				lastSwitch = 'output';
				break;
			case '--overwrite':
				lastSwitch = 'overwrite';
				break;
			default:
				if (lastSwitch) {
					params[lastSwitch] = arg;
					lastSwitch = null;
				} else {
					writeUseage();
					throw new Error(`Unexpected arguement '${arg}'`);
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
