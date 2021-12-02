// system
const fs = require('fs-extra');

/**
 * Copy files.
 */
fs.copy('docs', 'dist/docs');
fs.copy('index.html', 'dist/index.html');
fs.copy('vernonia-annexations.geojson', 'dist/vernonia-annexations.geojson');
fs.copy('_headers', 'dist/_headers');
fs.copy('_redirects', 'dist/_redirects');
