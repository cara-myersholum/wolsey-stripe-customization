/**
 * @copyright 2022 Myers-Holum Inc.
 * @author
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

/* eslint-disable */

import * as record from 'N/record';
import * as error from 'N/error';
import * as log from 'N/log';

// This class abstracts a NetSuite Custom Record
export abstract class CustomRecord {
    protected recordId: number;
    protected recordValues: any;

    protected constructor(protected recordType: string) {

    }

    // Get the internalid of the record
    get Id(): number {
        return this.recordId;
    }

    protected abstract get Lookup(): any;

    // Get the field IDs of the record
    protected get RecordValues(): any {
        if (this.recordId > 0) {
            if (this.recordValues) {

            } else {

                this.recordValues = this.Lookup;
                log.audit(`${this.recordType} - LookupValuess`, this.recordValues);
            }
        }
        return this.recordValues;
    }

    // Set the field values of the record
    protected setFieldValue(updateValues: any): number {
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

export interface TextValue {
    value: string;
    text: string;
}
