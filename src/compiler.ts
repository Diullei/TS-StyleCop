///<reference path='typescript/typescript.d.ts' />
///<reference path='io.ts' />

var TS = <TypeScript>require('./typescript').TypeScript;

interface Matcher {
    nodeType: TypeScript.SyntaxKind[];
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
    howToSuppress?: string;
    matcher: Matcher;
}

declare enum ViolationType {
    TypeScript,
    TSStyleCop,
}

interface IPosition {
    text: string;
    col: number;
    line: number;
}

interface IViolation {
    type: ViolationType;
    code?: string;
    message: string;
    node: TypeScript.ISyntaxToken;//SyntaxNode;
    position?: IPosition;
    textValue: string;
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

    private getPosition(source: string, position: number): IPosition {
        var index = position;
        if (position > 0) {
            while (index > 0 && source[index] != '\n') {
                index--;
            }

            return {
                col: index != 0
                ? position - index
                : position + 1,
                text: source.substr(index).match(/[^\r\n]+/g)[0],
                line: index != 0
                ? source.substr(0, index).match(/[^\r\n]+/g).length + 1
                : 1
            };
        } else {
            return {
                col: position - index,
                text: source.match(/[^\r\n]+/g)[0],
                line: 1
            };
        }
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

        compiler.addSourceUnit(file, TS.ScriptSnapshot.fromString(__dirname + '/lib.d.ts'), 0, 0, false);
        compiler.addSourceUnit(file, TS.ScriptSnapshot.fromString(code), 0, 0, false);

        compiler.pullTypeCheck();

        var compilationSettings = new TS.CompilationSettings();
        var compilationEnvironment = new TS.CompilationEnvironment(compilationSettings, IO);
        var semanticDiagnostics = compiler.getSemanticDiagnostics(file);
        compiler.reportDiagnostics(semanticDiagnostics, new ErrorReporter());

        (<any[]>(<any>TS.PositionTrackingWalker).violations).forEach((violation: IViolation) => {
            // TODO: create an interface no node
            var node = <any>violation.node;
            var position = this.getPosition(node._sourceText.scriptSnapshot.text, node._fullStart);
            violation.position = position;
            violation.textValue = node.valueText();
        });

        return (<any>TS.PositionTrackingWalker).violations;
    }
}