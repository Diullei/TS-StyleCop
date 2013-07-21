/// <reference path="compiler.d.ts" />
/// <reference path="optionsParser.ts" />

var api = <{ verify: (code: string) => any; registerRule: (rule: RuleConfig) => any; }>require('./api');

var code = 'class teste {}';

api.verify(code);