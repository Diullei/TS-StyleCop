///<reference path='compiler.ts' />

declare var exports: any;
declare var __dirname: string;

var rules: RuleConfig[] = [];

var registerRule = (rule: RuleConfig) => {
    rules.push(rule);
}

var frules = IO.dir(__dirname + '/rules', /\.js$/i, { recursive: true });

frules.forEach((file) => {
    registerRule(<RuleConfig>require(file).rule);
});

exports.registerRule = registerRule;

exports.verify = (code: string) => {
    var compiler = new TypeScriptCompiler(rules);
    return compiler.validate(code);
}