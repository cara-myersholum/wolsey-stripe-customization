/**
 * @copyright 2022 Myers-Holum Inc.
 *
 * @NApiVersion 2.1
 */

import * as log from 'N/log';
import { getAccountId } from '../../Utils/Common';
import {Stripe} from '../../StripeAPI/Stripe';
import * as url from 'N/url';

export const createPaymentIntent = (options: CreatePaymentIntentOptions): void => {
    let paymentResponse = null;
    try {
        log.debug('options', options);
        let stripeAmount = options.amount;
        if (options.currencyCode !== 'JPY') {
            stripeAmount = options.amount * 100;
        }

        let transactionURL = `https://${getAccountId()}.app.netsuite.com${url.resolveRecord({
            recordType: options.recordType,
            recordId: options.recordId,
        })}`;
        transactionURL = transactionURL.substring(0,transactionURL.indexOf('&'));
        // currencyCode = 'GBP';
        const paymentMethodTypes = ['card'];
        // Manage supported payment methods
        switch (options.currencyCode) {
            case 'USD':
                paymentMethodTypes.push('us_bank_account');
                break;
            case 'CAD':
                paymentMethodTypes.push('acss_debit');
                break;
            case 'GBP':
                paymentMethodTypes.push('bacs_debit');
                break;
            default:
                break;

        }

        const params: any = {customer: options.stripeCustomerId, amount: `${(stripeAmount).toFixed(0)}`, setup_future_usage: 'off_session', currency: options.currencyCode, // : true,
            payment_method_options: {
                acss_debit: {
                    mandate_options: {
                        payment_schedule: 'sporadic',
                        transaction_type: 'business',
                    },
                },
            },
            // payment_method_types: paymentMethodTypes,

        };

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
                };
                break;
            case 'invoicegroup':
                params.metadata = {
                    netsuite_invoice_group_id: options.recordId, // Invoice ID
                    netsuite_invoice_group_link: `https://${getAccountId()}.app.netsuite.com/app/accounting/transactions/invcgroup.nl?id=${options.recordId}`, // The url of the invoice
                    netsuite_allow_integration: true
                };
                break;
            default:
                params.metadata = {
                    netsuite_transaction_id: options.recordId,
                    netsuite_transaction_type: options.recordType,
                    netsuite_transaction_link: transactionURL
                }
                break;
        }
        // If there is no SCN
        if (options.stripe.BUNDLESCONFIGURATION.PAYMENTLINK_SCN_DISABLED) {
            params.metadata = {
                netsuite_transaction_id: options.recordId,
                netsuite_transaction_type: options.recordType,
                netsuite_transaction_link: transactionURL
            };
        }

        if (options.retry) {
            params['automatic_payment_methods[enabled]'] = true;
            delete params.payment_method_types;
        }
        log.debug('params', params);
        paymentResponse = options.stripe.API.createApiRequest(params, 'create', 'v1/payment_intents', { 'Idempotency-Key': `${ new Date().toString()}`});
        log.debug('paymentResponse', paymentResponse);

    } catch (err) {

    }
    if (paymentResponse?.id) {
        options.Success(paymentResponse);
    } else {
        if (!options.retry) {
            // Create the payment intent
            createPaymentIntent({
                amount: options.amount,
                currencyCode: options.currencyCode,
                recordType: options.recordType,
                recordId: options.recordId,
                stripe: options.stripe,
                stripeCustomerId: options.stripeCustomerId,
                retry: true,
                Success: payment_intent => {
                    options.Success(payment_intent);
                },
                Failed: () => {
                    options.Failed()
                }
            });
        } else {
            options.Failed();
        }

    }
};

export const getPaymentIntent = (options: GetPaymentIntentOptions): void => {
    let getResponse = null;
    if (options.paymentIntentId) {

        getResponse = options.stripe.API.createApiRequest({id: options.paymentIntentId}, 'get', 'v1/payment_intents');
    }

    if (getResponse?.id) {
        options.Found(getResponse);
    } else {
        options.NotFound();
    }
};

export const updatePaymentIntentAmount = (options: UpdatePaymentIntentAmountOptions): void => {

    let updateResponse = null;
    try {
        if (options.paymentIntentId) {

            updateResponse = options.stripe.API.createApiRequest({id: options.paymentIntentId, metadata: {stripefee: (options.newAmount - options.oldAmount).toFixed(0)}, amount: (options.newAmount).toFixed(0)}, 'update', 'v1/payment_intents');
        }

        log.debug('updateResponse', updateResponse);
    } catch (err) {

    }

    if (updateResponse?.id) {
        options.Success(updateResponse);
    } else {
        options.Failed();
    }
};

export const getPaymentIntents = (options: GetPaymentIntentsOptions): void => {
    let charges = [];
    try {

        charges = getPaymentIntentsData(options, [], 1);
        log.debug('charges', charges);

    } catch (err) {
        log.error('Error on getCharges', err);

    }
    if (charges.length > 0) {
        options.Found(charges.filter(charge => charge.status === 'succeeded' ));
    } else {
        options.NotFound();
    }
};

export const getPaymentIntentsData = (options: GetPaymentIntentsOptions, charges: any [], pageId?: number): any [] => {

    const stripeResponse = options.stripe.API.createApiRequest(options.params, 'search', 'v1/payment_intents');
    if (stripeResponse.data?.length > 0) {
        charges = charges.concat(stripeResponse.data);
        if (stripeResponse.has_more) {
            pageId = +pageId + 1;
            options.params.page = pageId;
            getPaymentIntentsData(options, charges);
        }
    }

    return charges;
};

export const updatePaymentIntent = (options: UpdatePaymentIntentOptions2): void => {

    let updateResponse = null;
    try {
        if (options.params) {

            const getResponse = options.stripe.API.createApiRequest({id: options.params.id}, 'get', 'v1/payment_intents');
            log.debug('getResponse', getResponse);
            if (getResponse) {
                const filteredPaymentMethodTypes = getResponse.payment_method_types.filter(type => type !== 'customer_balance');
                if (filteredPaymentMethodTypes.length > 0) {

                    options.params.payment_method_types = filteredPaymentMethodTypes;
                }
            }

            updateResponse = options.stripe.API.createApiRequest(options.params, 'update', 'v1/payment_intents');
        }

        log.debug('updateResponse', updateResponse);
    } catch (err) {

    }

    if (updateResponse?.id) {
        options.Success(updateResponse);
    } else {
        options.Failed();
    }
};

interface CreatePaymentIntentOptions {
    currencyCode: string;
    stripeCustomerId: string;
    amount: number;
    recordType: string;
    recordId: number;
    stripe: Stripe;
    retry?: boolean;
    Success(paymentIntent: any): void;
    Failed(): void;
}

interface GetPaymentIntentOptions {
    paymentIntentId: string;
    stripe: Stripe;
    Found(paymentIntent: any): void;
    NotFound(): void;
}

interface UpdatePaymentIntentOptions2 {
    params: any;
    stripe: Stripe;
    Success(paymentIntent: any): void;
    Failed(): void;
}

interface UpdatePaymentIntentAmountOptions {
    paymentIntentId: string;
    oldAmount: number;
    newAmount: number;
    stripe: Stripe;
    Success(paymentIntent: any): void;
    Failed(): void;
}

interface UpdatePaymentIntentOptions {
    paymentIntentId: string;
    oldAmount: number;
    newAmount: number;
    stripe: Stripe;
    Success(paymentIntent: any): void;
    Failed(): void;
}

interface GetPaymentIntentsOptions {
    stripe: Stripe;
    params: any;
    Found(disputes: any[]): void;
    NotFound(): void;
}
