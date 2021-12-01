const fetch = require('node-fetch');
require('isomorphic-form-data');
const fs = require('fs-extra');
const { exec } = require('child_process');
const download = require('download');
const chalk = require('chalk');
const { setDefaultRequestOptions } = require('@esri/arcgis-rest-request');
const { queryFeatures } = require('@esri/arcgis-rest-feature-layer');

setDefaultRequestOptions({ fetch });

const serviceUrl =
  'https://gis.columbiacountymaps.com/server/rest/services/Land_Development/Land_Use_Planning/FeatureServer/3';

const downloadUrl = 'https://gis.columbiacountymaps.com/annex_images/';

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

  exec(`tiff2pdf -z -o ${parts[0]}.pdf ${fileName}`, (error) => {
    if (!error) {
      fs.remove(fileName);
    }
  });
};

/**
 * Write file.
 * @param {*} fileName
 * @param {*} data
 */
const fileWrite = (fileName, data) => {
  fs.writeFile(fileName, data)
    .then(async () => {
      console.log(chalk.yellow(`${fileName} written.`));
      await tiff2pdf(fileName);
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
    attributes: { IMAGE: fileName },
  } = feature;

  const parts = fileName.split('.');

  const pdfFileName = `${parts[0]}.pdf`;

  if (parts.length >= 3) return;

  // very large and corrupt file.
  if (fileName === '2017-02.tif') return;

  fs.pathExists(pdfFileName)
    .then((exists) => {
      if (exists) {
        console.log(chalk.green(`${pdfFileName} exists.`));
      } else {
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
  where: '1 = 1',
  outFields: ['IMAGE'],
  returnGeometry: false,
})
  .then((results) => {
    console.log(chalk.yellow(`${results.features.length} results`));
    results.features.forEach(fileCheck);
  })
  .catch((error) => {
    console.log(error);
    // console.log(error.response);
  });
