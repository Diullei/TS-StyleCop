/// <reference path="compiler.d.ts" />
///<reference path='compiler.d.ts' />
/// <reference path="optionsParser.ts" />

var TS = <TypeScript>require('./typescript').TypeScript;

class Batch {
    private api = <{
        verify: (code: string) => IViolation[];
        registerRule: (rule: RuleConfig) => any;
        inspect: (obj: any) => any;
    }>require('./api');

    constructor(private ioHost: IIO) {
    }

    private printVersion() {
        var packageConfig = require('../package');
        var version = packageConfig.version;
        this.ioHost.printLine("Version " + version);
    }

    // TODO: stract this to API
    private getLine(source: string, position: number): { index: number; text: string; line: number; } {
        var index = position;
        if (position > 0) {
            while (index > 0 && source[index] != '\n') {
                index--;
            }

            return {
                index: index != 0 
                    ? position - index
                    : position + 1,
                text: source.substr(index).match(/[^\r\n]+/g)[0],
                line: index != 0 
                    ? source.substr(0, index).match(/[^\r\n]+/g).length + 1
                    : 1
            };
        } else {
            return {
                index: position - index,
                text: source.match(/[^\r\n]+/g)[0],
                line: 1
            };
        }
    }

    private pad(value, count) {
        var result = '';
        for (var i = 0; i < count; i++) {
            result += value;
        }
        return result;
    }

    private printViolations(file: string, violations: IViolation[]) {
        this.ioHost.printLine('');
        this.ioHost.printLine(' ==== \33[36m\33[1m' + file + '\33[0m ====');

        var printTSStyleCopViolation = (violation: IViolation, index: number) => {
            this.ioHost.printLine(' #' + index + ' \33[36m\33[1m\[\33[31m\33[1m' + violation.code + '\33[36m\33[1m\]\33[0m ' + violation.message);

            if (process.env.DEBUG) {
                this.api.inspect(violation.node);
            }

            var node = <any>violation.node;
            // TODO: create an interface no node
            // TODO: stract to API
            var line = this.getLine(node._sourceText.scriptSnapshot.text, node._fullStart);

            this.ioHost.printLine('   \33[33m\33[1m' + line.text + '\33[0m // Line ' + line.line + ', Pos ' + line.index);
            this.ioHost.printLine('  ' + this.pad(' ', line.index) + '\33[31m\33[1m' + this.pad('^', node.valueText().length) + '\33[0m');
        };

        var printTypeScriptViolation = (violation: IViolation, index: number) => {
            this.ioHost.printLine('\33[31m\33[1m>\33[0m  #' + index + ' ' + violation.message);
        };

        violations.forEach((violation: IViolation, index: number) => {
            if (violation.node) {
                if (violation.type == /*ViolationType.TSStyleCop*/1) {
                    printTSStyleCopViolation(violation, index + 1);
                } else if (violation.type == /*ViolationType.TypeScript*/0) {
                    printTypeScriptViolation(violation, index + 1);
                }
            }
        });
    } 

    public run() {
        var opts = new OptionsParser(IO);

        var printedUsage = false;

        opts.flag('help', {
            usage: 'Print this message',
            set: () => {
                this.printVersion();
                opts.printUsage();
                printedUsage = true;
            }
        }, 'h');

        opts.flag('version', {
            usage: 'Print the TS-StypeCop version',
            set: () => {
                this.printVersion();
            }
        }, 'v');

        opts.parse(IO.arguments);

        if (opts.unnamed.length > 0) {
            for (var i = 0; i < opts.unnamed.length; i++) {
                var code = this.ioHost.readFile(opts.unnamed[i]).contents();
                var violations = this.api.verify(code);
                this.printViolations(opts.unnamed[i], violations);
            }
        } else {
            if (!printedUsage) {
                this.ioHost.printLine(' No files specified. To verify usage run: tscop --help');
                this.ioHost.quit(1);
            }
        }
    }
}

var batch = new Batch(IO);
batch.run();