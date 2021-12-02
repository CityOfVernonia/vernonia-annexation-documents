// polyfill
require('isomorphic-form-data');

// system
const fs = require('fs-extra');
const { exec } = require('child_process');

// utilities
const download = require('download');
const chalk = require('chalk');

// arcgis rest
const { setDefaultRequestOptions } = require('@esri/arcgis-rest-request');
const { queryFeatures } = require('@esri/arcgis-rest-feature-layer');
setDefaultRequestOptions({ fetch: require('node-fetch') });

// variables
const serviceUrl =
  'https://gis.columbiacountymaps.com/server/rest/services/Land_Development/Land_Use_Planning/FeatureServer/3';

const downloadUrl = 'https://gis.columbiacountymaps.com/annex_images/';

const directory = 'docs/';

const vernoniaSpatialExtent = {
  rings: [
    [
      [606952.056605339, 1490512.4505739063],
      [606952.056605339, 1529343.4065166563],
      [650728.9227023721, 1529343.4065166563],
      [650728.9227023721, 1490512.4505739063],
      [606952.056605339, 1490512.4505739063],
    ],
  ],
  spatialReference: { wkid: 102970, latestWkid: 6557 },
};

/**
 * Convert tiff to pdf.
 * @param {*} fileName
 * @returns
 */
const tiff2pdf = (fileName) => {
  const parts = fileName.split('.');

  if (parts[1] !== 'tif' && parts[1] !== 'tiff') {
    console.log(chalk.red(`${fileName} is not a tiff file.`));
    return;
  }

  exec(`tiff2pdf -z -o ${directory}${parts[0]}.pdf ${directory}${fileName}`, (error) => {
    if (error) {
      console.log(chalk.red(`${fileName} conversion failed.`, error));
    } else {
      fs.remove(`${directory}${fileName}`);
    }
  });
};

/**
 * Write file.
 * @param {*} fileName
 * @param {*} data
 */
const fileWrite = (fileName, data) => {
  fs.writeFile(`${directory}${fileName}`, data)
    .then(() => {
      console.log(chalk.yellow(`${fileName} written.`));
      tiff2pdf(fileName);
    })
    .catch((error) => {
      console.log(chalk.red(`${fileName} write failed.`, error));
    });
};

/**
 * Download file.
 * @param {*} fileName
 */
const fileDownload = (fileName) => {
  download(`${downloadUrl}${fileName}`)
    .then((data) => {
      console.log(chalk.yellow(`${fileName} downloaded.`));
      fileWrite(fileName, data);
    })
    .catch((error) => {
      console.log(chalk.red(`${fileName} download failed.`, error));
    });
};

/**
 * Check if file already exists.
 * @param {*} feature
 */
const fileCheck = (feature) => {
  const {
    properties: { IMAGE: fileName },
  } = feature;

  const parts = fileName.split('.');

  const pdfFileName = `${parts[0]}.pdf`;

  fs.pathExists(`${directory}${pdfFileName}`)
    .then((exists) => {
      if (!exists) {
        console.log(chalk.yellow(`Downloading ${fileName} from ${downloadUrl}${fileName}.`));
        fileDownload(fileName);
      }
    })
    .catch((error) => {
      console.log(chalk.red(`File: ${pdfFileName} exists error.`, error));
    });
};

/**
 * Query features.
 */
queryFeatures({
  url: serviceUrl,
  geometry: vernoniaSpatialExtent,
  spatialRel: 'esriSpatialRelIntersects',
  geometryType: 'esriGeometryPolygon',
  outFields: ['*'],
  orderByFields: ['IMAGE ASC'],
  returnGeometry: true,
  outSR: '4326',
  f: 'geojson',
})
  .then((results) => {
    console.log(chalk.yellow(`${results.features.length} results`));

    fs.writeFile('vernonia-annexations.geojson', JSON.stringify(results)).catch((error) => {
      console.log(chalk.red(`GeoJSON write failed.`, error));
    });

    results.features.forEach(fileCheck);
  })
  .catch((error) => {
    console.log('Query features failed.', error);
    // console.log(error.response);
  });
