/**
 * @copyright 2022 Myers-Holum Inc.
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @NScriptType MapReduceScript
 */

import {EntryPoints} from 'N/types';
import * as record from 'N/record';
import * as search from 'N/search';
import * as log from 'N/log';
import {getPaymentIntent} from "./Stripe/Payment_Intent";
import {getTransactionDetails} from "../Utils/Common";
import {Stripe} from "../StripeAPI/Stripe";
import {getCharge} from "./Stripe/Charge";
import {Stripe_Pending_Payment, Stripe_Pending_Payment_Status} from "./Record/Stripe_Pending_Payment";


export const getInputData: EntryPoints.MapReduce.getInputData = () => {
    // Load the saved search for invoices
    return search.load({id: 'customsearch_mhi_stripe_pending_payment'});
};

export const map: EntryPoints.MapReduce.map = (context: EntryPoints.MapReduce.mapContext) => {
    // Parse the values from get Input Stage
    const values = JSON.parse(context.value);
    log.debug('values', values);

    // Get the netsuite transaction id & fields
    const pendingPaymentId: number = +values.id;
    const transactionId = +values.values['custrecord_mhi_stripe_pending_trans'].value;
    const paymentIntentId = values.values['custrecord_mhi_stripe_pending_id'];

    if (paymentIntentId) {

        if(+transactionId > 0){
            const recordDetails = getTransactionDetails({transactionId: transactionId})
            const subsidiaryId = +recordDetails.subsidiary.value

            const stripe = new Stripe({subsidiary: subsidiaryId});
            getPaymentIntent({
                stripe: stripe,
                paymentIntentId: paymentIntentId,
                Found: payment_intent => {
                    // Read the charge object from stripe
                    getCharge({
                        stripe: stripe,
                        chargeId: payment_intent.latest_charge,
                        Found: charge => {

                            switch(charge.status) {
                                case 'failed':
                                    Stripe_Pending_Payment.updateStatus(paymentIntentId, Stripe_Pending_Payment_Status.FAIL,charge.failure_message);
                                    break;
                                case 'succeeded':
                                    Stripe_Pending_Payment.updateStatus(paymentIntentId, Stripe_Pending_Payment_Status.SUCCESS);
                                    break;
                                default:
                                    break;
                            }

                        },
                        NotFound: () => {

                        }
                    });
                },
                NotFound: ()  => {

                }
            });
        } else {
            Stripe_Pending_Payment.updateStatus(paymentIntentId, Stripe_Pending_Payment_Status.FAIL,`No Transaction Linked`);
        }
    }



    context.write({
        key: `${pendingPaymentId}`,
        value: `${pendingPaymentId}`,
    });

};

export const summarize: EntryPoints.MapReduce.summarize = (context: EntryPoints.MapReduce.summarizeContext) => {
    try {
        context.mapSummary.errors.iterator().each((key, error) => {
            log.audit('error', JSON.parse(error));
            return true;
        });

    } catch (e) {
    }
};
