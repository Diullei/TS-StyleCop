var TS = require('../../typescript').TypeScript;

function recursiveModuleName(node, refNode) {
    var failed = false;

    if (node.left.left) {
        failed = recursiveModuleName(node.left, refNode);
    } else {
        if (/[a-z]/.test(node.left.text()[0])) {
            refNode.targets.push(node.left);
            failed = true;
        }
    }
    if (/[a-z]/.test(node.right.text()[0])) {
        refNode.targets.push(node.right);
        failed = true;
    }
    return !failed;
}

exports.rule = {
    name: 'ElementMustBeginWithUpperCaseLetter',
    category: 'Naming Rules',
    code: 'SA1300',
    cause: 'The name of a TypeScript element does not begin with an upper-case letter.',
    definition: 'Element must begin with upper case letter',
    description: 'A violation of this rule occurs when the names of certain types of elements do not begin with an upper-case letter. ' + 'The following types of elements should use an upper-case letter as the first letter of the element name: namespaces, ' + 'classes, enums, interfaces.',
    howToFix: 'To fix a violation of this rule, change the name of the element so that it begins with an upper-case letter',
    matcher: {
        nodeType: [
            TS.SyntaxKind.ClassDeclaration,
            TS.SyntaxKind.InterfaceDeclaration,
            TS.SyntaxKind.EnumDeclaration,
            TS.SyntaxKind.ModuleDeclaration
        ],
        propertyMatches: {
            identifier: function (node, refNode) {
                refNode.targets.push(node);
                return !(/[a-z]/.test(node.text()[0]));
            },
            enumElements: function (node, refNode) {
                var failed = false;
                var arr = node.elements;

                for (var i = 0; i < arr.length; i++) {
                    if (arr[i].propertyName) {
                        if (/[a-z]/.test(arr[i].propertyName.text()[0])) {
                            refNode.targets.push(arr[i].propertyName);
                            failed = true;
                        }
                    }
                }

                return !failed;
            },
            moduleName: function (node, refNode) {
                return recursiveModuleName(node, refNode);
            }
        }
    }
};

