///<reference path='typings/qunit/qunit.d.ts' />
///<reference path='../src/io.ts' />

declare var process: any;
declare var exitcode: any;

var fs = require('fs');
var path = require('path');
var sys = require('sys');
var exec = require('child_process').exec;

qunit.module('Naming rules');

process.chdir(path.join("bin"));

var execTest = (testFile: string, done: (err, content?) => any) => {

    var command = "node tscop " + testFile + " --show_colors false";

    exec(command, function (error, stdout, stderr) {
        if (error !== null) {
            done(error);
        } else {
            IO.writeFile('../tests/output/' + path.basename(testFile, '.ts') + '.output', stdout, true);
            done(null, stdout);
        }
    });
};

var failure = false;
var index = 0;

qunit.test('Running naming rule cases...', function () {

    var cases = IO.dir('../tests/cases/Naming_Rules', /\.ts$/g);

    cases.forEach((file) => {
        execTest(file, (err, content?) => {
            var baseline = fs.readFileSync(file.replace(/\.ts$/g, '.output'), 'utf8');

            var res = baseline.trim() == content.trim();
            if (!res) failure = true;
            ok(res, file);

            index++;
            if (index === cases.length) {
                if (failure) exitcode = 1;
                console.log('exitcode: ' + exitcode);
                process.exit(exitcode);
            }
        });
    });
});
