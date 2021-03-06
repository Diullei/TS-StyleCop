/**********************************************************
    NOTE:
        This code will be inserted in the src/typescript/typescript.js 
        file in place of text "//###-TS - StyleCop Block=###".
**********************************************************/

// store configured rules
PositionTrackingWalker.rulesByNodeType = [];

PositionTrackingWalker.registerRule = function (extension) {
    var arr;
    extension.matcher.nodeType.forEach(function (value) {
        if (typeof PositionTrackingWalker.rulesByNodeType[value] === 'undefined') {
            arr = PositionTrackingWalker.rulesByNodeType[value] = [];
        } else {
            arr = PositionTrackingWalker.rulesByNodeType[value];
        }
        arr.push(extension);
    });
};

// verify rule match
PositionTrackingWalker.prototype.applyRule = function (node, rule) {
    if (rule.matcher.nodeType.indexOf(node.kind()) == -1)
        return;

    if (typeof rule.matcher.propertyMatches !== 'undefined') {
        for (var prop in rule.matcher.propertyMatches) {
            if (!(prop in node)) {
                continue;
            }

            var astProp = node[prop];

            var matcherProp = rule.matcher.propertyMatches[prop];
            if (typeof matcherProp === 'function') {
                var refNode = { targets: [] };

                if (!matcherProp(astProp, refNode)) {
                    if (!PositionTrackingWalker.violations)
                        PositionTrackingWalker.violations = [];

                    refNode.targets.forEach(function(node) {
                        PositionTrackingWalker.violations.push({
                            code: rule.code,
                            type: /*ViolationType.TSStyleCop*/1,
                            message: rule.definition,
                            node: node
                        });
                    });
                }
            } else {
                if (process.env.DEBUG) {
                    console.log("**** " + prop + " IS NOT A FUNCTION ****");
                }
            }
        }
    }
};

PositionTrackingWalker.prototype.ruleHandled = function (node, suppressList) {
    var _this = this;
    var rule = PositionTrackingWalker.rulesByNodeType[node.kind()];
    if (typeof rule !== 'undefined') {
        rule.some(function (rl) {
            if(!suppressList[rl.code + ':' + rl.name]){
                _this.applyRule(node, rl)
            }
        });
    }
};

function stractSuppressMessage(triviaList) {
    var suppressList = {};
    if(triviaList) {
        triviaList.forEach(function(trivia){
            if(TypeScript.SyntaxKind[trivia._kind] == "SingleLineCommentTrivia") {
                var txt = trivia._textOrToken;
                if (txt.match(/^\/\/\s*SuppressMessage\s*\->\s*SA1300\:ElementMustBeginWithUpperCaseLetter$/i)) {
                    var message = txt.split('->')[1].trim(); 
                    suppressList[message.trim()] = true;
                }
            }
        });
    }
    return suppressList;
}

// entry point
PositionTrackingWalker.prototype.visitNode = function (node) {
    if (process.env.DEBUG) {
        console.log('---------------------------------------------------------')
        console.log(node.leadingTrivia())
        console.log(node)
    }
    var suppressList = stractSuppressMessage(node.leadingTrivia().trivia);
    this.ruleHandled(node, suppressList);
    node.accept(this);
};
