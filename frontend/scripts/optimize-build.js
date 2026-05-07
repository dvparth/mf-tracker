/* Lightweight post-build optimizer for CRA output
 - Removes unused CSS via PurgeCSS
 - Minifies CSS via csso
 - Minifies JS via terser

Run with: node ./scripts/optimize-build.js
*/

const { PurgeCSS } = require('purgecss');
const fs = require('fs');
const path = require('path');
const csso = require('csso');
const terser = require('terser');
const glob = require('glob');

const buildDir = path.join(__dirname, '..', 'build');
const staticCss = path.join(buildDir, 'static', 'css');
const staticJs = path.join(buildDir, 'static', 'js');

async function optimize() {
    if (!fs.existsSync(buildDir)) {
        console.log('No build directory found. Run `npm run build` first.');
        process.exit(0);
    }

    // Gather content files for purge analysis
    const contentFiles = glob.sync(path.join(buildDir, '**', '*.{html,js}'));
    const cssFiles = glob.sync(path.join(staticCss, '*.css'));
    const jsFiles = glob.sync(path.join(staticJs, '*.js'));

    if (cssFiles.length > 0) {
        console.log('Running PurgeCSS on CSS files...');
        const purgeCSSResult = await new PurgeCSS().purge({
            content: contentFiles,
            css: cssFiles,
            safelist: { standard: [/^Mui/, /^mfp-/, /^ReactTable/, /^rd-/] }
        });

        // Overwrite CSS files with purified + minified output
        for (const result of purgeCSSResult) {
            const out = csso.minify(result.css).css;
            fs.writeFileSync(result.file, out, 'utf8');
            console.log('Optimized', path.relative(buildDir, result.file));
        }
    } else {
        console.log('No CSS files found to optimize.');
    }

    if (jsFiles.length > 0) {
        console.log('Minifying JS files...');
        for (const file of jsFiles) {
            const code = fs.readFileSync(file, 'utf8');
            const min = await terser.minify(code, { module: true, compress: { passes: 2 } });
            if (min.code) {
                fs.writeFileSync(file, min.code, 'utf8');
                console.log('Minified', path.relative(buildDir, file));
            }
        }
    } else {
        console.log('No JS files found to minify.');
    }

    console.log('Build optimization complete.');
}

optimize().catch(err => { console.error(err); process.exit(1); });
