module.exports = function (grunt) {
    'use strict';

    var path = require('path');
    var util = require('util');

    grunt.loadNpmTasks('grunt-typescript');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-execute');
    grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-tv4');
    grunt.loadNpmTasks('grunt-text-replace');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: {
            bin: ['bin/api.js', 'bin/cli.js', 'bin/javascript.js', 'bin/rules']
        },
        typescript: {
            options: {
                module: 'commonjs',
                target: 'es5',
                base_path: 'src/',
                declaration: false,
                sourcemap: false
            },
            api: {
                src: ['src/api.ts'],
                dest: 'bin/api.js'
            },
            cli: {
                src: ['src/cli.ts'],
                dest: 'bin/cli.js'
            },
            rules: {
                src: ['src/rules/*/*.ts'],
                dest: 'bin'
            }
        },
        replace: {
            tssource: {
                src: ['src/typescript/typescript.js'],
                dest: 'bin/',
                replacements: [{
                    from: '//###-TS - StyleCop Block=###',
                    to: grunt.file.read('src/typescript-adapter.js')
                }]
            }
        }
    });

    grunt.registerTask('compile-api', ['typescript:api']);
    grunt.registerTask('compile-cli', ['typescript:cli']);
    grunt.registerTask('compile-rules', ['typescript:rules']);
    grunt.registerTask('replace-ts', ['replace:tssource']);
    grunt.registerTask('build', ['clean:bin', 'compile-api', 'compile-cli', 'compile-rules', 'replace-ts']);

    grunt.registerTask('default', ['build']);
};