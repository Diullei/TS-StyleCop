///<reference path="../common.d.ts" />
/// <reference path='terminal-color.d.ts' />

declare var __dirname: any;

class Render {

    private terminal = <Terminal>require(__dirname + '/../src/cli-render/terminal-color.js');
    private handlebars = require('handlebars');
    private fs = require('fs');
    private path = require('path');

    private cache: { [key: string]: any; } = {};

    private load(template: string, data: any) {
        if (this.cache[template]) {
            return this.cache[template](data);
        }

        var contents = this.fs.readFileSync(template).toString();
        this.cache[template] = this.handlebars.compile(contents);

        return this.cache[template](data);
    }

    public validate(data: any) {
        for (var attr in this.terminal.Colors) {
            if (!data[attr]) {
                data[attr] = (!process.env.SHOW_COLORS ? '' : this.terminal.Colors[attr]);
            }
        }

        return this.load(__dirname + '/../src/cli-render/templates/validating.tmpl', data);
    }
}