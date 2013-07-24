module TSStypeCop.Util {

    export function getPosition(text: string, index: number): string {

        //text = text.replace(/\t/i, '    ');

        var length = text.length;

        if (0 === length) {
            return text;
        }

        var lines = text.match(/[^\r\n]+/g);

        var i = 0;
        var line = 0;
        var inc = 0;
        var starts = [];

        while (i < lines.length) {
            starts[i] = inc;

            if ((lines[i].length + inc) > index) {
                line = i;
                break;
            }

            inc += lines[i].length;
            i++;
        }

        return lines[line - 1];
    }

    export function isAnyLineBreakCharacter(c: number): boolean {
        return c === 10 ||
               c === 13 ||
            c === 0x0085 ||
            c === 0x2028 ||
            c === 0x2029;
    }
}