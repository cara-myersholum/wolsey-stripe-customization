/**
 * @copyright 2022 Myers-Holum Inc.
 *
 * @NApiVersion 2.1
 */

import * as log from 'N/log';
import { getAccountId } from '../../Utils/Common';
import {Stripe} from '../../StripeAPI/Stripe';

export const updateChargeMetadata = (options: UpdateChargeMetadataOptions): void => {
    let charge = null;
    let upsertChargeResponse = null;
    log.debug('upsertChargeResponse options', options);

    const params: any = {};

    switch (options.recordType) {
        case 'customerdeposit':
            params.metadata = {
                netsuite_customer_deposit: options.recordId, // Customer Deposit ID
                netsuite_customer_deposit_link: `https://${getAccountId()}.app.netsuite.com/app/accounting/transactions/custdep.nl?id=${options.recordId}` // The url of the customer deposit
            }
            break;
        case 'salesorder':
            params.metadata = {
                netsuite_sales_order_id: options.recordId, // Sales Order ID
                netsuite_sales_order_link: `https://${getAccountId()}.app.netsuite.com/app/accounting/transactions/salesord.nl?id=${options.recordId}`, // The url of the sales order
                netsuite_allow_integration: true
            }
            break;
        case 'invoice':
            params.metadata = {
                netsuite_invoice_id: options.recordId, // Invoice ID
                netsuite_invoice_link: `https://${getAccountId()}.app.netsuite.com/app/accounting/transactions/custinvc.nl?id=${options.recordId}`, // The url of the invoice
                netsuite_allow_integration: true
            }
            break;
        case 'customerpayment':
            params.metadata = {
                netsuite_customer_payment_id: options.recordId, // Invoice ID
                netsuite_customer_payment_link: `https://${getAccountId()}.app.netsuite.com/app/accounting/transactions/custpymt.nl?id=${options.recordId}`, // The url of the invoice
                netsuite_allow_integration: true
            }
            break;
        default:
            break;
    }
    // If it uses charge
    if (options.stripeChargeId) {
        params.id = options.stripeChargeId
        upsertChargeResponse = options.stripe.API.createApiRequest(params, 'update', 'v1/charges');
    }

    if (options.stripePaymentIntentId) {
        params.id = options.stripePaymentIntentId
        options.stripe.API.createApiRequest(params, 'update', 'v1/payment_intents');
    }

    log.debug('upsertChargeResponse', upsertChargeResponse);
    if (upsertChargeResponse && upsertChargeResponse.id) {
        charge = upsertChargeResponse;
    }

    log.debug('Stripe Charge', charge);
    // If succeeded, pass the stripe id
    if (charge) {
        options.Found(charge);
    } else {
        // Else pass the error message response
        options.NotFound(upsertChargeResponse);
    }
};

export const getCharge = (options: GetChargeOptions): void => {
    let getResponse = null;
    if (options.chargeId) {

        getResponse = options.stripe.API.createApiRequest({id: options.chargeId}, 'get', 'v1/charges');
    }


    if (getResponse.id) {
        options.Found(getResponse);
    } else {
        options.NotFound();
    }
};


interface GetChargeOptions {
    chargeId: string;
    stripe: Stripe;
    Found(charge: any): void;
    NotFound(): void;
}


interface UpdateChargeMetadataOptions {
    stripeChargeId: string;
    stripePaymentIntentId: string;
    recordId?: number;
    recordType?: string;
    stripe: Stripe;
    Found(charge: any): void;
    NotFound(response: any): void;
}


interface UpsertChargeOptions {
    netsuiteId: number;
    stripeCustomerId: string;
    amount: number;
    source: string;
    currency: string;
    description: string;
    stripe: Stripe;
    Found(charge: any): void;
    NotFound(response: any): void;
}
