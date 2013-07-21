<img src="https://raw.github.com/Diullei/ts-styleCop/master/logo.png?login=Diullei&token=68a784cff0f8e5795d92e5dc73d05da8"
 alt="Leiningen logo" title="The man himself" align="right" />

<a href="#ts-stylecop">TS-StyleCop</a>
===========

**TS-StyleCop** is a tool to analyzes *TypeScript* source code to enforce a set of style and consistency rules.
> *Based on C# StyleCop.*

TS-StyleCop provides value by enforcing a common set of style rules for TypeScript code. TS-StyleCop intend to be a single, consistent set of rules. Developers will can implement their own rules if they so choose.

## Install

    npm install -g tscop

## Usage

    tscop hello.ts

## Build

1. Install Node if you haven't already (http://nodejs.org/)
2. At the root folder run `npm install`
3. Install grunt cli (http://gruntjs.com/). To do this, run `npm install -g grunt-cli`
4. At the root folder run `grunt`

## TS-StyleCop rules
The implemented rules until now are:

### Naming Rules (SA1300-)
Rules which enforce naming requirements for members, types, and variables.

* SA1300: ElementMustBeginWithUpperCaseLetter - *The name of a C# element does not begin with an upper-case letter.*

> I'm working on porting all this rules: http://www.stylecop.com/docs/StyleCop%20Rules.html

## Roadmap

* Improving the interface to create rules
* IMplement a set of rules
* Refactor the code
* Create a VisualStudio plugin
* ...

## Creating a custom rule

To exemplify I'll show how to create a little custom rule to validate if a class name starts with 'X' letter.

Create a TypeScript file to write the new rule. the following code is a template to be used:

```javascript
/// <reference path="../../typescript/typescript.d.ts" />
/// <reference path="../../compiler.d.ts" />

declare var require: any;

var TS = <TypeScript>require('../../typescript').TypeScript;

export var rule = <RuleConfig>{
    name: 'RULE_NAME',
    category: 'RULE_CATEGORY_NAME',
    code: 'RULE_CODE',
    cause: 'RULE_CAOUSE',
    definition: 'RULE_DEFINITION',
    description: 'RULE_DESCRIPTION',
    howToFix: 'HOW_TO_FIX_THIS_VIOLATION',
    matcher: {
        nodeType: [/* A lists of types to be verified */],
        propertyMatches: {/* validations */}
    }
};
```

Let's create a rule file named `myCustomRule.ts` with this template.

...