<img src="https://raw.github.com/Diullei/ts-styleCop/master/logo.png?login=Diullei&token=68a784cff0f8e5795d92e5dc73d05da8"
 alt="Leiningen logo" title="The man himself" align="right" />

<a href="#ts-stylecop">TS-StyleCop</a>
===========

**TS-StyleCop** is a tool to analyzes *TypeScript* source code to enforce a set of style and consistency rules.
> *Based on C# StyleCop.*

TS-StyleCop provides value by enforcing a common set of style rules for TypeScript code. TS-StyleCop intend to be a single, consistent set of rules. Developers will can implement their own rules if they so choose.

### Install

    npm install -g tscop

### Usage

    tscop hello.ts

### Build

1. Install Node if you haven't already (http://nodejs.org/)
2. At the root folder run `npm install`
3. Install grunt cli (http://gruntjs.com/). To do this, run `npm install -g grunt-cli`
4. At the root folder run `grunt`

### TS-StyleCop rules
The implemented rules until now are:

* Naming Rules (SA1300-)
Rules which enforce naming requirements for members, types, and variables.
	* **SA1300:*The name of a TypeScript element does not begin with an upper-case letter.*
	* **SA1301: *The name of a TypeScript element does not begin with an lower-case letter.*

> I'm working on porting all this rules: http://www.stylecop.com/docs/StyleCop%20Rules.html

### Roadmap

* Improving the interface to create rules
* IMplement a set of rules
* Refactor the code
* Create a VisualStudio plugin
* ...

### Creating a custom rule

> Pending...
