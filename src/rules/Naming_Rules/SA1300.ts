/// <reference path="../../typescript/typescript.d.ts" />
/// <reference path="../../compiler.d.ts" />

declare var require: any;

var TS = <TypeScript>require('../../typescript').TypeScript;

export var rule = <RuleConfig>{
    name: 'ElementMustBeginWithUpperCaseLetter',
    category: 'Naming Rules',
    code: 'SA1300',
    cause: 'The name of a TypeScript element does not begin with an upper-case letter.',
    definition: 'Element must begin with upper case letter',
    description:
    'A violation of this rule occurs when the names of certain types of elements do not begin with an upper-case letter. '
    + 'The following types of elements should use an upper-case letter as the first letter of the element name: namespaces, '
    + 'classes, enums, interfaces.',
    howToFix:
    'To fix a violation of this rule, change the name of the element so that it begins with an upper-case letter',
    matcher: {
        nodeType: [TS.SyntaxKind.ClassDeclaration, TS.SyntaxKind.InterfaceDeclaration, TS.SyntaxKind.EnumDeclaration],
        propertyMatches: {
            identifier: (node, refNode): bool => {
                refNode.target = node;
                return !(/[a-z]/.test(node.text()[0]))
            },
            enumElements: (node, refNode): bool => {
                // TODO: pass a list of nodes to same violation
                var arr: any[] = node.elements;

                for (var i = 0; i < arr.length; i++) {
                    if (arr[i].propertyName) {
                        if (/[a-z]/.test(arr[i].propertyName.text()[0])) {
                            refNode.target = arr[i].propertyName;
                            return false;
                        }
                    }
                }

                return true;
            }
        }
    }
};