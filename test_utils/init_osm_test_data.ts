/* eslint-disable */
/* tslint:disable */
import * as fs from 'fs'
const { extractWithQuery, geocode } = require('osm-extractor');

// south Latitude, north Latitude, west Longitude, east Longitude -> s, w, n, e
const nominatimBBoxToOSM = (bbox: any[]) => [bbox[0], bbox[2], bbox[1], bbox[3]];

function initData() {
  geocode("Moscow").then((results: any[]) => {
    let bbox = nominatimBBoxToOSM(results[0].boundingbox).join(', ')
    const query = [
      '[out:json][timeout:25]; ',
      '(',
      ` node["shop"](${bbox});`,
      //` way["shop"](${bbox});`,
      //` relation["shop"](${bbox});`,
      '); ',
      'out body; >; out skel qt;'
    ].join('')

    return extractWithQuery(query)
      .then((data: any) => {
        data.pipe(fs.createWriteStream("test_utils/data_osm.json"))
      })
      .catch((err: any) => console.error(err))
  })
}

initData();
/* tslint:enable */
/* eslint-enable */