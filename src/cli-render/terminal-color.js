(function () {
    var background, bold, bright, colors, foreground, inverse, italics, makeANSI, mustacheEnvironment, reset, strikethrough, underline;
    reset = 0;
    colors = {
        'black': 0,
        'red': 1,
        'green': 2,
        'yellow': 3,
        'blue': 4,
        'magenta': 5,
        'cyan': 6,
        'white': 7,
        'default': 9
    };
    bold = bright = {
        'on': 1,
        'off': 22
    };
    italics = {
        'on': 3,
        'off': 23
    };
    underline = {
        'on': 4,
        'off': 24
    };
    inverse = {
        'on': 7,
        'off': 27
    };
    strikethrough = {
        'on': 9,
        'off': 29
    };
    foreground = function (color) {
        return "3" + color;
    };
    background = function (color) {
        return "4" + color;
    };
    makeANSI = function (code) {
        return '\033[' + code + 'm';
    };

    exports.Colors = {
        'reset': makeANSI(reset),
        'bold': makeANSI(bold.on),
        'nobold': makeANSI(bold.off),
        'bright': makeANSI(bright.on),
        'nobright': makeANSI(bright.off),
        'italics': makeANSI(italics.on),
        'noitalics': makeANSI(italics.off),
        'underline': makeANSI(underline.on),
        'nounderline': makeANSI(underline.off),
        'inverse': makeANSI(inverse.on),
        'noinverse': makeANSI(inverse.off),
        'strikethrough': makeANSI(strikethrough.on),
        'nostrikethrough': makeANSI(strikethrough.off),
        'black': makeANSI(foreground(colors.black)),
        'red': makeANSI(foreground(colors.red)),
        'green': makeANSI(foreground(colors.green)),
        'yellow': makeANSI(foreground(colors.yellow)),
        'blue': makeANSI(foreground(colors.blue)),
        'magenta': makeANSI(foreground(colors.magenta)),
        'cyan': makeANSI(foreground(colors.cyan)),
        'white': makeANSI(foreground(colors.white)),
        'default': makeANSI(foreground(colors["default"])),
        'bgblack': makeANSI(background(colors.black)),
        'bgred': makeANSI(background(colors.red)),
        'bggreen': makeANSI(background(colors.green)),
        'bgyellow': makeANSI(background(colors.yellow)),
        'bgblue': makeANSI(background(colors.blue)),
        'bgmagenta': makeANSI(background(colors.magenta)),
        'bgcyan': makeANSI(background(colors.cyan)),
        'bgwhite': makeANSI(background(colors.white)),
        'bgdefault': makeANSI(background(colors["default"])),
        'ANSI': function () {
            return function (code) {
                return makeANSI(code);
            };
        }
    };
})();