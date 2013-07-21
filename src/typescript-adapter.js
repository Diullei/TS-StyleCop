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

        arr.sort(function (a, b) {
            if (a.matcher.priority > b.matcher.priority)
                return -1; else if (a.matcher.priority == b.matcher.priority)
                    return 0; else
                    return 1;
        });
    });
};

// verify rule match
PositionTrackingWalker.prototype.matches = function (node, matcher) {
    if (matcher.nodeType.indexOf(node.kind()) == -1)
        return false;
    if (typeof matcher.propertyMatches !== 'undefined') {
        for (var prop in matcher.propertyMatches) {
            if (!(prop in node))
                return false;
            var astProp = node[prop];
            var matcherProp = matcher.propertyMatches[prop];
            if (typeof matcherProp === 'function') {
                if (!matcherProp(astProp))
                    return false;
            }
        }
    }
    return true;
};

PositionTrackingWalker.prototype.ruleHandled = function (node) {
    var _this = this;
    var rule = PositionTrackingWalker.rulesByNodeType[node.kind()];
    if (typeof rule !== 'undefined') {
        rule.some(function (rl) {
            if (!_this.matches(node, rl.matcher)) {
                if (!PositionTrackingWalker.violations)
                    PositionTrackingWalker.violations = [];

                PositionTrackingWalker.violations.push({
                    code: rl.code,
                    type: /*ViolationType.TSStyleCop*/1,
                    message: rl.definition
                });
            }
        });
    }
};

// entry point
PositionTrackingWalker.prototype.visitNode = function (node) {
    this.ruleHandled(node);
    node.accept(this);
};
