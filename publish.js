#!/bin/env node
/**
 * publish.js
 * 
 * Use this script with Node.js. This script modifies JavaScript exported by Adobe Animate
 * so that it may work with the simulation.
 */

const fs = require('fs');
const path = require('path');

let figures = 2;
let palettables = {
    "#666600":"eyeA",
    "#663300":"hairA",
    "#FFCC99":"skinA",
    "#F49E50":"skinB",
    "#E5CCFF":"outfitA",
    "#70618D":"outfitB"
}

let option = false;
let force = false;
let nocopy = false;
let cachedir = false;


try {
    // Parse arguments.
    if (process.argv.length < 3) throw Error('No file specified.');

    if (process.argv[2].startsWith('-')) {
        option = true;
        if (process.argv[2].includes('f')) force = true;
        if (process.argv[2].includes('n')) nocopy = true;
        if (process.argv[2].includes('c')) cachedir = true;
        if (process.argv.length < 4) throw Error('Option specified with no file.');
    }
    
    let file = path.parse(process.argv[option ? 3 : 2]);
    let filepath = path.format(file);

    if (file.ext !== '.js') throw Error('File must be of type \'.js\'.')

    // Check if file has already been published.
    let data = fs.readFileSync(filepath, {encoding: 'utf-8'});
    if (!force && (data.startsWith('// Published.') || data.endsWith('// Published.')))
        throw Error('File already marked as published.');
    
    // Make a backup copy of the original file.
    if (!nocopy)
        fs.copyFileSync(filepath, `${file.name}.orig${file.ext}`);
    
    // Define a local reference to avatarPalette.
    data = data.replace(
        /^\/\/ stage content:\n.*function\(mode,startPosition,loop.*\).*$/gm,
        '$&\nthis.assetPalette = avatarPalette;\n'
    );
    
    // Replace special colors with references to avatar palette colors.
    for (const color in palettables) {
        data = data.replace(
            `graphics.f("${color}").s()`,
            `graphics.f(this.assetPalette.${palettables[color]}).s()`
        );
    }

    // Add toggling if-statement to avatar figure layers.
    for (let i = 0; i < figures; ++i) {
        figure = `figure${i}`;

        data = data.replace(
            RegExp( `(\\/\\/ ${figure}avatar(.|\\n)*?)(^.*addTween)`, 'gm' ),
            `$1if (this.assetPalette.figure == ${i})$3`
        );

        data = data.replace(
            RegExp( `(\\/\\/ ${figure}hair(\\d)(.|\\n)*?)(^.*addTween)`, 'gm' ),
            `$1if (this.assetPalette.figure == ${i} && this.assetPalette.hair == $2)$4`
        );

        data = data.replace(
            RegExp( `(\\/\\/ ${figure}eyes(\\d)(.|\\n)*?)(^.*addTween)`, 'gm' ),
            `$1if (this.assetPalette.figure == ${i} && this.assetPalette.eyes == $2)$4`
        );
    }

    // Replace references to cached bitmap images/ directory with assets/cached.
    if (!cachedir)
        data = data.replace(
            /"images\//,
            '"assets/cached/'
        );

    // Insert a lookup table entry so the composition ID may be found later.
    data = data.replace(
        /^}\)\(createjs = createjs\|\|{}, AdobeAn = AdobeAn\|\|{}\);$/gm,
        `\nFILE_TO_ID = window.FILE_TO_ID || {}; FILE_TO_ID["${file.name}"] = lib.properties.id;\n$&`
    );

    // Mark file as published and write.
    data += '\n// Published.'
    fs.writeFileSync(filepath, data);

    console.log('\033[33mPublished!\033[m');

} catch(err) {
    console.log('\033[31m' + `\nError: ${err.message}` + '\033[m\n');
    console.log('Usage:    node publish.js <options> <filename>\n');
    console.log('Options:  -fna');
    console.log('           f   Force publishing if file has already been published.');
    console.log('            n  Do not make a backup copy of the original file.');
    console.log('             a Do not replace references to cached bitmap images/ with assets/cached/.');
    process.exit(1);
}
