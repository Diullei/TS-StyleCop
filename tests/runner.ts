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
var htmlFile = '../test-report.html';

qunit.test('Running test cases...', function () {

    if (IO.fileExists(htmlFile)) IO.deleteFile(htmlFile);

    var cases = IO.dir('../tests/cases', /\.ts$/g, {recursive: true});
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
                    Diff.createHtml(htmlFile, html);
                    console.log('exitcode: '.red + exitcode + " - For more details check the '" + htmlFile.cyan + "' file.");
                } else {
                    console.log('exitcode: '.green + exitcode);
                }

                process.exit(exitcode);
            }
        });
    });
});
