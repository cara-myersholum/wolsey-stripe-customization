/**
 * @copyright 2022 Myers-Holum Inc.
 * @author
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 */
define(["require", "exports", "N/record", "N/log"], function (require, exports, record, log) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CustomRecord = void 0;
    // This class abstracts a NetSuite Custom Record
    class CustomRecord {
        constructor(recordType) {
            this.recordType = recordType;
        }
        // Get the internalid of the record
        get Id() {
            return this.recordId;
        }
        // Get the field IDs of the record
        get RecordValues() {
            if (this.recordId > 0) {
                if (this.recordValues) {
                }
                else {
                    this.recordValues = this.Lookup;
                    log.audit(`${this.recordType} - LookupValuess`, this.recordValues);
                }
            }
            return this.recordValues;
        }
        // Set the field values of the record
        setFieldValue(updateValues) {
            let returnValue = -1;
            if (+this.recordId > 0) {
                returnValue = record.submitFields({
                    type: this.recordType,
                    id: parseFloat(`${this.recordId}`).toFixed(0),
                    values: updateValues
                });
            }
            return returnValue;
        }
    }
    exports.CustomRecord = CustomRecord;
});
