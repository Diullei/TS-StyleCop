var TS = require('../../typescript').TypeScript;

exports.rule = {
    name: 'ElementMustBeginWithUpperCaseLetter',
    category: 'Naming Rules',
    code: 'SA1300',
    cause: 'The name of a TypeScript element does not begin with an upper-case letter.',
    definition: 'Element must begin with upper case letter',
    description: 'A violation of this rule occurs when the names of certain types of elements do not begin with an upper-case letter. ' + 'The following types of elements should use an upper-case letter as the first letter of the element name: namespaces, ' + 'classes, enums, interfaces.',
    howToFix: 'To fix a violation of this rule, change the name of the element so that it begins with an upper-case letter',
    howToSuppress: '//SuppressMessage: "TS-StyleCop.TypeScript.NamingRules", "SA1300:ElementMustBeginWithUpperCaseLetter", Justification = "Reviewed."',
    matcher: {
        nodeType: [TS.SyntaxKind.ClassDeclaration],
        priority: 1,
        propertyMatches: {
            identifier: function (node) {
                return !(/[a-z]/.test(node.text()[0]));
            }
        }
    }
};

