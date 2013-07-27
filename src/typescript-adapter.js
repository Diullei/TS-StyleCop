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

PositionTrackingWalker.prototype.ruleHandled = function (node) {
    var _this = this;
    var rule = PositionTrackingWalker.rulesByNodeType[node.kind()];
    if (typeof rule !== 'undefined') {
        rule.some(function (rl) {
            _this.applyRule(node, rl)
        });
    }
};

// entry point
PositionTrackingWalker.prototype.visitNode = function (node) {
    if (process.env.DEBUG) {
        console.log('---------------------------------------------------------')
        console.log(TypeScript.SyntaxKind[node.kind()])
        console.log(node)
    }
    this.ruleHandled(node);
    node.accept(this);
};
