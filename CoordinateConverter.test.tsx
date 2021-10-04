import { convertNATO, CoordinateConverter, decodeMgrsString, doConversion, getUTMzone, parseDMS, toDMS } from "./CoordinateConverter"

describe("the coordinate conversion", () => {
  it("Can convert from DMS to DD", () => {
    expect(CoordinateConverter("DMS", "DD", "09°11′51″N, 012°39′15″E")).toBe("9.1975, 12.6542")
    expect(CoordinateConverter("DMS", "DD", "09 11 51 S, 012 39 15 E")).toBe("-9.1975, 12.6542")
    expect(CoordinateConverter("DMS", "DD", "09 11 51 N, 012 39 15 W")).toBe("9.1975, -12.6542")
  })
  it("Can convert from DD to DMS", () => {
    expect(CoordinateConverter("DD", "DMS", "9.1975, 12.6542")).toBe("09°11′51″N, 012°39′15″E")
    expect(CoordinateConverter("DD", "DMS", "-9.1975, 12.6542")).toBe("09°11′51″S, 012°39′15″E")
    expect(CoordinateConverter("DD", "DMS", "9.1975, -12.6542")).toBe("09°11′51″N, 012°39′15″W")
  })
  it("Can convert from DD to MGRS", () => {
    expect(CoordinateConverter("DD", "MGRS", "9.1977,12.6543")).toBe("33P TL 42247 17553")
    expect(CoordinateConverter("DD", "MGRS", "-9.1977,12.6543")).toBe("33L TK 42247 82446")
  })
  it("Can convert from DMS to MGRS", () => {
    expect(CoordinateConverter("DMS", "MGRS", "09°11′51.72″N, 012°39′15.48″E")).toBe("33P TL 42247 17553")
  })

  it("Can convert from MGRS to DD", () => {
    expect(CoordinateConverter("MGRS", "DD", "33P TL 42247 17553")).toBe("9.1977°, 12.6543°")
  })
  it("Can convert from MGRS to DMS", () => {
    expect(CoordinateConverter("MGRS", "DMS", "33P TL 42247 17553")).toBe("09°11′52″N, 012°39′15″E")
  })
  it("has complete error handling and test coverage", () => {
    expect(() => {
      CoordinateConverter("DD", "DMS", "99.1977,12.4586")
    }).toThrowError("Degrees of latitude must be a decimal number between 90 and -90")
    expect(() => {
      CoordinateConverter("DD", "DMS", "9.1977,912.4586")
    }).toThrowError("Degrees of longitude must be a decimal number between 180 and -180")
    expect(() => {
      CoordinateConverter("DD", "DMG", "9.1977,12.4586")
    }).toThrowError("Unsupported conversion: DD to DMG")
    expect(() => {
      CoordinateConverter("DMS", "DD", "99°11′51″N, 012°39′15″E")
    }).toThrowError("Degrees of latitude must be a whole number between 0 and 90")
    expect(() => {
      CoordinateConverter("DMS", "DD", "9°111′51″N, 012°39′15″E")
    }).toThrowError("Minutes of latitude must be a whole number between 0 - 60")
    expect(() => {
      CoordinateConverter("DMS", "DD", "9°11′511″N, 012°39′15″E")
    }).toThrowError("Seconds of latitude must be a whole number between 0 - 60")
    expect(() => {
      CoordinateConverter("DMS", "DDL", "09°11′51″N, 12°39′15″E")
    }).toThrowError("Invalid conversion: DMS to DDL")
    expect(() => {
      CoordinateConverter("DMS", "DD", "09°11′51″N, 912°39′15″E")
    }).toThrowError("Degrees of longitude must be a whole number between 0 and 180")
    expect(() => {
      CoordinateConverter("DMS", "DD", "09°11′51″N, 12°139′15″E")
    }).toThrowError("Minutes of longitude must be a whole number between 0 - 60")
    expect(() => {
      CoordinateConverter("DMS", "DD", "09°11′51″N, 12°39′115″E")
    }).toThrowError("Seconds of longitude must be a whole number between 0 - 60")
    expect(() => {
      CoordinateConverter("DMS", "DD", "09°11′51″D, 012°39′15″E")
    }).toThrowError("Direction of latitude must be either North (N) or South (S)")
    expect(() => {
      CoordinateConverter("DMS", "DD", "09°11′51″N, 012°39′15″D")
    }).toThrowError("Direction of longitude must be either East (E) or West (W)")
    expect(() => {
      CoordinateConverter("MGRS", "DD", "33P TL 422.47 1755.3")
    }).toThrowError("Easting and northing must be integers")
    expect(() => {
      CoordinateConverter("MGRS", "DDL", "33P TL 42247 17553")
    }).toThrowError("Invalid conversion: MGRS to DDL")
    expect(() => {
      CoordinateConverter("MGRS", "DD", "33P TL 422.47 17553")
    }).toThrowError("MGRSPoint has to have an even number")
    expect(() => {
      CoordinateConverter("MGRS", "DD", "33P TL 4a247 17553")
    }).toThrowError("Easting, northing and longitude zone must all be valid numbers")
    expect(() => {
      CoordinateConverter("MGRS", "DD", "33P TL 42247 1a553")
    }).toThrowError("Easting, northing and longitude zone must all be valid numbers")
    expect(() => {
      CoordinateConverter("MGRS", "DD", "_3P TL 42247 17553")
    }).toThrowError("Easting, northing and longitude zone must all be valid numbers")
    expect(() => {
      CoordinateConverter("MGRS", "DD", "63P TL 42247 17553")
    }).toThrowError("Longitude zone must be between 1 and 60")
    expect(() => {
      CoordinateConverter("MGRS", "DD", "-3P TL 42247 17553")
    }).toThrowError("Longitude zone must be between 1 and 60")
    expect(() => {
      convertNATO("-10000", "17553", "33", "P", "TL")
    }).toThrowError("Easting and northing values must be between 0 and 100000")
    expect(() => {
      convertNATO("10000", "-17553", "33", "P", "TL")
    }).toThrowError("Easting and northing values must be between 0 and 100000")
    expect(() => {
      convertNATO("10000", "7553", "33", "P", "TL")
    }).toThrowError("Easting and northing must have the same length")
    expect(() => {
      convertNATO("10000", "17553", "33", "P", "L")
    }).toThrowError("Digraphs must be two characters in length")
    expect(() => {
      convertNATO("10000", "17553", "33", "PT", "TL")
    }).toThrowError("Latitude zone must be 1 character only")
    expect(() => {
      convertNATO("10000", "17553", "33", "_", "TL")
    }).toThrowError("Latitude zone must consist of a single letter")
    expect(() => {
      convertNATO("10000", "17553", "33", "P", "_L")
    }).toThrowError("Digraph must consist of letters only")
    expect(() => {
      convertNATO("10000", "17553", "33", "P", "IL")
    }).toThrowError("I and O are not valid first characters for a digraph")
    expect(() => {
      convertNATO("10000", "17553", "33", "P", "TW")
    }).toThrowError("W, X, Y and Z are not valid second letters for a digraph")
    expect(() => {
      CoordinateConverter("DD", "DMS", "99.1977,12.4586")
    }).toThrowError("Degrees of latitude must be a decimal number between 90 and -90")
    expect(getUTMzone(60, 4)).toBe(32)
    expect(getUTMzone(80, 0)).toBe(31)
    expect(getUTMzone(80, 10)).toBe(33)
    expect(getUTMzone(80, 25)).toBe(35)
    expect(getUTMzone(80, 34)).toBe(37)
    expect(getUTMzone(800, 34)).toBe(36)
    expect(getUTMzone(80, 304)).toBe(81)
    var to = "+proj=longlat +ellps=WGS84 +units=m +no_defs"
    var from = "+proj=utm +zone=33 +ellps=WGS84 +no_defs"
    var coords = doConversion(from, to, "9.1977", "12.4586", "33", "0")
    expect(coords).toMatchObject({ latlng: { lat: 0.00011236880823142845, lng: 10.51133851777266 }, nato: { digraph: "PF", easting: "68193", latZone: "N", lngZone: 32, northing: "00012" } })
    coords = doConversion("+proj=longlat +ellps=NAD83 +units=m +no_defs", "+proj=utm +zone=33 +ellps=NAD83 +no_defs", "9.1977", "12.4586", "33", "0")
    expect(coords).toMatchObject({ global: { easting: -131531, northing: 1384182, southern: "0", zone: "33" }, nato: { digraph: "", easting: "", latZone: "", lngZone: "", northing: "" } })
    coords = doConversion("+proj=utm +zone=33 +ellps=NAD83 +no_defs", "+proj=utm +zone=33 +ellps=NAD83 +no_defs", "9.1977", "12.4586", "33", "0")
    expect(coords).toMatchObject({ latlng: { lat: 12.458599999999995, lng: 9.197700000426266 }, nato: { digraph: "", easting: "", latZone: "", lngZone: "", northing: "" } })
    expect(() => decodeMgrsString("a")).toThrowError("MGRSPoint min length not met: A")
    expect(() => decodeMgrsString("22A TL 3 3")).toThrowError("MGRSPoint zone letter A not handled: 22ATL33")
    expect(() => decodeMgrsString("33P")).toThrowError("MGRSPoint min length not met: 33P")
    expect(toDMS(180, "dm", 4)).toBe("180°0′")
    expect(() => toDMS(+"18-_0", "dm", 4)).toThrowError("deg must be a number")
    //@ts-ignore
    expect(() => toDMS({ deg: 0 }, "dm", 4)).toThrowError("deg is [DOM?] object")
    expect(parseDMS("09°11′″N")).toBe(9.183333333333334)
    //@ts-ignore
    expect(parseDMS(-90)).toBe(-90)
    expect(parseDMS("")).toBeNaN()
  })
})
