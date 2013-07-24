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

    private getPosition(source: string, position: number, file: string): IPosition {
        var soruceUnit = new TS.SourceUnit(file, new FileInformation(source, ByteOrderMark.None));
        var lineMap = new TS.LineMap(soruceUnit.getLineStartPositions(), soruceUnit.getLength());
        var lineCol = { line: -1, character: -1 };
        lineMap.fillLineAndCharacterFromPosition(position, lineCol);

        var lines: string[] = [];

        var line = '';
        for (var i = 0; i < source.length; i++) {
            if (source[i] == '\n') {
                lines.push(line);
                line = '';
                continue;
            }

            if (source[i] != '\r') {
                line += source[i];
            }
        }

        return {
            col: lineCol.character + 1,
            text: lines[lineCol.line],
            line: lineCol.line + 1
        };
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
            var position = this.getPosition(node._sourceText.scriptSnapshot.text, node._fullStart, file);
            violation.position = position;
            violation.textValue = node.valueText();
        });

        return (<any>TS.PositionTrackingWalker).violations;
    }
}