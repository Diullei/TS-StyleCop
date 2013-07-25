///<reference path="../src/io.ts" />

module Diff {

    export function escape(s) {
        var n = s;
        n = n.replace(/&/g, "&amp;");
        n = n.replace(/</g, "&lt;");
        n = n.replace(/>/g, "&gt;");
        n = n.replace(/"/g, "&quot;");

        return n;
    }

    export function diffString(o, n) {
        o = o.replace(/\s+$/, '');
        n = n.replace(/\s+$/, '');

        var out = diff(o == "" ? [] : o.split(/\s+/), n == "" ? [] : n.split(/\s+/));
        var str = "";

        var oSpace = o.match(/\s+/g);
        if (oSpace == null) {
            oSpace = ["\n"];
        } else {
            oSpace.push("\n");
        }
        var nSpace = n.match(/\s+/g);
        if (nSpace == null) {
            nSpace = ["\n"];
        } else {
            nSpace.push("\n");
        }

        if (out.n.length == 0) {
            for (var i = 0; i < out.o.length; i++) {
                str += '<del style="background:#FFE6E6;">' + escape(out.o[i]) + oSpace[i] + "</del>";
            }
        } else {
            if (out.n[0].text == null) {
                for (n = 0; n < out.o.length && out.o[n].text == null; n++) {
                    str += '<del style="background:#FFE6E6;">' + escape(out.o[n]) + oSpace[n] + "</del>";
                }
            }

            for (var i = 0; i < out.n.length; i++) {
                if (out.n[i].text == null) {
                    str += '<ins style="background:#E6FFE6;">' + escape(out.n[i]) + nSpace[i] + "</ins>";
                } else {
                    var pre = "";

                    for (n = out.n[i].row + 1; n < out.o.length && out.o[n].text == null; n++) {
                        pre += '<del style="background:#FFE6E6;">' + escape(out.o[n]) + oSpace[n] + "</del>";
                    }
                    str += " " + out.n[i].text + nSpace[i] + pre;
                }
            }
        }

        return str;
    }

    export function diff(o, n) {
        var ns = new Object();
        var os = new Object();

        for (var i = 0; i < n.length; i++) {
            if (ns[n[i]] == null)
                ns[n[i]] = { rows: new Array(), o: null };
            ns[n[i]].rows.push(i);
        }

        for (var i = 0; i < o.length; i++) {
            if (os[o[i]] == null)
                os[o[i]] = { rows: new Array(), n: null };
            os[o[i]].rows.push(i);
        }

        for (var i in ns) {
            if (ns[i].rows.length == 1 && typeof (os[i]) != "undefined" && os[i].rows.length == 1) {
                n[ns[i].rows[0]] = { text: n[ns[i].rows[0]], row: os[i].rows[0] };
                o[os[i].rows[0]] = { text: o[os[i].rows[0]], row: ns[i].rows[0] };
            }
        }

        for (var i = 0; i < n.length - 1; i++) {
            if (n[i].text != null && n[i + 1].text == null && n[i].row + 1 < o.length && o[n[i].row + 1].text == null &&
                n[i + 1] == o[n[i].row + 1]) {
                n[i + 1] = { text: n[i + 1], row: n[i].row + 1 };
                o[n[i].row + 1] = { text: o[n[i].row + 1], row: i + 1 };
            }
        }

        for (var i = n.length - 1; i > 0; i--) {
            if (n[i].text != null && n[i - 1].text == null && n[i].row > 0 && o[n[i].row - 1].text == null &&
                n[i - 1] == o[n[i].row - 1]) {
                n[i - 1] = { text: n[i - 1], row: n[i].row - 1 };
                o[n[i].row - 1] = { text: o[n[i].row - 1], row: i - 1 };
            }
        }

        return { o: o, n: n };
    }

    export function createHtml(out: string, content: string) {
        var html = '<html><head><title>Baseline Report</title>\
            <style>\
                .code { font: 9pt \'Courier New\'; }\
                h2 { margin-bottom: 0px; }\
                h2 { padding-bottom: 0px; }\
                h4 { font-weight: normal; }\
            </style>';

        html += content;

        IO.writeFile(out, html, true);
    }

    export function generateHtmlDiff(a: string, b: string, file: string): string {
        var html = '';

        if (a != b) {
            var diffCode = diffString(a, b);

            var lines = diffCode.match(/^.*((\r\n|\n|\r)|$)/gm);

            var block = '';

            var pad = "    ";
            for (var j = 0; j < lines.length; j++) {
                var n = "" + (j + 1);
                block += pad.substring(0, pad.length - n.length) + n + ' |' + lines[j];
            }

            html += '<h2>Error: ' + file + '</h2><pre class="code">' + block + '</pre>';
        }

        return html;
    }
}