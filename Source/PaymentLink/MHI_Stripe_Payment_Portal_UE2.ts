/**
 * @copyright 2022 Myers-Holum Inc.
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 * @NScriptType UserEventScript
 */

import {EntryPoints} from 'N/types';
import * as record from 'N/record';
import * as log from 'N/log';
import {getPaymentIntent} from "./Stripe/Payment_Intent";
import {Stripe} from "../StripeAPI/Stripe";
import {getTransactionDetails} from "../Utils/Common";
import {generateSalesOrder} from "./NetSuite/SalesOrder";

export const beforeSubmit: EntryPoints.UserEvent.beforeSubmit = (context: EntryPoints.UserEvent.beforeSubmitContext) => {
    try {
        switch (context.type) {
            case context.UserEventType.CREATE:
                const subsidiaryId = +context.newRecord.getValue({fieldId: 'subsidiary'});

                let paymentIntentId = <string> context.newRecord.getValue({fieldId: 'custbody_stripe_payment_intentid'});

                const authorizationCode = <string> context.newRecord.getValue({fieldId: 'custbody_suitesync_authorization_code'});

                if (authorizationCode) {
                    if (authorizationCode.indexOf('pi_') > -1) {
                        paymentIntentId = authorizationCode;
                    }

                }
                if (paymentIntentId && paymentIntentId.length > 0) {

                    // Load the stripe API class
                    const stripe = new Stripe({subsidiary: subsidiaryId});
                    getPaymentIntent({
                        stripe: stripe,
                        paymentIntentId: paymentIntentId,
                        Found: payment_intent => {

                            if (payment_intent.metadata?.netsuite_transaction_id) {
                                const transactionDetails = getTransactionDetails({transactionId: payment_intent.metadata?.netsuite_transaction_id});
                                const subsidiaryId = +transactionDetails.subsidiary.value

                                if (subsidiaryId > 0) {
                                    context.newRecord.setValue({fieldId: 'subsidiary', value: subsidiaryId});
                                    log.debug('changing subsidiary', subsidiaryId);
                                }
                            }

                        },
                        NotFound: ()  => {

                        }
                    });

                }

                break;
            default:
                // Do Nothing
                break;
        }

    } catch (error) {
        log.debug('Error on Stripe Payment Portal UE', error);
    }
};

export const afterSubmit: EntryPoints.UserEvent.afterSubmit = (context: EntryPoints.UserEvent.afterSubmitContext) => {
    try {
        switch (context.type) {
            case context.UserEventType.CREATE:
            // case context.UserEventType.EDIT:
                let customerPayment = record.load({
                    type: record.Type.CUSTOMER_PAYMENT,
                    id: context.newRecord.id,
                    isDynamic: true
                })

                const subsidiaryId = +customerPayment.getValue({fieldId: 'subsidiary'});

                let paymentIntentId = <string> customerPayment.getValue({fieldId: 'custbody_stripe_payment_intentid'});

                const authorizationCode = <string> customerPayment.getValue({fieldId: 'custbody_suitesync_authorization_code'});

                if (authorizationCode) {
                    if (authorizationCode.indexOf('pi_') > -1) {
                        paymentIntentId = authorizationCode;
                    }

                }
                log.debug('paymentIntentId', paymentIntentId);
                if (paymentIntentId && paymentIntentId.length > 0) {

                    // Load the stripe API class
                    const stripe = new Stripe({subsidiary: subsidiaryId});

                    getPaymentIntent({
                        stripe: stripe,
                        paymentIntentId: paymentIntentId,
                        Found: payment_intent => {
                            log.debug('payment_intent.metadata', payment_intent.metadata);
                            if (payment_intent.metadata?.netsuite_transaction_id) {
                                const transactionDetails = getTransactionDetails({transactionId: payment_intent.metadata?.netsuite_transaction_id});
                                log.debug('payment_intent.transactionDetails', transactionDetails);
                                generateSalesOrder({
                                    recordId: transactionDetails.internalid,
                                    recordType: transactionDetails.recordtype,
                                    charge: payment_intent,
                                    Success: invoiceId => {
                                        log.debug('payment_intent.invoiceId', invoiceId);

                                        customerPayment = record.load({
                                            type: record.Type.CUSTOMER_PAYMENT,
                                            id: context.newRecord.id,
                                            isDynamic: true
                                        })
                                        // Loop thru all the payment event detail
                                        const customerPaymentIndex = customerPayment.findSublistLineWithValue({sublistId: 'apply', fieldId:  'internalid', value: `${invoiceId}`});
                                        const paymentAmount = payment_intent.amount / 100;
                                        // If index is found, apply it and set the amount
                                        if (customerPaymentIndex > -1) {
                                            customerPayment.selectLine({sublistId: 'apply', line: customerPaymentIndex });
                                            customerPayment.setCurrentSublistValue({sublistId: 'apply', fieldId: 'apply', value: true });
                                            customerPayment.setCurrentSublistValue({sublistId: 'apply', fieldId: 'amount', value: paymentAmount });

                                        }
                                        // Save the customer record
                                        customerPayment.save({ignoreMandatoryFields: true});

                                    },
                                    Failed: ()  => {

                                    }
                                });
                            }

                        },
                        NotFound: ()  => {

                        }
                    });
                }

                break;
            default:
                // Do Nothing
                break;
        }


    } catch (error) {
        log.debug('Error on Stripe Payment Portal UE', error);
    }
}
