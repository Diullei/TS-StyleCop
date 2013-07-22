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

        //arr.sort(function (a, b) {
        //    if (a.matcher.priority > b.matcher.priority)
        //        return -1; else if (a.matcher.priority == b.matcher.priority)
        //            return 0; else
        //            return 1;
        //});
    });
};

// verify rule match
PositionTrackingWalker.prototype.matches = function (node, matcher, refNode) {
    var flg = true;
    if (matcher.nodeType.indexOf(node.kind()) == -1)
        return true;
    if (typeof matcher.propertyMatches !== 'undefined') {
        for (var prop in matcher.propertyMatches) {
            if (!(prop in node)) {
                if (process.env.DEBUG) {
                    console.log("**** [!] " + prop + " NOT EXISTS ON RULE MATCH ****");
                }
                continue;
            } else {
                if (process.env.DEBUG) {
                    console.log("**** " + prop + " OK ON RULE MATCH ****");
                }
            }

            var astProp = node[prop];

            var matcherProp = matcher.propertyMatches[prop];
            if (typeof matcherProp === 'function') {
                if (!matcherProp(astProp, refNode))
                    return false;
            } else {
                if (process.env.DEBUG) {
                    console.log("**** " + prop + " IS NOT A FUNCTION ****");
                }
            }
        }
    }
    return flg;
};

PositionTrackingWalker.prototype.ruleHandled = function (node) {
    var _this = this;
    var rule = PositionTrackingWalker.rulesByNodeType[node.kind()];
    if (typeof rule !== 'undefined') {
        rule.some(function (rl) {
            var refNode = {};
            if (!_this.matches(node, rl.matcher, refNode)) {
                if (!PositionTrackingWalker.violations)
                    PositionTrackingWalker.violations = [];

                PositionTrackingWalker.violations.push({
                    code: rl.code,
                    type: /*ViolationType.TSStyleCop*/1,
                    message: rl.definition,
                    node: refNode.target
                });
            }
        });
    }
};

// entry point
PositionTrackingWalker.prototype.visitNode = function (node) {
    //console.log(node)
    this.ruleHandled(node);
    node.accept(this);
};
