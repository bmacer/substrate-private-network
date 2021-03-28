"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.listenDevices = exports.setUsbDebounce = void 0;

var _usbDetection = _interopRequireDefault(require("usb-detection"));

var _devices = require("@ledgerhq/devices");

var _logs = require("@ledgerhq/logs");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const deviceToLog = ({
  productId,
  locationId,
  deviceAddress
}) => `productId=${productId} locationId=${locationId} deviceAddress=${deviceAddress}`;

let usbDebounce = 1000;

const setUsbDebounce = n => {
  usbDebounce = n;
};

exports.setUsbDebounce = setUsbDebounce;
let monitoring = false;

const monitor = () => {
  if (!monitoring) {
    monitoring = true;

    _usbDetection.default.startMonitoring();
  }

  return () => {};
}; // No better way for now. see https://github.com/LedgerHQ/ledgerjs/issues/434


process.on("exit", () => {
  if (monitoring) {
    // redeem the monitoring so the process can be terminated.
    _usbDetection.default.stopMonitoring();
  }
});

const listenDevices = (onAdd, onRemove) => {
  const unmonitor = monitor();
  const addEvent = "add:" + _devices.ledgerUSBVendorId;
  const removeEvent = "remove:" + _devices.ledgerUSBVendorId;
  let timeout;

  const add = device => {
    (0, _logs.log)("usb-detection", "add: " + deviceToLog(device));

    if (!timeout) {
      // a time is needed for the device to actually be connectable over HID..
      // we also take this time to not emit the device yet and potentially cancel it if a remove happens.
      timeout = setTimeout(() => {
        onAdd(device);
        timeout = null;
      }, usbDebounce);
    }
  };

  const remove = device => {
    (0, _logs.log)("usb-detection", "remove: " + deviceToLog(device));

    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    } else {
      onRemove(device);
    }
  };

  _usbDetection.default.on(addEvent, add);

  _usbDetection.default.on(removeEvent, remove);

  return () => {
    if (timeout) clearTimeout(timeout);

    _usbDetection.default.off(addEvent, add);

    _usbDetection.default.off(removeEvent, remove);

    unmonitor();
  };
};

exports.listenDevices = listenDevices;
//# sourceMappingURL=listenDevices.js.map