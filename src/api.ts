///<reference path='compiler.ts' />

declare var exports: any;
declare var __dirname: string;

var util = require('util');

var config = require('./config');
process.env = config.env;

if (process.env.DEBUG) {
    console.log("**** DEBUG MODE ****");
}

var rules: RuleConfig[] = [];

var inspect = (obj: any) => {
    console.log(util.inspect(obj, false, 10, true));
}

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

exports.inspect = inspect;
