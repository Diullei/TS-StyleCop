/// <reference path="typescript/typescript.d.ts" />

interface Matcher {
    nodeType: TypeScript.SyntaxKind[];
    priority: number;
    propertyMatches?: {};
}

interface RuleConfig {
    name: string;
    category: string;
    code: string;
    cause: string;
    definition: string;
    description: string;
    howToFix: string;
    howToSuppress: string;
    matcher: Matcher;
}

declare enum ViolationType {
    TypeScript,
    TSStyleCop,
}

interface IViolation {
    type: ViolationType;
    code?: string;
    message: string;
}

declare class TypeScriptCompiler {
    private index;
    constructor(rules: RuleConfig[]);
    private registerRule(rule);
    public validate(code: string): IViolation[];
}
