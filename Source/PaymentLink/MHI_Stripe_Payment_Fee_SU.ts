/**
 * @copyright 2022 Myers-Holum Inc.

 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 * @NScriptType Suitelet
 */

import {EntryPoints} from 'N/types';
import * as https from 'N/https';
import * as log from 'N/log';
import * as currency from 'N/currency';
import {getPaymentIntent, updatePaymentIntent, updatePaymentIntentAmount} from './Stripe/Payment_Intent';
import {Stripe} from '../StripeAPI/Stripe';
import {isPaymentCreditChargeExcluded} from '../Utils/Common';
export const onRequest: EntryPoints.Suitelet.onRequest = (context: EntryPoints.Suitelet.onRequestContext) => {

    switch (context.request.method) {
        case https.Method.GET:
            log.debug('context.request.parameters', context.request.parameters);
            const subsidiaryId = +context.request.parameters.si;
            const paymentIntentId = context.request.parameters.pi;
            const transactionId = context.request.parameters.ti;
            const recordType = context.request.parameters.ty;
            const action = context.request.parameters.ac;
            const stripe =  new Stripe({subsidiary: subsidiaryId});
            switch (action) {
                case 'save':

                    updatePaymentIntent({
                        stripe: stripe,
                        params: {
                            id: paymentIntentId,
                            setup_future_usage: 'off_session'
                        },
                        Success: paymentIntent => {
                            context.response.write('true');
                        },
                        Failed: () => {
                            context.response.write('false');
                        }
                    });

                    break;
                default:

                    let amount = 0;
                    let newAmount = null;
                    let currencyCode = 'USD';

                    let updatedAlready = false;
                    getPaymentIntent({
                        stripe: stripe,
                        paymentIntentId: paymentIntentId,
                        Found: paymentIntent => {
                            amount = +paymentIntent.amount;
                            currencyCode = paymentIntent.currency.toUpperCase();

                            if (paymentIntent.metadata?.stripefee && +paymentIntent.metadata?.stripefee > 0) {
                                updatedAlready = true;
                            }
                        },
                        NotFound: ()  => {
                            // test
                        }
                    });

                    let threshold = true;

                    // If threshold amount is set
                    if (stripe.BUNDLESCONFIGURATION.PAYMENTLINK_CREDITCARD_FEE_THRESHOLD_AMOUNT > 0) {
                        // Declare the USD amount
                        let usdAmount = amount;

                        if (currencyCode !== 'JPY') {
                            usdAmount = usdAmount / 100;
                        }

                        // If currency is not USD, convert it
                        if (currencyCode !== 'USD') {

                            const rate = currency.exchangeRate({
                                source: currencyCode,
                                target: 'USD',
                                date: new Date()
                            });
                            usdAmount = amount * rate;

                        }
                        // Dont add fee if amt <= threshold
                        if (usdAmount <= stripe.BUNDLESCONFIGURATION.PAYMENTLINK_CREDITCARD_FEE_THRESHOLD_AMOUNT  ) {
                            threshold = false;
                        }

                    }

                    const isCreditChargeExcluded = isPaymentCreditChargeExcluded(+transactionId, recordType);

                    newAmount = +stripe.BUNDLESCONFIGURATION.GENERAL_CALCULATE_STRIPE_FEES(amount);
                    // If charge stripe fee is checked
                    if (stripe.BUNDLESCONFIGURATION.PAYMENTLINK_CHARGE_CREDITCARD_FEE && amount > 0 && newAmount > 0 && subsidiaryId > 0 && paymentIntentId && threshold && !isCreditChargeExcluded && !updatedAlready) {
                        // Create the payment intent
                        updatePaymentIntentAmount({
                            stripe: stripe,
                            paymentIntentId: paymentIntentId,
                            oldAmount: +amount,
                            newAmount: +newAmount,
                            Success: paymentIntent => {
                                context.response.write('true');
                            },
                            Failed: () => {
                                context.response.write('false');
                            }
                        });
                    } else {
                        context.response.write('false');
                    }

                    break;
            }

            break;

        default:
            break;
    }

};
