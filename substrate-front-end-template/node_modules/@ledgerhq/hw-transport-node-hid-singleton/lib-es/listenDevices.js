import usbDetect from "usb-detection";
import { ledgerUSBVendorId } from "@ledgerhq/devices";
import { log } from "@ledgerhq/logs";

const deviceToLog = ({
  productId,
  locationId,
  deviceAddress
}) => `productId=${productId} locationId=${locationId} deviceAddress=${deviceAddress}`;

let usbDebounce = 1000;
export const setUsbDebounce = n => {
  usbDebounce = n;
};
let monitoring = false;

const monitor = () => {
  if (!monitoring) {
    monitoring = true;
    usbDetect.startMonitoring();
  }

  return () => {};
}; // No better way for now. see https://github.com/LedgerHQ/ledgerjs/issues/434


process.on("exit", () => {
  if (monitoring) {
    // redeem the monitoring so the process can be terminated.
    usbDetect.stopMonitoring();
  }
});
export const listenDevices = (onAdd, onRemove) => {
  const unmonitor = monitor();
  const addEvent = "add:" + ledgerUSBVendorId;
  const removeEvent = "remove:" + ledgerUSBVendorId;
  let timeout;

  const add = device => {
    log("usb-detection", "add: " + deviceToLog(device));

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
    log("usb-detection", "remove: " + deviceToLog(device));

    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    } else {
      onRemove(device);
    }
  };

  usbDetect.on(addEvent, add);
  usbDetect.on(removeEvent, remove);
  return () => {
    if (timeout) clearTimeout(timeout);
    usbDetect.off(addEvent, add);
    usbDetect.off(removeEvent, remove);
    unmonitor();
  };
};
//# sourceMappingURL=listenDevices.js.map