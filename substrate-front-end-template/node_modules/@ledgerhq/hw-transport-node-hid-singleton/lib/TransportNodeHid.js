"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _nodeHid = _interopRequireDefault(require("node-hid"));

var _hwTransportNodeHidNoevents = _interopRequireWildcard(require("@ledgerhq/hw-transport-node-hid-noevents"));

var _logs = require("@ledgerhq/logs");

var _devices = require("@ledgerhq/devices");

var _errors = require("@ledgerhq/errors");

var _listenDevices = require("./listenDevices");

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let transportInstance;
/**
 * node-hid Transport implementation
 * @example
 * import TransportNodeHid from "@ledgerhq/hw-transport-node-hid-singleton";
 * ...
 * TransportNodeHid.create().then(transport => ...)
 */

class TransportNodeHidSingleton extends _hwTransportNodeHidNoevents.default {
  /**
   *
   */

  /**
   *
   */

  /**
   */

  /**
   * globally disconnect the transport singleton
   */
  static async disconnect() {
    if (transportInstance) {
      transportInstance.device.close();
      transportInstance.emit("disconnect");
      transportInstance = null;
    }
  }
  /**
   * if path="" is not provided, the library will take the first device
   */


  static open() {
    return Promise.resolve().then(() => {
      if (transportInstance) {
        (0, _logs.log)("hid-verbose", "reusing opened transport instance");
        return transportInstance;
      }

      const device = (0, _hwTransportNodeHidNoevents.getDevices)()[0];
      if (!device) throw new _errors.CantOpenDevice("no device found");
      (0, _logs.log)("hid-verbose", "new HID transport");
      transportInstance = new TransportNodeHidSingleton(new _nodeHid.default.HID(device.path));
      const unlisten = (0, _listenDevices.listenDevices)(() => {}, () => {
        // assume any ledger disconnection concerns current transport
        if (transportInstance) {
          transportInstance.emit("disconnect");
        }
      });

      const onDisconnect = () => {
        if (!transportInstance) return;
        (0, _logs.log)("hid-verbose", "transport instance was disconnected");
        transportInstance.off("disconnect", onDisconnect);
        transportInstance = null;
        unlisten();
      };

      transportInstance.on("disconnect", onDisconnect);
      return transportInstance;
    });
  }

  close() {
    // intentionally, a close will not effectively close the hid connection
    return Promise.resolve();
  }

}

exports.default = TransportNodeHidSingleton;
TransportNodeHidSingleton.isSupported = _hwTransportNodeHidNoevents.default.isSupported;
TransportNodeHidSingleton.list = _hwTransportNodeHidNoevents.default.list;

TransportNodeHidSingleton.listen = observer => {
  let unsubscribed;
  Promise.resolve((0, _hwTransportNodeHidNoevents.getDevices)()).then(devices => {
    // this needs to run asynchronously so the subscription is defined during this phase
    for (const device of devices) {
      if (!unsubscribed) {
        const deviceModel = (0, _devices.identifyUSBProductId)(device.productId);
        observer.next({
          type: "add",
          descriptor: "",
          device: {
            name: device.deviceName
          },
          deviceModel
        });
      }
    }
  });

  const onAdd = device => {
    const deviceModel = (0, _devices.identifyUSBProductId)(device.productId);
    observer.next({
      type: "add",
      descriptor: "",
      deviceModel,
      device: {
        name: device.deviceName
      }
    });
  };

  const onRemove = device => {
    const deviceModel = (0, _devices.identifyUSBProductId)(device.productId);
    observer.next({
      type: "remove",
      descriptor: "",
      deviceModel,
      device: {
        name: device.deviceName
      }
    });
  };

  const stop = (0, _listenDevices.listenDevices)(onAdd, onRemove);

  function unsubscribe() {
    stop();
    unsubscribed = true;
  }

  return {
    unsubscribe
  };
};
//# sourceMappingURL=TransportNodeHid.js.map