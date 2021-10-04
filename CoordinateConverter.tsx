import proj4 from "proj4"
import { LLtoMGRS, mgrsToPoint } from "./mgrs"

export const CoordinateConverter = (from: string, to: string, value: string) => {
  //'51°28′40″N, 000°00′05″W
  //DD>DMS
  from = from.toUpperCase()
  to = to.toUpperCase()

  if (from === "DD") {
    let [lat, long] = value.split(",")
    let zone
    let utmProj
    let latlngProj
    let coords

    if (+lat > 90 || +lat < -90) throw new Error("Degrees of latitude must be a decimal number between 90 and -90")
    if (+long > 180 || +long < -180) throw new Error("Degrees of longitude must be a decimal number between 180 and -180")

    if (to === "DMS") {
      return `${toLat(+lat, "dms", 0)}, ${toLon(+long, "dms", 0)}`
    }
    if (to === "MGRS") {
      zone = getUTMzone(+lat, +long)
      utmProj = getUTMprojString(`${lat}`, `${long}`, "WGS84")
      latlngProj = getLatLongProjString("WGS84")
      coords = doConversion(latlngProj, utmProj, `${long}`, `${lat}`, `${zone}`, +lat <= 0 ? "1" : "0")
      return `${coords.nato.lngZone + coords.nato.latZone} ${coords.nato.digraph} ${coords.nato.easting} ${coords.nato.northing}`
    }
    if (to === "DD") return value
  }
  if (from === "DMS") {
    let latlon = value.split(",")
    let latParts = latlon[0].split(/[ °′″]/)
    let lonParts = latlon[1].trimStart().split(/[ °′″]/)

    //degrees is 0 to 90
    let dLat: number = +latParts[0]
    if (dLat > 90 || dLat < 0) throw new Error("Degrees of latitude must be a whole number between 0 and 90")
    //minutes is 0-60
    let mLat: number = +latParts[1]
    if (mLat >= 60 || mLat < 0) throw new Error("Minutes of latitude must be a whole number between 0 - 60")
    //seconds is 0-60
    let sLat: number = +latParts[2]
    if (sLat >= 60 || sLat < 0) throw new Error("Seconds of latitude must be a whole number between 0 - 60")

    let dirLat = latParts[3]
    if (dirLat !== "N" && dirLat !== "S") throw new Error("Direction of latitude must be either North (N) or South (S)")

    let dLong: number = +lonParts[0]
    if (dLong > 180 || dLong < 0) throw new Error("Degrees of longitude must be a whole number between 0 and 180")
    //minutes is 0-60
    let mLong: number = +lonParts[1]
    if (mLong >= 60 || mLong < 0) throw new Error("Minutes of longitude must be a whole number between 0 - 60")
    //seconds is 0-60
    let sLong: number = +lonParts[2]
    if (sLong >= 60 || sLong < 0) throw new Error("Seconds of longitude must be a whole number between 0 - 60")

    let dirLong = lonParts[3]
    if (dirLong !== "E" && dirLong !== "W") throw new Error("Direction of longitude must be either East (E) or West (W)")
    //NEED TO RE-EXAMINE, LENDING TO A CERTAIN DEGREE OF ERROR AT THE 4TH DECIMAL PLACE
    else if (to === "DD") {
      let lat = dLat + mLat / 60 + sLat / 3600
      if (dirLat === "S") lat = -lat
      let long = dLong + mLong / 60 + sLong / 3600
      if (dirLong === "W") long = -long
      return `${Math.round(parseDMS(`${lat}`) * 10000) / 10000}, ${Math.round(parseDMS(`${long}`) * 10000) / 10000}`
    } else if (to === "MGRS") {
      let lat = parseDMS(latlon[0])
      let lon = parseDMS(latlon[1])
      var zone = getUTMzone(lat, lon)
      var utmProj = getUTMprojString(`${lat}`, `${lon}`, "WGS84")
      var latlngProj = getLatLongProjString("WGS84")
      var coords = doConversion(latlngProj, utmProj, `${lon}`, `${lat}`, `${zone}`, "0")
      return `${coords.nato.lngZone + coords.nato.latZone} ${coords.nato.digraph} ${coords.nato.easting} ${coords.nato.northing}`
    } else if (to === "DMS") return value
    else throw new Error("Invalid conversion: " + from + " to " + to)
  } else if (from === "MGRS") {
    let parts = decodeMgrsString(value)
    let point = convertNATO(parts.easting, parts.northing, `${parts.lngZone}`, parts.latZone, parts.digraph)

    if (to === "DMS") {
      let lat = toLat(+point![1], "DMS", 0)
      let long = toLon(+point![0], "DMS", 0)
      return `${lat}, ${long}`
    } else if (to === "DD") {
      let lat = toDMS(+point![1], "D", 4)
      let long = toDMS(+point![0], "D", 4)
      return `${lat}, ${long}`
    } else if (to === "MGRS") return value
    else throw new Error("Invalid conversion: " + from + " to " + to)
  } else throw new Error("Unsupported conversion: " + from + " to " + to) 
}

///
/// convert a set of UTM coordinates into the various other formats.  checks input for validity
/// before calling the various conversion routines.
///
// function convertUTM(easting: string, northing: string, zone: string, southern: string, ellipsoid: string = "WGS84") {
//   if (isNaN(+easting) || isNaN(+northing)) {
//     alert("Easting and northing must both be valid floating point numbers");
//     return;
//   }

//   if (isNaN(+zone)) {
//     alert("Zone must be a valid integer");
//     return;
//   }

//   if (+zone < 1 || +zone > 60) {
//     alert("Longitude zone must be between 1 and 60");
//     return;
//   }

//   if (+northing < 0 || +northing > 10000000) {
//     alert("Northing must be between 0 and 10000000");
//     return;
//   }

//   if (+easting < 160000 || +easting > 834000) {
//     alert("Easting coordinate crosses zone boundries, results should be used with caution");
//   }

//   var utmProj =
//     "+proj=utm +zone=" + zone + " +units=m +ellps=" + ellipsoid + (southern ? " +south +no_defs" : " +no_defs");
//   var latlngProj = getLatLngProjString(ellipsoid);

//   return doConversion(utmProj, latlngProj, easting, northing, zone, southern);
// }

///
/// convert a set of NATO UTM coordinates to the various other formats.  does input validity
/// checking prior to calling the conversion routines.
/// exported for testing
export function convertNATO(easting: string, northing: string, lonZone: string, latZone: string, digraph: string, ellipsoid: string = "WGS84") {
  digraph = digraph.toUpperCase()
  latZone = latZone.toUpperCase()

  if (easting.includes(".") || northing.includes(".")) {
    throw new Error("Easting and northing must be integers")
  }

  if (isNaN(+easting) || isNaN(+northing) || isNaN(+lonZone)) {
    throw new Error("Easting, northing and longitude zone must all be valid numbers")
  }

  if (+lonZone < 1 || +lonZone > 60) {
    throw new Error("Longitude zone must be between 1 and 60")
  }

  if (+easting < 0 || +easting > 100000 || +northing < 0 || +northing > 100000) {
    throw new Error("Easting and northing values must be between 0 and 100000")
  }

  if (easting.length !== northing.length) {
    throw new Error("Easting and northing must have the same length")
  }

  if (digraph.length !== 2) {
    throw new Error("Digraphs must be two characters in length")
  }

  if (latZone.length !== 1) {
    throw new Error("Latitude zone must be 1 character only")
  }

  var eltr = digraph.charAt(0)
  var nltr = digraph.charAt(1)

  if (eltr < "A" || eltr > "Z" || nltr < "A" || nltr > "Z") {
    throw new Error("Digraph must consist of letters only")
  }

  if (latZone < "A" || latZone > "Z") {
    throw new Error("Latitude zone must consist of a single letter")
  }

  if (eltr === "I" || eltr === "O") {
    throw new Error("I and O are not valid first characters for a digraph")
  }

  if (nltr >= "W") {
    throw new Error("W, X, Y and Z are not valid second letters for a digraph")
  }

  //
  // convert mgrs string to lat/lon.
  //
  var mgrsString = lonZone + latZone + digraph + easting + northing
  var point = mgrsToPoint(mgrsString)
  return point
}

///
/// convert a lat, lng position to the appropriate UTM zone
/// exported for testing
export const getUTMzone = (lat: number, lng: number) => {
  // exceptions around Norway
  if (lat >= 56 && lat < 64 && lng >= 3 && lng < 12) return 32

  // exceptions around Svalbard
  if (lat >= 72 && lat < 84) {
    if (lng >= 0 && lng < 9) return 31
    if (lng >= 9 && lng < 21) return 33
    if (lng >= 21 && lng < 33) return 35
    if (lng >= 33 && lng < 42) return 37
  }
  return Math.floor((lng + 180) / 6) + 1
}

function getLatLongProjString(ellipsoid: string) {
  var proj = "+proj=longlat +ellps=" + ellipsoid + " +units=m +no_defs"
  return proj
}

function getUTMprojString(lat: string, lng: string, ellipsoid: string) {
  var zone = getUTMzone(+lat, +lng)
  var proj = "+proj=utm +zone=" + zone + " +ellps=" + ellipsoid
  if (+lat < 0) proj = proj + " +south"

  proj = proj + " +no_defs"

  return proj
}

export function doConversion(from: string, to: string, x: string, y: string, zone: string, south: string) {
  var isWGS = from.includes("WGS84")
  var srcLL = from.includes("longlat")
  var proj = proj4(from, to)
  var point = proj4.toPoint([+x, +y])
  var results = proj.forward(point)
  let rv
  let natoMgrs

  if (srcLL) {
    if (isWGS) {
      natoMgrs = decodeMgrsString(LLtoMGRS([+x, +y]))
      rv = {
        global: { easting: Math.round(results.x), northing: Math.round(results.y), zone: zone, southern: south },
        nato: {
          easting: natoMgrs.easting,
          northing: natoMgrs.northing,
          lngZone: natoMgrs.lngZone,
          latZone: natoMgrs.latZone,
          digraph: natoMgrs.digraph,
        },
      }
      return rv
    } else {
      rv = {
        global: { easting: Math.round(results.x), northing: Math.round(results.y), zone: zone, southern: south },
        nato: { easting: "", northing: "", lngZone: "", latZone: "", digraph: "" },
      }
      return rv
    }
  } else {
    if (isWGS) {
      natoMgrs = decodeMgrsString(LLtoMGRS([results.x, results.y]))
      rv = {
        latlng: { lng: results.x, lat: results.y },
        nato: {
          easting: natoMgrs.easting,
          northing: natoMgrs.northing,
          lngZone: natoMgrs.lngZone,
          latZone: natoMgrs.latZone,
          digraph: natoMgrs.digraph,
        },
      }
      return rv
    } else {
      rv = {
        latlng: { lng: results.x, lat: results.y },
        nato: { easting: "", northing: "", lngZone: "", latZone: "", digraph: "" },
      }
      return rv
    }
  }
}

///
/// lifted in part from proj4.js mgrs.decode
/// extract the various values (zone, lat band, digraph, easting, northing) from
/// an mgrs string
/// exported for testing
export const decodeMgrsString = (mgrsString: string) => {
  //remove any spaces in MGRS String
  mgrsString = mgrsString.replace(/ /g, "").toUpperCase()

  var sb = ""
  var i = 0
  var length = mgrsString.length

  while (!/[A-Z]/.test(mgrsString.charAt(i))) {
    var testChar = mgrsString.charAt(i)
    if (i >= 2) {
      throw new Error("MGRSPoint bad conversion from: " + mgrsString)
    }
    sb += testChar
    i++
  }
  var zoneNumber = parseInt(sb, 10)

  if (i === 0 || i + 3 > length) {
    // A good MGRS string has to be 4-5 digits long,
    // ##AAA/#AAA at least.
    throw new Error("MGRSPoint min length not met: " + mgrsString)
  }

  var zoneLetter = mgrsString.charAt(i++)

  // Should we check the zone letter here? Why not.
  if (zoneLetter <= "A" || zoneLetter === "B" || zoneLetter === "Y" || zoneLetter >= "Z" || zoneLetter === "I" || zoneLetter === "O") {
    throw new Error("MGRSPoint zone letter " + zoneLetter + " not handled: " + mgrsString)
  }

  var digraph = mgrsString.substring(i, (i += 2))

  var remainder = length - i

  if (remainder % 2 !== 0) {
    throw new Error("MGRSPoint has to have an even number \nof digits after the zone letter and two 100km letters - front \nhalf for easting meters, second half for \nnorthing meters " + mgrsString)
  }

  var sep = remainder / 2

  var sepEasting = "0.0"
  var sepNorthing = "0.0"
  sepEasting = mgrsString.substring(i, i + sep)
  sepNorthing = mgrsString.substr(i + sep)

  return { lngZone: zoneNumber, latZone: zoneLetter, digraph: digraph, easting: sepEasting, northing: sepNorthing }
}

const toLon = (deg: number, format: string, dp: number) => {
  var lon = toDMS(deg, format, dp)!
  return lon + (deg < 0 ? "W" : "E")
}

const toLat = (deg: number, format: string, dp: number) => {
  var lat = toDMS(deg, format, dp)!
  return lat.slice(1) + (deg < 0 ? "S" : "N") // knock off initial '0' for lat!
}

const round = (val: number, power: number) => {
  return Math.round(val * Math.pow(10, power)) / Math.pow(10, power)
}

///exported for testing
export const toDMS = (deg: number, format: string, dp: number) => {
  if (typeof deg == "object") throw new TypeError("deg is [DOM?] object")
  if (isNaN(deg)) throw new Error("deg must be a number") // give up here if we can't make a number from deg
  format = format.toLowerCase()

  deg = Math.abs(deg) // (unsigned result ready for appending compass dir'n)
  let d: string
  let m: string
  let s: string

  switch (format) {
    case "d":
      d = `${round(deg, dp)}`
      // round degrees
      return d + "\u00B0" // add º symbol
    case "dm":
      var min = round(deg * 60, dp) // convert degrees to minutes & round
      d = `${Math.floor(min / 60)}` // get component deg/min
      m = `${round(min % 60, dp)}`
      return d + "\u00B0" + m + "\u2032" // add º, ' symbols
    case "dms":
      var sec = round(deg * 3600, dp) // convert degrees to seconds & round
      d = `${Math.floor(sec / 3600)}` // get component deg/min/sec
      m = `${Math.floor(sec / 60) % 60}`
      s = `${round(sec % 60, dp)}`
      return d.padStart(3, "0") + "\u00B0" + m.padStart(2, "0") + "\u2032" + s.padStart(2, "0") + "\u2033" // add º, ', " symbols
  }
}

///exported for testing
export const parseDMS = (dmsStr: string) => {
  // check for signed decimal degrees without NSEW, if so return it directly
  if (typeof dmsStr === "number" && isFinite(dmsStr)) return Number(dmsStr)

  // strip off any sign or compass dir'n & split out separate d/m/s
  var dms = String(dmsStr)
    .trim()
    .replace(/^-/, "")
    .replace(/[NSEW]$/i, "")
    .split(/[^0-9.,]+/)
  if (dms[dms.length - 1] === "") dms.splice(dms.length - 1) // from trailing symbol

  let deg

  // and convert to decimal degrees...
  switch (dms.length) {
    case 3: // interpret 3-part result as d/m/s
      deg = +dms[0] / 1 + +dms[1] / 60 + +dms[2] / 3600
      break
    case 2: // interpret 2-part result as d/m
      deg = +dms[0] / 1 + +dms[1] / 60
      break
    case 1: // just d (possibly decimal) or non-separated dddmmss
      deg = +dms[0]
      // check for fixed-width unseparated format eg 0033709W
      //if (/[NS]/i.test(dmsStr)) deg = '0' + deg;  // - normalise N/S to 3-digit degrees
      //if (/[0-9]{7}/.test(deg)) deg = deg.slice(0,3)/1 + deg.slice(3,5)/60 + deg.slice(5)/3600;
      break
    default:
      return NaN
  }
  if (/^-|[WS]$/i.test(dmsStr.trim())) deg = -deg // take '-', west and south as -ve
  return Number(deg)
}

///TODO: UTM TO MGRS
