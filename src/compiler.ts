///<reference path='typescript/typescript.d.ts' />
///<reference path='io.ts' />

var TS = <TypeScript>require('./typescript').TypeScript;

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

class ErrorReporter implements TypeScript.IDignosticsReporter {
    private compilationEnvironment: TypeScript.CompilationEnvironment

    public addDiagnostic(diagnostic: TypeScript.IDiagnostic) {
        if (!(<any>TS.PositionTrackingWalker).violations)
            (<any>TS.PositionTrackingWalker).violations = [];

        (<any>TS.PositionTrackingWalker).violations.push({
            type: ViolationType.TypeScript,
            message: diagnostic.message()
        });
    }
}

class TypeScriptCompiler {
    private index = 0;

    constructor(rules: RuleConfig[]) {
        rules.forEach((rule: RuleConfig) => {
            this.registerRule(rule);
        });
    }

    private registerRule(rule: RuleConfig) {
        (<any>TS.PositionTrackingWalker).registerRule(rule);
    }

    public validate(code: string): IViolation[]{
        (<any>TS.PositionTrackingWalker).violations = [];

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

        return (<any>TS.PositionTrackingWalker).violations;
    }
}