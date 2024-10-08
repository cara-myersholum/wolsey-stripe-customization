/**
 * @copyright 2022 Myers-Holum Inc.
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

import * as record from 'N/record';
import * as search from 'N/search';
import * as log from 'N/log';
import * as format from 'N/format';
import {CustomRecord, TextValue} from './CustomRecord';

// This is the class used to load/create the Stripe Payment Event Custom Record

export class Stripe_Event_Log extends CustomRecord {
    // Declare the record id
    private static readonly RECORDID = 'customrecord_mhi_stripe_event_log';

    // Declare the field ids
    private static readonly FIELDID = {
        INVOICEID: 'custrecord_mhi_stripe_payment_invoice',
        INVOICEAMOUNT: 'custrecord_mhi_stripe_payment_invoiceamt',
        STRIPEPAYMENTID: 'custrecord_mhi_stripe_payment_id',
        STRIPEPAYMENTSTATUS: 'custrecord_mhi_stripe_payment_status',
        DATE: 'custrecord_mhi_stripe_payment_processdt',
        ERROR: 'custrecord_mhi_stripe_payment_error',
        ERRORMSG: 'custrecord_mhi_stripe_payment_error_msg'
    };

    constructor(options: EventConstructorOptions) {
        super(Stripe_Event_Log.RECORDID);
        log.debug('options', options);
        // If internalid is passed, use that
        if (options.recordId) {
            this.recordId = options.recordId;
        } else if (options.values) {

            // Create a new log
            let newEventRecord = record.create({
                    type: Stripe_Event_Log.RECORDID
                });
            // Set the values passed to the payment event
            if (options.values) {
                if (options?.values?.InvoiceId) {
                    newEventRecord.setValue({
                        fieldId: Stripe_Event_Log.FIELDID.INVOICEID,
                        value: options.values.InvoiceId
                    });
                }

                newEventRecord.setValue({
                    fieldId: Stripe_Event_Log.FIELDID.DATE,
                    value: new Date()
                });

                if (options?.values?.StripePaymentId) {
                    newEventRecord.setValue({
                        fieldId: Stripe_Event_Log.FIELDID.STRIPEPAYMENTID,
                        value: options.values.StripePaymentId
                    });
                }

                if (options?.values?.InvoiceAmount) {
                    newEventRecord.setValue({
                        fieldId: Stripe_Event_Log.FIELDID.INVOICEAMOUNT,
                        value: options.values.InvoiceAmount
                    });
                }

                if (options?.values?.StatusId) {
                    newEventRecord.setValue({
                        fieldId: Stripe_Event_Log.FIELDID.STRIPEPAYMENTSTATUS,
                        value: options.values.StatusId
                    });
                }

                if (options?.values?.Error) {
                    newEventRecord.setValue({
                        fieldId: Stripe_Event_Log.FIELDID.ERROR,
                        value: options.values.Error
                    });
                    newEventRecord.setValue({
                        fieldId: Stripe_Event_Log.FIELDID.STRIPEPAYMENTSTATUS,
                        value: Stripe_Event_Log_Status.FAIL
                    });

                }

                if (options?.values?.ErrorMsg) {
                    newEventRecord.setValue({
                        fieldId: Stripe_Event_Log.FIELDID.ERRORMSG,
                        value: options.values.ErrorMsg
                    });

                }


                this.recordId = newEventRecord.save();
            }

        }
    }

    // This function gets the field values of the payment event
    public get Lookup(): LookupResponse {
        return <LookupResponse>search.lookupFields({
            id: this.recordId,
            type: Stripe_Event_Log.RECORDID,
            columns: ['custrecord_mhi_stripe_payment_invoice', 'custrecord_mhi_stripe_payment_invoiceamt', 'custrecord_mhi_stripe_payment_id', 'custrecord_mhi_stripe_payment_status', 'custrecord_mhi_stripe_payment_processdt', 'custrecord_mhi_stripe_payment_error', 'custrecord_mhi_stripe_payment_error_msg']
        });
    }

    // This function fetches the last retry date
    public getLastRetryDate = (transactionId, paymentInterval): boolean => {
        let retryToday = true;

        // If a transaction id is passed, search for the date
        if (+transactionId > 0) {
            search.create({
                type: Stripe_Event_Log.RECORDID,
                filters:
                    [
                        ['custrecord_mhi_stripe_payment_invoice', 'anyof', transactionId]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: 'custrecord_mhi_stripe_payment_processdt',
                            sort: search.Sort.DESC,
                            label: 'Date'
                        })
                    ]
            }).run().each(result => {
                // Get the last retry date
                const lastRetryDate = <Date> format.parse({
                    value:`${result.getValue('custrecord_mhi_stripe_payment_processdt')}`,
                    type:format.Type.DATE
                });
                // Ignore the time portion
                lastRetryDate.setHours(0, 0, 0, 0);
                // Add the payment interval days
                lastRetryDate.setDate(lastRetryDate.getDate() + (+paymentInterval));

                // Get current date
                let currentDate = new Date();
                // Ignore the time portion
                currentDate.setHours(0, 0, 0, 0);

                // Compar the two dates
                if (lastRetryDate > currentDate ) {
                    retryToday = false;
                }

                return false;
            });
        }

        return retryToday;
    }


    public static updateStatus = (stripePaymentIntentId: string, statusId: number, error?: string, errorMsg?: string) => {
        search.create({
            type: Stripe_Event_Log.RECORDID,
            filters:
                [
                    [Stripe_Event_Log.FIELDID.STRIPEPAYMENTID,'is', stripePaymentIntentId]
                ]
        }).run().each(result => {
            const params: any = {custrecord_mhi_stripe_payment_status: statusId};
            if (error) {
                params.custrecord_mhi_stripe_payment_error = error;
            }
            if (errorMsg) {
                params.custrecord_mhi_stripe_payment_error_msg = errorMsg;
            }

            record.submitFields({type: Stripe_Event_Log.RECORDID, id: result.id, values: params });


            return true;
        });
    }

}

// Declare the possible payment event status
export const Stripe_Event_Log_Status = {
    PENDINGPAYMENT : 1,
    SUCCESS : 2,
    FAIL : 3
};

export interface EventConstructorOptions {
    recordId?: number;
    values?: {
        InvoiceId?: number;
        StripePaymentId?: string;
        InvoiceAmount?: number;
        StatusId?: number;
        Error?: string;
        ErrorMsg?: string;
    };
}

interface LookupResponse {
    custrecord_mhi_stripe_payment_invoice: TextValue[];
    custrecord_mhi_stripe_payment_invoiceamt: number;
    custrecord_mhi_stripe_payment_id: string;
    custrecord_mhi_stripe_payment_status: TextValue[];
    custrecord_mhi_stripe_payment_processdt: string;
    custrecord_mhi_stripe_payment_error: string;
    custrecord_mhi_stripe_payment_error_msg: string;
}
