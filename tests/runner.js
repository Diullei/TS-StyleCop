var ByteOrderMark;
(function (ByteOrderMark) {
    ByteOrderMark[ByteOrderMark["None"] = 0] = "None";
    ByteOrderMark[ByteOrderMark["Utf8"] = 1] = "Utf8";
    ByteOrderMark[ByteOrderMark["Utf16BigEndian"] = 2] = "Utf16BigEndian";
    ByteOrderMark[ByteOrderMark["Utf16LittleEndian"] = 3] = "Utf16LittleEndian";
})(ByteOrderMark || (ByteOrderMark = {}));

var FileInformation = (function () {
    function FileInformation(contents, byteOrderMark) {
        this._contents = contents;
        this._byteOrderMark = byteOrderMark;
    }
    FileInformation.prototype.contents = function () {
        return this._contents;
    };

    FileInformation.prototype.byteOrderMark = function () {
        return this._byteOrderMark;
    };
    return FileInformation;
})();

var Environment = (function () {
    function getNodeEnvironment() {
        var _fs = require('fs');
        var _path = require('path');
        var _module = require('module');

        return {
            currentDirectory: function () {
                return (process).cwd();
            },
            readFile: function (file) {
                var buffer = _fs.readFileSync(file);
                switch (buffer[0]) {
                    case 0xFE:
                        if (buffer[1] === 0xFF) {
                            var i = 0;
                            while ((i + 1) < buffer.length) {
                                var temp = buffer[i];
                                buffer[i] = buffer[i + 1];
                                buffer[i + 1] = temp;
                                i += 2;
                            }
                            return new FileInformation(buffer.toString("ucs2", 2), ByteOrderMark.Utf16BigEndian);
                        }
                        break;
                    case 0xFF:
                        if (buffer[1] === 0xFE) {
                            return new FileInformation(buffer.toString("ucs2", 2), ByteOrderMark.Utf16LittleEndian);
                        }
                        break;
                    case 0xEF:
                        if (buffer[1] === 0xBB) {
                            return new FileInformation(buffer.toString("utf8", 3), ByteOrderMark.Utf8);
                        }
                }

                return new FileInformation(buffer.toString("utf8", 0), ByteOrderMark.None);
            },
            writeFile: function (path, contents, writeByteOrderMark) {
                function mkdirRecursiveSync(path) {
                    var stats = _fs.statSync(path);
                    if (stats.isFile()) {
                        throw "\"" + path + "\" exists but isn't a directory.";
                    } else if (stats.isDirectory()) {
                        return;
                    } else {
                        mkdirRecursiveSync(_path.dirname(path));
                        _fs.mkdirSync(path, 0775);
                    }
                }
                mkdirRecursiveSync(_path.dirname(path));

                if (writeByteOrderMark) {
                    contents = '\uFEFF' + contents;
                }
                _fs.writeFileSync(path, contents, "utf8");
            },
            fileExists: function (path) {
                return _fs.existsSync(path);
            },
            deleteFile: function (path) {
                try  {
                    _fs.unlinkSync(path);
                } catch (e) {
                }
            },
            directoryExists: function (path) {
                return _fs.existsSync(path) && _fs.statSync(path).isDirectory();
            },
            listFiles: function dir(path, spec, options) {
                options = options || {};

                function filesInFolder(folder) {
                    var paths = [];

                    var files = _fs.readdirSync(folder);
                    for (var i = 0; i < files.length; i++) {
                        var stat = _fs.statSync(folder + "\\" + files[i]);
                        if (options.recursive && stat.isDirectory()) {
                            paths = paths.concat(filesInFolder(folder + "\\" + files[i]));
                        } else if (stat.isFile() && (!spec || files[i].match(spec))) {
                            paths.push(folder + "\\" + files[i]);
                        }
                    }

                    return paths;
                }

                return filesInFolder(path);
            },
            arguments: process.argv.slice(2),
            standardOut: {
                Write: function (str) {
                    process.stdout.write(str);
                },
                WriteLine: function (str) {
                    process.stdout.write(str + '\n');
                },
                Close: function () {
                }
            }
        };
    }
    ;

    return getNodeEnvironment();
})();

var IOUtils;
(function (IOUtils) {
    function createDirectoryStructure(ioHost, dirName) {
        if (ioHost.directoryExists(dirName)) {
            return;
        }

        var parentDirectory = ioHost.dirName(dirName);
        if (parentDirectory != "") {
            createDirectoryStructure(ioHost, parentDirectory);
        }
        ioHost.createDirectory(dirName);
    }

    function writeFileAndFolderStructure(ioHost, fileName, contents, writeByteOrderMark) {
        var path = ioHost.resolvePath(fileName);
        var dirName = ioHost.dirName(path);
        createDirectoryStructure(ioHost, dirName);
        return ioHost.writeFile(path, contents, writeByteOrderMark);
    }
    IOUtils.writeFileAndFolderStructure = writeFileAndFolderStructure;

    function throwIOError(message, error) {
        var errorMessage = message;
        if (error && error.message) {
            errorMessage += (" " + error.message);
        }
        throw new Error(errorMessage);
    }
    IOUtils.throwIOError = throwIOError;

    var BufferedTextWriter = (function () {
        function BufferedTextWriter(writer, capacity) {
            if (typeof capacity === "undefined") { capacity = 1024; }
            this.writer = writer;
            this.capacity = capacity;
            this.buffer = "";
        }
        BufferedTextWriter.prototype.Write = function (str) {
            this.buffer += str;
            if (this.buffer.length >= this.capacity) {
                this.writer.Write(this.buffer);
                this.buffer = "";
            }
        };
        BufferedTextWriter.prototype.WriteLine = function (str) {
            this.Write(str + '\r\n');
        };
        BufferedTextWriter.prototype.Close = function () {
            this.writer.Write(this.buffer);
            this.writer.Close();
            this.buffer = null;
        };
        return BufferedTextWriter;
    })();
    IOUtils.BufferedTextWriter = BufferedTextWriter;
})(IOUtils || (IOUtils = {}));

var IO = (function () {
    function getNodeIO() {
        var _fs = require('fs');
        var _path = require('path');
        var _module = require('module');

        return {
            readFile: function (file) {
                return Environment.readFile(file);
            },
            writeFile: function (path, contents, writeByteOrderMark) {
                Environment.writeFile(path, contents, writeByteOrderMark);
            },
            deleteFile: function (path) {
                try  {
                    _fs.unlinkSync(path);
                } catch (e) {
                    IOUtils.throwIOError("Couldn't delete file '" + path + "'.", e);
                }
            },
            fileExists: function (path) {
                return _fs.existsSync(path);
            },
            dir: function dir(path, spec, options) {
                options = options || {};

                function filesInFolder(folder) {
                    var paths = [];

                    try  {
                        var files = _fs.readdirSync(folder);
                        for (var i = 0; i < files.length; i++) {
                            var stat = _fs.statSync(folder + "/" + files[i]);
                            if (options.recursive && stat.isDirectory()) {
                                paths = paths.concat(filesInFolder(folder + "/" + files[i]));
                            } else if (stat.isFile() && (!spec || files[i].match(spec))) {
                                paths.push(folder + "/" + files[i]);
                            }
                        }
                    } catch (err) {
                    }

                    return paths;
                }

                return filesInFolder(path);
            },
            createDirectory: function (path) {
                try  {
                    if (!this.directoryExists(path)) {
                        _fs.mkdirSync(path);
                    }
                } catch (e) {
                    IOUtils.throwIOError("Couldn't create directory '" + path + "'.", e);
                }
            },
            directoryExists: function (path) {
                return _fs.existsSync(path) && _fs.statSync(path).isDirectory();
            },
            resolvePath: function (path) {
                return _path.resolve(path);
            },
            dirName: function (path) {
                return _path.dirname(path);
            },
            findFile: function (rootPath, partialFilePath) {
                var path = rootPath + "/" + partialFilePath;

                while (true) {
                    if (_fs.existsSync(path)) {
                        return { fileInformation: this.readFile(path), path: path };
                    } else {
                        var parentPath = _path.resolve(rootPath, "..");

                        if (rootPath === parentPath) {
                            return null;
                        } else {
                            rootPath = parentPath;
                            path = _path.resolve(rootPath, partialFilePath);
                        }
                    }
                }
            },
            print: function (str) {
                process.stdout.write(str);
            },
            printLine: function (str) {
                process.stdout.write(str + '\n');
            },
            arguments: process.argv.slice(2),
            stderr: {
                Write: function (str) {
                    process.stderr.write(str);
                },
                WriteLine: function (str) {
                    process.stderr.write(str + '\n');
                },
                Close: function () {
                }
            },
            stdout: {
                Write: function (str) {
                    process.stdout.write(str);
                },
                WriteLine: function (str) {
                    process.stdout.write(str + '\n');
                },
                Close: function () {
                }
            },
            watchFile: function (fileName, callback) {
                var firstRun = true;
                var processingChange = false;

                var fileChanged = function (curr, prev) {
                    if (!firstRun) {
                        if (curr.mtime < prev.mtime) {
                            return;
                        }

                        _fs.unwatchFile(fileName, fileChanged);
                        if (!processingChange) {
                            processingChange = true;
                            callback(fileName);
                            setTimeout(function () {
                                processingChange = false;
                            }, 100);
                        }
                    }
                    firstRun = false;
                    _fs.watchFile(fileName, { persistent: true, interval: 500 }, fileChanged);
                };

                fileChanged();
                return {
                    fileName: fileName,
                    close: function () {
                        _fs.unwatchFile(fileName, fileChanged);
                    }
                };
            },
            run: function (source, fileName) {
                require.main.fileName = fileName;
                require.main.paths = _module._nodeModulePaths(_path.dirname(_fs.realpathSync(fileName)));
                require.main._compile(source, fileName);
            },
            getExecutingFilePath: function () {
                return (process).mainModule.filename;
            },
            quit: process.exit
        };
    }
    ;

    return getNodeIO();
})();
var Diff;
(function (Diff) {
    function escape(s) {
        var n = s;
        n = n.replace(/&/g, "&amp;");
        n = n.replace(/</g, "&lt;");
        n = n.replace(/>/g, "&gt;");
        n = n.replace(/"/g, "&quot;");

        return n;
    }
    Diff.escape = escape;

    function diffString(o, n) {
        o = o.toString().replace(/\s+$/, '');
        n = n.toString().replace(/\s+$/, '');

        var out = diff(o == "" ? [] : o.split(/\s+/), n == "" ? [] : n.split(/\s+/));
        var str = "";

        var oSpace = o.match(/\s+/g);
        if (oSpace == null) {
            oSpace = ["\n"];
        } else {
            oSpace.push("\n");
        }
        var nSpace = n.match(/\s+/g);
        if (nSpace == null) {
            nSpace = ["\n"];
        } else {
            nSpace.push("\n");
        }

        if (out.n.length == 0) {
            for (var i = 0; i < out.o.length; i++) {
                str += '<del style="background:#FFE6E6;">' + escape(out.o[i]) + oSpace[i] + "</del>";
            }
        } else {
            if (out.n[0].text == null) {
                for (n = 0; n < out.o.length && out.o[n].text == null; n++) {
                    str += '<del style="background:#FFE6E6;">' + escape(out.o[n]) + oSpace[n] + "</del>";
                }
            }

            for (var i = 0; i < out.n.length; i++) {
                if (out.n[i].text == null) {
                    str += '<ins style="background:#E6FFE6;">' + escape(out.n[i]) + nSpace[i] + "</ins>";
                } else {
                    var pre = "";

                    for (n = out.n[i].row + 1; n < out.o.length && out.o[n].text == null; n++) {
                        pre += '<del style="background:#FFE6E6;">' + escape(out.o[n]) + oSpace[n] + "</del>";
                    }
                    str += " " + out.n[i].text + nSpace[i] + pre;
                }
            }
        }

        return str;
    }
    Diff.diffString = diffString;

    function diff(o, n) {
        var ns = new Object();
        var os = new Object();

        for (var i = 0; i < n.length; i++) {
            if (ns[n[i]] == null)
                ns[n[i]] = { rows: new Array(), o: null };
            ns[n[i]].rows.push(i);
        }

        for (var i = 0; i < o.length; i++) {
            if (os[o[i]] == null)
                os[o[i]] = { rows: new Array(), n: null };
            os[o[i]].rows.push(i);
        }

        for (var i in ns) {
            if (ns[i].rows.length == 1 && typeof (os[i]) != "undefined" && os[i].rows.length == 1) {
                n[ns[i].rows[0]] = { text: n[ns[i].rows[0]], row: os[i].rows[0] };
                o[os[i].rows[0]] = { text: o[os[i].rows[0]], row: ns[i].rows[0] };
            }
        }

        for (var i = 0; i < n.length - 1; i++) {
            if (n[i].text != null && n[i + 1].text == null && n[i].row + 1 < o.length && o[n[i].row + 1].text == null && n[i + 1] == o[n[i].row + 1]) {
                n[i + 1] = { text: n[i + 1], row: n[i].row + 1 };
                o[n[i].row + 1] = { text: o[n[i].row + 1], row: i + 1 };
            }
        }

        for (var i = n.length - 1; i > 0; i--) {
            if (n[i].text != null && n[i - 1].text == null && n[i].row > 0 && o[n[i].row - 1].text == null && n[i - 1] == o[n[i].row - 1]) {
                n[i - 1] = { text: n[i - 1], row: n[i].row - 1 };
                o[n[i].row - 1] = { text: o[n[i].row - 1], row: i - 1 };
            }
        }

        return { o: o, n: n };
    }
    Diff.diff = diff;

    function createHtml(out, content) {
        var html = '<html><head><title>Baseline Report</title>\
            <style>\
                .code { font: 9pt \'Courier New\'; }\
                h2 { margin-bottom: 0px; }\
                h2 { padding-bottom: 0px; }\
                h4 { font-weight: normal; }\
            </style>';

        html += content;

        IO.writeFile(out, html, true);
    }
    Diff.createHtml = createHtml;

    function generateHtmlDiff(a, b, file) {
        var html = '';

        if (a != b) {
            var diffCode = diffString(a, b);

            var lines = diffCode.match(/^.*((\r\n|\n|\r)|$)/gm);

            var block = '';

            var pad = "    ";
            for (var j = 0; j < lines.length; j++) {
                var n = "" + (j + 1);
                block += pad.substring(0, pad.length - n.length) + n + ' |' + lines[j];
            }

            html += '<h2>Error: ' + file + '</h2><pre class="code">' + block + '</pre>';
        }

        return html;
    }
    Diff.generateHtmlDiff = generateHtmlDiff;
})(Diff || (Diff = {}));
require('colors');
var fs = require('fs');
var path = require('path');
var sys = require('sys');
var exec = require('child_process').exec;

process.chdir(path.join("bin"));

var execTest = function (testFile, done) {
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
    if (IO.fileExists(htmlFile))
        IO.deleteFile(htmlFile);

    var cases = IO.dir('../tests/cases/Naming_Rules', /\.ts$/g);
    var html = '';

    cases.forEach(function (file) {
        execTest(file, function (err, content, file) {
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
                if (failure)
                    exitcode = 1;

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
