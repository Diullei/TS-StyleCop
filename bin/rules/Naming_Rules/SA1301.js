var TS = require('../../typescript').TypeScript;

exports.rule = {
    name: 'ElementMustBeginWithLowerCaseLetter',
    category: 'Naming Rules',
    code: 'SA1301',
    cause: 'The name of a TypeScript element does not begin with an lower-case letter.',
    definition: 'Element must begin with lower case letter',
    description: 'A violation of this rule occurs when the names of certain type members of elements do not begin with an lower-case letter. ' + 'The following elements should use a lower-case letter as the first letter of the element name: function, ' + 'fields, vars, methods.',
    howToFix: 'To fix a violation of this rule, change the name of the element so that it begins with an lower-case letter',
    matcher: {
        nodeType: [TS.SyntaxKind.MemberFunctionDeclaration, TS.SyntaxKind.VariableDeclaration],
        propertyMatches: {
            propertyName: function (node, refNode) {
                refNode.targets.push(node);
                return !(/[A-Z]/.test(node.text()[0]));
            },
            variableDeclarators: function (node, refNode) {
                var arr = node.toArray();
                if (arr.length > 0) {
                    var first = arr[0];
                    refNode.targets.push(first.identifier);
                    return !(/[A-Z]/.test(first.identifier.text()[0]));
                }
                return true;
            }
        }
    }
};

