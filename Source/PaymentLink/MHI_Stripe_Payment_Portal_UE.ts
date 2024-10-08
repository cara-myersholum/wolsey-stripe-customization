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
import {getCharge} from "./Stripe/Charge";

const netsuitePaymentIntentFieldId = 'custbody_stripe_payment_intentid';

export const afterSubmit: EntryPoints.UserEvent.afterSubmit = (context: EntryPoints.UserEvent.afterSubmitContext) => {
    try {
        switch (context.type) {
            case context.UserEventType.CREATE:
            case context.UserEventType.EDIT:
                let customerPayment = record.load({
                    type: record.Type.CUSTOMER_PAYMENT,
                    id: context.newRecord.id,
                    isDynamic: true
                })

                const stripePaymentIntentId = <string>customerPayment.getValue({fieldId: netsuitePaymentIntentFieldId});
                const subsidiaryId = +customerPayment.getValue({fieldId: 'subsidiary'});
                const currencyId = +customerPayment.getValue({fieldId: 'currency'});
                const trandate = customerPayment.getValue({fieldId: 'trandate'});
                const customerId = +customerPayment.getValue({fieldId: 'customer'});
                const transactionId = <string> customerPayment.getValue({fieldId: 'custbody_stripe_chargeid'}) || <string> customerPayment.getValue({fieldId: 'custbody_suitesync_authorization_code'});
                log.debug('transactionId', transactionId);
                if (transactionId && transactionId.length > 0) {

                    // Load the stripe API class
                    const stripe = new Stripe({subsidiary: subsidiaryId});
                    let feeId = null;
                    if (stripe.BUNDLESCONFIGURATION.PAYMENTLINK_CHARGE_CREDITCARD_FEE) {
                        getCharge({
                            stripe: stripe,
                            chargeId: transactionId,
                            Found(charge: any): void {
                                log.audit('charge', charge);
                                getPaymentIntent({
                                        stripe: stripe,
                                        paymentIntentId: charge.payment_intent,
                                        Found: payment_intent => {
                                            log.audit('payment_intent', payment_intent);
                                            if (payment_intent.metadata.stripefee) {
                                                const feeRevenue = record.create({
                                                    type: 'customtransaction_mhi_stripe_fee_revenue',
                                                    isDynamic: true
                                                });

                                                const otherRevenueAccount = stripe.BUNDLESCONFIGURATION.GENERAL_STRIPE_FEES_REVENUEACCOUNT;
                                                const arAccount = 119;

                                                log.debug('otherRevenueAccount', otherRevenueAccount);
                                                log.debug('arAccount', arAccount);
                                                const amount = +charge.metadata.stripefee / 100;

                                                feeRevenue.setValue({fieldId: 'subsidiary', value: subsidiaryId});
                                                feeRevenue.setValue({fieldId: 'currency', value: currencyId});
                                                feeRevenue.setValue({fieldId: 'trandate', value: trandate});
                                                feeRevenue.setValue({
                                                    fieldId: 'custbody_mhi_stripe_payment',
                                                    value: context.newRecord.id
                                                });


                                                feeRevenue.selectNewLine({sublistId: 'line'});
                                                feeRevenue.setCurrentSublistValue({
                                                    sublistId: 'line',
                                                    fieldId: 'account',
                                                    value: arAccount
                                                });
                                                feeRevenue.setCurrentSublistValue({
                                                    sublistId: 'line',
                                                    fieldId: 'debit',
                                                    value: amount
                                                });
                                                feeRevenue.setCurrentSublistValue({
                                                    sublistId: 'line',
                                                    fieldId: 'entity',
                                                    value: customerId
                                                });
                                                feeRevenue.commitLine({sublistId: 'line'});

                                                feeRevenue.selectNewLine({sublistId: 'line'});
                                                feeRevenue.setCurrentSublistValue({
                                                    sublistId: 'line',
                                                    fieldId: 'account',
                                                    value: otherRevenueAccount
                                                });
                                                feeRevenue.setCurrentSublistValue({
                                                    sublistId: 'line',
                                                    fieldId: 'credit',
                                                    value: amount
                                                });
                                                feeRevenue.setCurrentSublistValue({
                                                    sublistId: 'line',
                                                    fieldId: 'entity',
                                                    value: customerId
                                                });
                                                feeRevenue.commitLine({sublistId: 'line'});

                                                feeId = feeRevenue.save({
                                                    ignoreMandatoryFields: true
                                                });
                                            }

                                        },
                                        NotFound: () => {

                                        }
                                    }
                                );

                            }, NotFound(): void {
                            }
                        });

                        if (feeId > 0) {
                            customerPayment = record.load({
                                type: record.Type.CUSTOMER_PAYMENT,
                                id: context.newRecord.id,
                                isDynamic: true
                            });

                            const customerPaymentIndex = customerPayment.findSublistLineWithValue({
                                sublistId: 'apply',
                                fieldId: 'internalid',
                                value: feeId
                            });

                            // If index is found, apply it and set the amount
                            if (customerPaymentIndex > -1) {
                                customerPayment.selectLine({sublistId: 'apply', line: customerPaymentIndex});
                                customerPayment.setCurrentSublistValue({
                                    sublistId: 'apply',
                                    fieldId: 'apply',
                                    value: true
                                });

                            }

                            // Save the customer record
                            customerPayment.save({ignoreMandatoryFields: true});
                        }


                    }
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
