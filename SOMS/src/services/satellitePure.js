/**
 * Pure JavaScript wrapper for satellite.js (excluding WASM worker with top-level await)
 * Provides standard SGP4/SDP4 propagation, coordinate transforms, and look angle calculations.
 */

export * as constants from '../../node_modules/satellite.js/dist/constants.js'
export { jday, invjday } from '../../node_modules/satellite.js/dist/ext.js'
export { twoline2satrec, json2satrec } from '../../node_modules/satellite.js/dist/io.js'
export { propagate, sgp4, gstime } from '../../node_modules/satellite.js/dist/propagation.js'
export { checkForDecay } from '../../node_modules/satellite.js/dist/propagation/check-for-decay.js'
export { dopplerFactor } from '../../node_modules/satellite.js/dist/dopplerFactor.js'
export {
  radiansToDegrees,
  degreesToRadians,
  degreesLat,
  degreesLong,
  radiansLat,
  radiansLong,
  geodeticToEcf,
  eciToGeodetic,
  eciToEcf,
  ecfToEci,
  ecfToLookAngles
} from '../../node_modules/satellite.js/dist/transforms.js'
export { sunPos } from '../../node_modules/satellite.js/dist/sun.js'
export * from '../../node_modules/satellite.js/dist/shadow.js'
export { SatRecError } from '../../node_modules/satellite.js/dist/propagation/SatRec.js'
