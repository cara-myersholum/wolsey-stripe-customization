/**
 * @copyright 2022 Myers-Holum Inc.
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 */
define(["require", "exports", "N/record", "N/search", "N/log", "N/format", "./CustomRecord"], function (require, exports, record, search, log, format, CustomRecord_1) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Stripe_Event_Log_Status = exports.Stripe_Event_Log = void 0;
    // This is the class used to load/create the Stripe Payment Event Custom Record
    class Stripe_Event_Log extends CustomRecord_1.CustomRecord {
        constructor(options) {
            var _a, _b, _c, _d, _e, _f;
            super(Stripe_Event_Log.RECORDID);
            // This function fetches the last retry date
            this.getLastRetryDate = (transactionId, paymentInterval) => {
                let retryToday = true;
                // If a transaction id is passed, search for the date
                if (+transactionId > 0) {
                    search.create({
                        type: Stripe_Event_Log.RECORDID,
                        filters: [
                            ['custrecord_mhi_stripe_payment_invoice', 'anyof', transactionId]
                        ],
                        columns: [
                            search.createColumn({
                                name: 'custrecord_mhi_stripe_payment_processdt',
                                sort: search.Sort.DESC,
                                label: 'Date'
                            })
                        ]
                    }).run().each(result => {
                        // Get the last retry date
                        const lastRetryDate = format.parse({
                            value: `${result.getValue('custrecord_mhi_stripe_payment_processdt')}`,
                            type: format.Type.DATE
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
                        if (lastRetryDate > currentDate) {
                            retryToday = false;
                        }
                        return false;
                    });
                }
                return retryToday;
            };
            log.debug('options', options);
            // If internalid is passed, use that
            if (options.recordId) {
                this.recordId = options.recordId;
            }
            else if (options.values) {
                // Create a new log
                let newEventRecord = record.create({
                    type: Stripe_Event_Log.RECORDID
                });
                // Set the values passed to the payment event
                if (options.values) {
                    if ((_a = options === null || options === void 0 ? void 0 : options.values) === null || _a === void 0 ? void 0 : _a.InvoiceId) {
                        newEventRecord.setValue({
                            fieldId: Stripe_Event_Log.FIELDID.INVOICEID,
                            value: options.values.InvoiceId
                        });
                    }
                    newEventRecord.setValue({
                        fieldId: Stripe_Event_Log.FIELDID.DATE,
                        value: new Date()
                    });
                    if ((_b = options === null || options === void 0 ? void 0 : options.values) === null || _b === void 0 ? void 0 : _b.StripePaymentId) {
                        newEventRecord.setValue({
                            fieldId: Stripe_Event_Log.FIELDID.STRIPEPAYMENTID,
                            value: options.values.StripePaymentId
                        });
                    }
                    if ((_c = options === null || options === void 0 ? void 0 : options.values) === null || _c === void 0 ? void 0 : _c.InvoiceAmount) {
                        newEventRecord.setValue({
                            fieldId: Stripe_Event_Log.FIELDID.INVOICEAMOUNT,
                            value: options.values.InvoiceAmount
                        });
                    }
                    if ((_d = options === null || options === void 0 ? void 0 : options.values) === null || _d === void 0 ? void 0 : _d.StatusId) {
                        newEventRecord.setValue({
                            fieldId: Stripe_Event_Log.FIELDID.STRIPEPAYMENTSTATUS,
                            value: options.values.StatusId
                        });
                    }
                    if ((_e = options === null || options === void 0 ? void 0 : options.values) === null || _e === void 0 ? void 0 : _e.Error) {
                        newEventRecord.setValue({
                            fieldId: Stripe_Event_Log.FIELDID.ERROR,
                            value: options.values.Error
                        });
                        newEventRecord.setValue({
                            fieldId: Stripe_Event_Log.FIELDID.STRIPEPAYMENTSTATUS,
                            value: exports.Stripe_Event_Log_Status.FAIL
                        });
                    }
                    if ((_f = options === null || options === void 0 ? void 0 : options.values) === null || _f === void 0 ? void 0 : _f.ErrorMsg) {
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
        get Lookup() {
            return search.lookupFields({
                id: this.recordId,
                type: Stripe_Event_Log.RECORDID,
                columns: ['custrecord_mhi_stripe_payment_invoice', 'custrecord_mhi_stripe_payment_invoiceamt', 'custrecord_mhi_stripe_payment_id', 'custrecord_mhi_stripe_payment_status', 'custrecord_mhi_stripe_payment_processdt', 'custrecord_mhi_stripe_payment_error', 'custrecord_mhi_stripe_payment_error_msg']
            });
        }
    }
    exports.Stripe_Event_Log = Stripe_Event_Log;
    // Declare the record id
    Stripe_Event_Log.RECORDID = 'customrecord_mhi_stripe_event_log';
    // Declare the field ids
    Stripe_Event_Log.FIELDID = {
        INVOICEID: 'custrecord_mhi_stripe_payment_invoice',
        INVOICEAMOUNT: 'custrecord_mhi_stripe_payment_invoiceamt',
        STRIPEPAYMENTID: 'custrecord_mhi_stripe_payment_id',
        STRIPEPAYMENTSTATUS: 'custrecord_mhi_stripe_payment_status',
        DATE: 'custrecord_mhi_stripe_payment_processdt',
        ERROR: 'custrecord_mhi_stripe_payment_error',
        ERRORMSG: 'custrecord_mhi_stripe_payment_error_msg'
    };
    Stripe_Event_Log.updateStatus = (stripePaymentIntentId, statusId, error, errorMsg) => {
        search.create({
            type: Stripe_Event_Log.RECORDID,
            filters: [
                [Stripe_Event_Log.FIELDID.STRIPEPAYMENTID, 'is', stripePaymentIntentId]
            ]
        }).run().each(result => {
            const params = { custrecord_mhi_stripe_payment_status: statusId };
            if (error) {
                params.custrecord_mhi_stripe_payment_error = error;
            }
            if (errorMsg) {
                params.custrecord_mhi_stripe_payment_error_msg = errorMsg;
            }
            record.submitFields({ type: Stripe_Event_Log.RECORDID, id: result.id, values: params });
            return true;
        });
    };
    // Declare the possible payment event status
    exports.Stripe_Event_Log_Status = {
        PENDINGPAYMENT: 1,
        SUCCESS: 2,
        FAIL: 3
    };
});
