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
var OptionsParser = (function () {
    function OptionsParser(host) {
        this.host = host;
        this.DEFAULT_SHORT_FLAG = "-";
        this.DEFAULT_LONG_FLAG = "--";
        this.unnamed = [];
        this.options = [];
    }
    OptionsParser.prototype.findOption = function (arg) {
        for (var i = 0; i < this.options.length; i++) {
            if (arg === this.options[i].short || arg === this.options[i].name) {
                return this.options[i];
            }
        }

        return null;
    };

    OptionsParser.prototype.printUsage = function () {
        this.host.printLine("Syntax:   tsmvc [options]");
        this.host.printLine("");
        this.host.printLine("Options:");

        var output = [];
        var maxLength = 0;
        var i = 0;

        this.options = this.options.sort(function (a, b) {
            var aName = a.name.toLowerCase();
            var bName = b.name.toLowerCase();

            if (aName > bName) {
                return 1;
            } else if (aName < bName) {
                return -1;
            } else {
                return 0;
            }
        });

        for (i = 0; i < this.options.length; i++) {
            var option = this.options[i];

            if (option.experimental) {
                continue;
            }

            if (!option.usage) {
                break;
            }

            var usageString = "  ";
            var type = option.type ? " " + option.type.toUpperCase() : "";

            if (option.short) {
                usageString += this.DEFAULT_SHORT_FLAG + option.short + type + ", ";
            }

            usageString += this.DEFAULT_LONG_FLAG + option.name + type;

            output.push([usageString, option.usage]);

            if (usageString.length > maxLength) {
                maxLength = usageString.length;
            }
        }

        for (i = 0; i < output.length; i++) {
            this.host.printLine(output[i][0] + (new Array(maxLength - output[i][0].length + 3)).join(" ") + output[i][1]);
        }
    };

    OptionsParser.prototype.option = function (name, config, short) {
        if (!config) {
            config = short;
            short = null;
        }

        config.name = name;
        config.short = short;
        config.flag = false;

        this.options.push(config);
    };

    OptionsParser.prototype.flag = function (name, config, short) {
        if (!config) {
            config = short;
            short = null;
        }

        config.name = name;
        config.short = short;
        config.flag = true;

        this.options.push(config);
    };

    OptionsParser.prototype.parseString = function (argString) {
        var position = 0;
        var tokens = argString.match(/\s+|"|[^\s"]+/g);

        function peek() {
            return tokens[position];
        }

        function consume() {
            return tokens[position++];
        }

        function consumeQuotedString() {
            var value = '';
            consume();

            var token = peek();

            while (token && token !== '"') {
                consume();

                value += token;

                token = peek();
            }

            consume();

            return value;
        }

        var args = [];
        var currentArg = '';

        while (position < tokens.length) {
            var token = peek();

            if (token === '"') {
                currentArg += consumeQuotedString();
            } else if (token.match(/\s/)) {
                if (currentArg.length > 0) {
                    args.push(currentArg);
                    currentArg = '';
                }

                consume();
            } else {
                consume();
                currentArg += token;
            }
        }

        if (currentArg.length > 0) {
            args.push(currentArg);
        }

        this.parse(args);
    };

    OptionsParser.prototype.parse = function (args) {
        var position = 0;

        function consume() {
            return args[position++];
        }

        while (position < args.length) {
            var current = consume();
            var match = current.match(/^(--?|@)(.*)/);
            var value = null;

            if (match) {
                if (match[1] === '@') {
                    this.parseString(this.host.readFile(match[2]).contents());
                } else {
                    var arg = match[2];
                    var option = this.findOption(arg);

                    if (option === null) {
                        this.host.printLine("Unknown option '" + arg + "'");
                        this.host.printLine("Use the '--help' flag to see options");
                    } else {
                        if (!option.flag)
                            value = consume();

                        option.set(value);
                    }
                }
            } else {
                this.unnamed.push(current);
            }
        }
    };
    return OptionsParser;
})();
var api = require('./api');

var code = 'class teste {}';

api.verify(code);
