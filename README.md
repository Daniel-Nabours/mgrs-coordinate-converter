# mgrs-coordinate-converter
A proj4 powered utility for converting between UTM and WGS84 coordinate systems

```
let convertedCoord:string = CoordinateConverter("DD", "MGRS", "10, 10")
assert.equal("32P PS 09600 05578", convertedCoord) //true
```

## Parameters
| Param | Description |
| ----------- | ----------- |
| from | "DD" "DM" "DMS" "MGRS" |
| to | "DD" "DM" "DMS" "MGRS" |
| value | coordinate string that corresponds to the "from" value, supports most coordinate string formats |
