/// <reference path="compiler.d.ts" />
/// <reference path='compiler.d.ts' />
/// <reference path="optionsParser.ts" />
/// <reference path='cli-render/render.ts' />
/// <reference path='typings/linq/linqjs.d.ts' />

require('colors');
var TS = <TypeScript>require('./typescript').TypeScript;
var Enumerable = <linqjs.EnumerableStatic>require('./libs/linq');

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

    private printViolations(file: string, violations: IViolation[]) {

        var pad = (value: string, count: number, length: number, base: string) => {
            var result = '';
            for (var i = 0; i < length; i++) {
                result += base[i] != '\t' ? ' ' : base[i];
            }

            for (var i = 0; i < count; i++) {
                result += value;
            }
            return result;
        }

        var index = 1;

        Enumerable.from(violations)
            .forEach((violation: IViolation) => {
                (<any>violation).underline = pad((!process.env.SHOW_COLORS ? '^' : '^'.red), violation.textValue.length, violation.position.col, violation.position.text);
                (<any>violation).index = index++;

                if (process.env.DEBUG) {
                    this.api.inspect(violation.node);
                }
            });

        var out = new Render().validate({ file: file, violations: violations, violation_count: violations.length });

        this.ioHost.printLine(out);
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

        opts.flag('hide_colors', {
            usage: 'Show console colors',
            set: () => {
                process.env.SHOW_COLORS = false;
            }
        }, 'c');

        opts.flag('trace', {
            usage: 'Show trace data',
            set: () => {
                process.env.DEBUG = true;
            }
        }, 't');

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