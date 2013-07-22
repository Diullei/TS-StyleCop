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
var TS = require('./typescript').TypeScript;

var ViolationType;
(function (ViolationType) {
    ViolationType[ViolationType["TypeScript"] = 0] = "TypeScript";
    ViolationType[ViolationType["TSStyleCop"] = 1] = "TSStyleCop";
})(ViolationType || (ViolationType = {}));

var ErrorReporter = (function () {
    function ErrorReporter() {
    }
    ErrorReporter.prototype.addDiagnostic = function (diagnostic) {
        if (!(TS.PositionTrackingWalker).violations)
            (TS.PositionTrackingWalker).violations = [];

        (TS.PositionTrackingWalker).violations.push({
            type: ViolationType.TypeScript,
            message: diagnostic.message()
        });
    };
    return ErrorReporter;
})();

var TypeScriptCompiler = (function () {
    function TypeScriptCompiler(rules) {
        var _this = this;
        this.index = 0;
        rules.forEach(function (rule) {
            _this.registerRule(rule);
        });
    }
    TypeScriptCompiler.prototype.registerRule = function (rule) {
        (TS.PositionTrackingWalker).registerRule(rule);
    };

    TypeScriptCompiler.prototype.validate = function (code) {
        (TS.PositionTrackingWalker).violations = [];

        this.index++;

        var file = "_" + this.index + "f.ts";

        var compiler = new TS.TypeScriptCompiler();
        compiler.settings.codeGenTarget = TS.LanguageVersion.EcmaScript5;
        compiler.settings.moduleGenTarget = TS.ModuleGenTarget.Synchronous;

        compiler.addSourceUnit(file, TS.ScriptSnapshot.fromString(code), 0, 0, false);
        compiler.pullTypeCheck();

        var compilationSettings = new TS.CompilationSettings();
        var compilationEnvironment = new TS.CompilationEnvironment(compilationSettings, IO);
        var semanticDiagnostics = compiler.getSemanticDiagnostics(file);
        compiler.reportDiagnostics(semanticDiagnostics, new ErrorReporter());

        return (TS.PositionTrackingWalker).violations;
    };
    return TypeScriptCompiler;
})();
var util = require('util');

var config = require('./config');
process.env = config.env;

if (process.env.DEBUG) {
    console.log("**** DEBUG MODE ****");
}

var rules = [];

var inspect = function (obj) {
    console.log(util.inspect(obj, false, 10, true));
};

var registerRule = function (rule) {
    rules.push(rule);
};

var frules = IO.dir(__dirname + '/rules', /\.js$/i, { recursive: true });

frules.forEach(function (file) {
    registerRule(require(file).rule);
});

exports.registerRule = registerRule;

exports.verify = function (code) {
    var compiler = new TypeScriptCompiler(rules);
    return compiler.validate(code);
};

exports.inspect = inspect;
