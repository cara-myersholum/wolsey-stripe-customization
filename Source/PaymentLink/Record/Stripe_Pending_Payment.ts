/**
 * @copyright 2022 Myers-Holum Inc.
 *
 * @NApiVersion 2.1
 */

import * as record from 'N/record';
import * as search from 'N/search';
import * as log from 'N/log';
import * as format from 'N/format';
import {CustomRecord, TextValue} from '../../Record/CustomRecord';

// This is the class used to load/create the Stripe Payment Event Custom Record

export class Stripe_Pending_Payment extends CustomRecord {
    // Declare the record id
    private static readonly RECORDID = 'customrecord_mhi_stripe_pending_payment';

    // Declare the field ids
    private static readonly FIELDID = {
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

    constructor(options: EventConstructorOptions) {
        super(Stripe_Pending_Payment.RECORDID);
        log.debug('options', options);
        // If internalid is passed, use that
        if (options.recordId) {
            this.recordId = options.recordId;
        } else if (options.values) {

            if (options.values?.PaymentIntent) {

                search.create({
                    type: Stripe_Pending_Payment.RECORDID,
                    filters: ['custrecord_mhi_stripe_pending_id', 'is', options.values?.PaymentIntent]
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
                    if (options?.values?.TransactionId) {
                        pendingPaymentRecord.setValue({
                            fieldId: Stripe_Pending_Payment.FIELDID.TRANSACTION,
                            value: options.values.TransactionId
                        });
                    }

                    pendingPaymentRecord.setValue({
                        fieldId: Stripe_Pending_Payment.FIELDID.DATE,
                        value: new Date()
                    });

                    if (options?.values?.CustomerId) {
                        pendingPaymentRecord.setValue({
                            fieldId: Stripe_Pending_Payment.FIELDID.CUSTOMER,
                            value: options.values.CustomerId
                        });
                    }

                    if (options?.values?.CurrencyId) {
                        pendingPaymentRecord.setValue({
                            fieldId: Stripe_Pending_Payment.FIELDID.CURRENCY,
                            value: options.values.CurrencyId
                        });
                    }

                    if (options?.values?.SubsidiaryId) {
                        pendingPaymentRecord.setValue({
                            fieldId: Stripe_Pending_Payment.FIELDID.SUBSIDIARY,
                            value: options.values.SubsidiaryId
                        });
                    }

                    if (options?.values?.Amount) {
                        pendingPaymentRecord.setValue({
                            fieldId: Stripe_Pending_Payment.FIELDID.AMOUNT,
                            value: options.values.Amount
                        });
                    }

                    if (options?.values?.Type) {
                        pendingPaymentRecord.setValue({
                            fieldId: Stripe_Pending_Payment.FIELDID.TYPE,
                            value: options.values.Type
                        });
                    }

                    if (options?.values?.StatusId) {
                        pendingPaymentRecord.setValue({
                            fieldId: Stripe_Pending_Payment.FIELDID.STATUS,
                            value: options.values.StatusId
                        });
                    } else {
                        pendingPaymentRecord.setValue({
                            fieldId: Stripe_Pending_Payment.FIELDID.STATUS,
                            value: Stripe_Pending_Payment_Status.PENDINGPAYMENT
                        });
                    }

                    if (options?.values?.Error) {
                        pendingPaymentRecord.setValue({
                            fieldId: Stripe_Pending_Payment.FIELDID.ERROR,
                            value: options.values.Error
                        });
                        pendingPaymentRecord.setValue({
                            fieldId: Stripe_Pending_Payment.FIELDID.STATUS,
                            value: Stripe_Pending_Payment_Status.FAIL
                        });

                    }
                    if (options?.values?.PaymentIntent) {
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
    public get Lookup(): LookupResponse {
        return <LookupResponse>search.lookupFields({
            id: this.recordId,
            type: Stripe_Pending_Payment.RECORDID,
            columns: ['custrecord_mhi_stripe_pending_trans', 'custrecord_mhi_stripe_pending_cust', 'custrecord_mhi_stripe_pending_sub', 'custrecord_mhi_stripe_pending_currency', 'custrecord_mhi_stripe_pending_amount', 'custrecord_mhi_stripe_pending_date', 'custrecord_mhi_stripe_pending_status', 'custrecord_mhi_stripe_pending_error', 'custrecord_mhi_stripe_pending_id', 'custrecord_mhi_stripe_pending_type']
        });
    }

    public static updateStatus = (stripePaymentIntentId: string, statusId: number, error?: string) : number => {
        let recordId = null;
        try {
            search.create({
                type: Stripe_Pending_Payment.RECORDID,
                filters:
                    [
                        [Stripe_Pending_Payment.FIELDID.PAYMENTINTENT, 'is', stripePaymentIntentId]
                    ]
            }).run().each(result => {
                const params: any = {custrecord_mhi_stripe_pending_status: statusId};
                if (error) {
                    params.custrecord_mhi_stripe_pending_error = error;
                }

                record.submitFields({type: Stripe_Pending_Payment.RECORDID, id: result.id, values: params});

                recordId = +result.id

                return true;
            });
        } catch (err) {

        }
        return recordId;
    }

}

// Declare the possible payment event status
export const Stripe_Pending_Payment_Status = {
    PENDINGPAYMENT : 1,
    SUCCESS : 2,
    FAIL : 3
};

export interface EventConstructorOptions {
    recordId?: number;
    values?: {
        PaymentIntent?: string;
        TransactionId?: number;
        CustomerId?: number;
        SubsidiaryId?: number;
        CurrencyId?: number;
        Amount?: number;
        StatusId?: number;
        Type?: string;
        Error?: string;
    };
}

interface LookupResponse {
    custrecord_mhi_stripe_pending_id: string;
    custrecord_mhi_stripe_pending_trans: TextValue[];
    custrecord_mhi_stripe_pending_cust: TextValue[];
    custrecord_mhi_stripe_pending_sub: TextValue[];
    custrecord_mhi_stripe_pending_currency: TextValue[];
    custrecord_mhi_stripe_pending_amount: number;
    custrecord_mhi_stripe_pending_date: string;
    custrecord_mhi_stripe_pending_type: string;
    custrecord_mhi_stripe_pending_status: TextValue[];
    custrecord_mhi_stripe_pending_error: string;
}
