///<reference path='typings/qunit/qunit.d.ts' />
///<reference path='../src/io.ts' />
///<reference path='diff.ts' />

declare var process: any;
declare var exitcode: any;

require('colors');
var fs = require('fs');
var path = require('path');
var sys = require('sys');
var exec = require('child_process').exec;

process.chdir(path.join("bin"));

var execTest = (testFile: string, done: (err, content, file: string) => any) => {

    var command = "node tscop " + testFile + " --hide_colors";

    exec(command, function (error, stdout, stderr) {
        if (error !== null) {
            done(error, null, testFile);
        } else {
            IO.writeFile('../tests/output/' + path.basename(testFile, '.ts') + '.output', stdout, true);
            done(null, stdout, testFile);
        }
    });
};

var failure = false;
var index = 0;

qunit.test('Running test cases...', function () {

    if (IO.fileExists('../test-report.html')) IO.deleteFile('../test-report.html');

    var cases = IO.dir('../tests/cases/Naming_Rules', /\.ts$/g);
    var html = '';

    cases.forEach((file) => {
        execTest(file, (err, content, file: string) => {
            if (err) {
                console.log('>>> ' + file.red);
                html += Diff.generateHtmlDiff(fs.readFileSync(file), err.toString(), file);
                failure = true;
            } else {
                var baseline = fs.readFileSync(file.replace(/\.ts$/g, '.output'), 'utf8');

                var res = baseline.trim() == content.trim();

                if (!res) {
                    html += Diff.generateHtmlDiff(baseline.trim(), content.trim(), file);
                    failure = true;
                }
                ok(res, file);
            }

            index++;
            if (index === cases.length) {
                if (failure) exitcode = 1;

                if (html != '') {
                    Diff.createHtml('../test-report.html', html);
                }

                console.log('exitcode: ' + exitcode);
                process.exit(exitcode);
            }
        });
    });
});
