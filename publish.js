#!/bin/env node
/**
 * publish.js
 * 
 * Use this script with Node.js. This script modifies JavaScript exported by Adobe Animate
 * so that it may work with the simulation.
 */

const fs = require('fs');
const path = require('path');

let option = false;
let force = false;
let copy = false;

// From researcher-console/server/common/util.js.
function multipleReplace(string, replacements) {
    for (const [regex, newstr] of replacements)
        string = string.replace(regex, newstr);
    return string;
}

/**
 * Prepare an Animate asset for use with the simulation by inserting variables.
 * 
 * Modified assets will expect a window.assetPalettes to be defined. May throw
 * errors on unsuccessful read/write, if the asset has already been run through
 * the function, or if the extension of the file is not '.js'. The passed file
 * will be overwritten.
 * 
 * @param {String} input The path to the input file.
 */
function publish(input) {

    const file = path.parse(input);
    const filepath = path.format(file);

    if (file.ext !== '.js') throw Error('File must be of type \'.js\'.');

    // Check if file has already been published.
    let data = fs.readFileSync(filepath, {encoding: 'utf-8'});
    if (!force && (data.startsWith('// Published.') || data.endsWith('// Published.'))) {

        if (require.main === module) {
            throw Error('File already marked as published.');
        } else {
            console.log('File already marked as published.');
            return;
        }
    }
    
    // Make a backup copy of the original file.
    if (copy)
        fs.copyFileSync(filepath, `${file.name}.orig${file.ext}`);
    
    const replacements = [
        [/"#ACAC3(\d)"/gm, 'window.assetPalettes[$1].colors[5]'],
        [/"#AC9C3(\d)"/gm, 'window.assetPalettes[$1].colorsDark[5]'],
        [/"#AC3C3(\d)"/gm, 'window.assetPalettes[$1].colors[3]'],
        [/"#3C3CA(\d)"/gm, 'window.assetPalettes[$1].colors[0]'],
        [/"#AC3CA(\d)"/gm, 'window.assetPalettes[$1].colors[4]'],
        [/"#AC2CA(\d)"/gm, 'window.assetPalettes[$1].colorsDark[4]'],
        
        // TODO: Assign all colors slot names instead (color1, color2, etc.) and make dynamic.
        [/"#3CAC3(\d)"/gm, 'window.assetPalettes[$1].colors[1]'],
        [/"#3CACA(\d)"/gm, 'window.assetPalettes[$1].colors[2]'],
    
        // Customizable features (hair, eyes, etc).
        [/(slot(\d)figure(\d)([a-z]+?)(?<!accessory)(\d)[\s\S]*?)(^.*addTween)/gm,
            '$1if (window.assetPalettes[$2].features.figure === $3 && window.assetPalettes[$2].features.$4 === $5)$6'
        ],
    
        // Base layers and accessories.
        // Accessory layer has number, but number is unused in selection. Only figure.
        [/(slot(\d)figure(\d)[a-z\d]+?\s[\s\S]*?)(^.*addTween)/gm,
            '$1if (window.assetPalettes[$2].features.figure === $3)$4'
        ],
    
        // Reference to cache directory for bitmap cached assets.
        [/"images\//g, '"assets/cache/'],
    
        // Lookup table to retrieve the composition ID from the filename.
        [/^}\)\(createjs = createjs\|\|{}, AdobeAn = AdobeAn\|\|{}\);$/gm,
            `\nFILE_TO_ID = window.FILE_TO_ID || {}; FILE_TO_ID["${file.name}"] = lib.properties.id;\n$&`
        ]
    ];

    data = multipleReplace(data, replacements);
    
    // Mark file as published and write.
    data += '\n// Published.';
    fs.writeFileSync(filepath, data);
}

if (require.main === module) {
    try {
        // Parse arguments.
        if (process.argv.length < 3) throw Error('No file specified.');

        if (process.argv[2].startsWith('-')) {
            option = true;
            if (process.argv[2].includes('f')) force = true;
            if (process.argv[2].includes('c')) copy = true;
            if (process.argv.length < 4) throw Error('Option specified with no file.');
        }

        publish(process.argv[option ? 3 : 2]);

        console.log('\033[33mPublished!\033[m');
    } catch(err) {
        console.log('\033[31m' + `\nError: ${err.message}` + '\033[m\n');
        console.log('Usage:    node publish.js <options> <filename>\n');
        console.log('Options:  -fc');
        console.log('           f   Force publishing if file has already been published.');
        console.log('           c   Make a backup copy of the original file.');
        process.exit(1);
    }
}

module.exports = {publish};
