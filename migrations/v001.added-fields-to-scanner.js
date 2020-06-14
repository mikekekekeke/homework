const Scanner = require('../modules/scanner/scanner.model');
const ScannerService = require('../modules/scanner/scanner.service');

module.exports = {
    up() {
        return Scanner.updateMany(
          { coordinates: { $exists: false }, status: { $exists: false } },
          { $set: { coordinates: ScannerService.getUnknownScannerCoordinates(), status: ScannerService.getDefaultScannerStatus() }},
          { multi: true },
        )
    },
    down() {
        return Scanner.updateMany(
          { coordinates: { $exists: true }, status: { $exists: true } },
          { $unset: { coordinates: '', status: '' }},
          { multi: true },
        )
    }
}
