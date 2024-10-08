/**
 * @copyright 2022 Myers-Holum Inc.
 *
 * @NApiVersion 2.1
 */
define(["require", "exports", "N/record", "N/search", "N/log", "../../Record/CustomRecord"], function (require, exports, record, search, log, CustomRecord_1) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Stripe_Pending_Payment_Status = exports.Stripe_Pending_Payment = void 0;
    // This is the class used to load/create the Stripe Payment Event Custom Record
    class Stripe_Pending_Payment extends CustomRecord_1.CustomRecord {
        constructor(options) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
            super(Stripe_Pending_Payment.RECORDID);
            log.debug('options', options);
            // If internalid is passed, use that
            if (options.recordId) {
                this.recordId = options.recordId;
            }
            else if (options.values) {
                if ((_a = options.values) === null || _a === void 0 ? void 0 : _a.PaymentIntent) {
                    search.create({
                        type: Stripe_Pending_Payment.RECORDID,
                        filters: ['custrecord_mhi_stripe_pending_id', 'is', (_b = options.values) === null || _b === void 0 ? void 0 : _b.PaymentIntent]
                    }).run().each(result => {
                        this.recordId = +result.id;
                        return false;
                    });
                }
                if (!this.recordId) {
                    // Create a new record
                    let pendingPaymentRecord = record.create({
                        type: Stripe_Pending_Payment.RECORDID
                    });
                    // Set the values passed to the payment event
                    if (options.values) {
                        if ((_c = options === null || options === void 0 ? void 0 : options.values) === null || _c === void 0 ? void 0 : _c.TransactionId) {
                            pendingPaymentRecord.setValue({
                                fieldId: Stripe_Pending_Payment.FIELDID.TRANSACTION,
                                value: options.values.TransactionId
                            });
                        }
                        pendingPaymentRecord.setValue({
                            fieldId: Stripe_Pending_Payment.FIELDID.DATE,
                            value: new Date()
                        });
                        if ((_d = options === null || options === void 0 ? void 0 : options.values) === null || _d === void 0 ? void 0 : _d.CustomerId) {
                            pendingPaymentRecord.setValue({
                                fieldId: Stripe_Pending_Payment.FIELDID.CUSTOMER,
                                value: options.values.CustomerId
                            });
                        }
                        if ((_e = options === null || options === void 0 ? void 0 : options.values) === null || _e === void 0 ? void 0 : _e.CurrencyId) {
                            pendingPaymentRecord.setValue({
                                fieldId: Stripe_Pending_Payment.FIELDID.CURRENCY,
                                value: options.values.CurrencyId
                            });
                        }
                        if ((_f = options === null || options === void 0 ? void 0 : options.values) === null || _f === void 0 ? void 0 : _f.SubsidiaryId) {
                            pendingPaymentRecord.setValue({
                                fieldId: Stripe_Pending_Payment.FIELDID.SUBSIDIARY,
                                value: options.values.SubsidiaryId
                            });
                        }
                        if ((_g = options === null || options === void 0 ? void 0 : options.values) === null || _g === void 0 ? void 0 : _g.Amount) {
                            pendingPaymentRecord.setValue({
                                fieldId: Stripe_Pending_Payment.FIELDID.AMOUNT,
                                value: options.values.Amount
                            });
                        }
                        if ((_h = options === null || options === void 0 ? void 0 : options.values) === null || _h === void 0 ? void 0 : _h.Type) {
                            pendingPaymentRecord.setValue({
                                fieldId: Stripe_Pending_Payment.FIELDID.TYPE,
                                value: options.values.Type
                            });
                        }
                        if ((_j = options === null || options === void 0 ? void 0 : options.values) === null || _j === void 0 ? void 0 : _j.StatusId) {
                            pendingPaymentRecord.setValue({
                                fieldId: Stripe_Pending_Payment.FIELDID.STATUS,
                                value: options.values.StatusId
                            });
                        }
                        else {
                            pendingPaymentRecord.setValue({
                                fieldId: Stripe_Pending_Payment.FIELDID.STATUS,
                                value: exports.Stripe_Pending_Payment_Status.PENDINGPAYMENT
                            });
                        }
                        if ((_k = options === null || options === void 0 ? void 0 : options.values) === null || _k === void 0 ? void 0 : _k.Error) {
                            pendingPaymentRecord.setValue({
                                fieldId: Stripe_Pending_Payment.FIELDID.ERROR,
                                value: options.values.Error
                            });
                            pendingPaymentRecord.setValue({
                                fieldId: Stripe_Pending_Payment.FIELDID.STATUS,
                                value: exports.Stripe_Pending_Payment_Status.FAIL
                            });
                        }
                        if ((_l = options === null || options === void 0 ? void 0 : options.values) === null || _l === void 0 ? void 0 : _l.PaymentIntent) {
                            pendingPaymentRecord.setValue({
                                fieldId: Stripe_Pending_Payment.FIELDID.PAYMENTINTENT,
                                value: options.values.PaymentIntent
                            });
                        }
                        this.recordId = pendingPaymentRecord.save();
                    }
                }
            }
        }
        // This function gets the field values of the payment event
        get Lookup() {
            return search.lookupFields({
                id: this.recordId,
                type: Stripe_Pending_Payment.RECORDID,
                columns: ['custrecord_mhi_stripe_pending_trans', 'custrecord_mhi_stripe_pending_cust', 'custrecord_mhi_stripe_pending_sub', 'custrecord_mhi_stripe_pending_currency', 'custrecord_mhi_stripe_pending_amount', 'custrecord_mhi_stripe_pending_date', 'custrecord_mhi_stripe_pending_status', 'custrecord_mhi_stripe_pending_error', 'custrecord_mhi_stripe_pending_id', 'custrecord_mhi_stripe_pending_type']
            });
        }
    }
    exports.Stripe_Pending_Payment = Stripe_Pending_Payment;
    // Declare the record id
    Stripe_Pending_Payment.RECORDID = 'customrecord_mhi_stripe_pending_payment';
    // Declare the field ids
    Stripe_Pending_Payment.FIELDID = {
        TRANSACTION: 'custrecord_mhi_stripe_pending_trans',
        CUSTOMER: 'custrecord_mhi_stripe_pending_cust',
        SUBSIDIARY: 'custrecord_mhi_stripe_pending_sub',
        CURRENCY: 'custrecord_mhi_stripe_pending_currency',
        AMOUNT: 'custrecord_mhi_stripe_pending_amount',
        DATE: 'custrecord_mhi_stripe_pending_date',
        STATUS: 'custrecord_mhi_stripe_pending_status',
        ERROR: 'custrecord_mhi_stripe_pending_error',
        PAYMENTINTENT: 'custrecord_mhi_stripe_pending_id',
        TYPE: 'custrecord_mhi_stripe_pending_type'
    };
    Stripe_Pending_Payment.updateStatus = (stripePaymentIntentId, statusId, error) => {
        let recordId = null;
        try {
            search.create({
                type: Stripe_Pending_Payment.RECORDID,
                filters: [
                    [Stripe_Pending_Payment.FIELDID.PAYMENTINTENT, 'is', stripePaymentIntentId]
                ]
            }).run().each(result => {
                const params = { custrecord_mhi_stripe_pending_status: statusId };
                if (error) {
                    params.custrecord_mhi_stripe_pending_error = error;
                }
                record.submitFields({ type: Stripe_Pending_Payment.RECORDID, id: result.id, values: params });
                recordId = +result.id;
                return true;
            });
        }
        catch (err) {
        }
        return recordId;
    };
    // Declare the possible payment event status
    exports.Stripe_Pending_Payment_Status = {
        PENDINGPAYMENT: 1,
        SUCCESS: 2,
        FAIL: 3
    };
});
