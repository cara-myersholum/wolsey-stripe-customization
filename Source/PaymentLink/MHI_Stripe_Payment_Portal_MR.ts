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
import * as error from 'N/error';
import {Stripe} from '../StripeAPI/Stripe';
import {getPaymentIntents, updatePaymentIntent} from './Stripe/Payment_Intent';
import { generateSalesOrder } from './NetSuite/SalesOrder';
import {getTransactionDetails} from '../Utils/Common'
import {generateCustomerPayment} from "./NetSuite/CustomerPayment";
import {Stripe_Setup} from "../Record/Stripe_Setup";
import {updateChargeMetadata} from "./Stripe/Charge";
import {Stripe_Event_Log, Stripe_Event_Log_Status} from "../Record/Stripe_Event_Log";

export const getInputData: EntryPoints.MapReduce.getInputData = () => {

    // This will contain all JSON from stripe dispute, payout & charges
    const data = [];
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    startDate.setHours(0, 0, 0, 0);

    const stripeIds = Stripe_Setup.getAllSetupIds();
    stripeIds.forEach(stripeId => {
        const stripe = new Stripe({id: stripeId});
        const yesterday = stripe.API.getUnixTime(startDate);
        // Get list of charges
        getPaymentIntents({
            stripe: stripe,
            params: {query: `-metadata[\'netsuite_transaction_id\']: null AND metadata[\'netsuite_sales_order_id\']: null AND created > ${yesterday}`, limit: 100},
            Found: charges => {
                // add the payouts to our array
                data.push(...charges);
            },
            NotFound: () => {
                // Nothing to do here.
            }
        });
    });

    return data;
};

export const map: EntryPoints.MapReduce.map = (context: EntryPoints.MapReduce.mapContext) => {
    // Parse the values from get Input Stage
    const values = JSON.parse(context.value);

    if (values.metadata?.netsuite_transaction_id && !values.metadata?.netsuite_sales_order_id) {

        const transactionDetails = getTransactionDetails({transactionId: values.metadata?.netsuite_transaction_id});

        generateSalesOrder({
            recordId: transactionDetails.internalid,
            recordType: transactionDetails.recordtype,
            charge: values,
            Success: salesOrderId => {

                Stripe_Event_Log.updateStatus(values.id, Stripe_Event_Log_Status.SUCCESS);
                // Update the metadata
                updateChargeMetadata({
                    recordId: salesOrderId,
                    recordType: 'salesorder',
                    stripe: new Stripe({subsidiary: +transactionDetails.subsidiary.value}),
                    stripeChargeId: values.latest_charge,
                    stripePaymentIntentId: values.id,
                    Found(charge: any): void {

                    }, NotFound(response: any): void {

                    }
                });

            },
            Failed: ()  => {

            }
        });
    }

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
