/**
 * @copyright 2022 Myers-Holum Inc.
 *
 * @NApiVersion 2.1
 */
define(["require", "exports", "N/log", "../../Utils/Common", "N/url"], function (require, exports, log, Common_1, url) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.updatePaymentIntent = exports.getPaymentIntentsData = exports.getPaymentIntents = exports.updatePaymentIntentAmount = exports.getPaymentIntent = exports.createPaymentIntent = void 0;
    const createPaymentIntent = (options) => {
        let paymentResponse = null;
        try {
            log.debug('options', options);
            let stripeAmount = options.amount;
            if (options.currencyCode !== 'JPY') {
                stripeAmount = options.amount * 100;
            }
            let transactionURL = `https://${(0, Common_1.getAccountId)()}.app.netsuite.com${url.resolveRecord({
                recordType: options.recordType,
                recordId: options.recordId,
            })}`;
            transactionURL = transactionURL.substring(0, transactionURL.indexOf('&'));
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
            const params = { customer: options.stripeCustomerId, amount: `${(stripeAmount).toFixed(0)}`, setup_future_usage: 'off_session', currency: options.currencyCode,
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
                        netsuite_customer_deposit: options.recordId,
                        netsuite_customer_deposit_link: `https://${(0, Common_1.getAccountId)()}.app.netsuite.com/app/accounting/transactions/custdep.nl?id=${options.recordId}` // The url of the customer deposit
                    };
                    break;
                case 'salesorder':
                    params.metadata = {
                        netsuite_sales_order_id: options.recordId,
                        netsuite_sales_order_link: `https://${(0, Common_1.getAccountId)()}.app.netsuite.com/app/accounting/transactions/salesord.nl?id=${options.recordId}`,
                        netsuite_allow_integration: true
                    };
                    break;
                case 'invoice':
                    params.metadata = {
                        netsuite_invoice_id: options.recordId,
                        netsuite_invoice_link: `https://${(0, Common_1.getAccountId)()}.app.netsuite.com/app/accounting/transactions/custinvc.nl?id=${options.recordId}`,
                        netsuite_allow_integration: true
                    };
                    break;
                case 'invoicegroup':
                    params.metadata = {
                        netsuite_invoice_group_id: options.recordId,
                        netsuite_invoice_group_link: `https://${(0, Common_1.getAccountId)()}.app.netsuite.com/app/accounting/transactions/invcgroup.nl?id=${options.recordId}`,
                        netsuite_allow_integration: true
                    };
                    break;
                default:
                    params.metadata = {
                        netsuite_transaction_id: options.recordId,
                        netsuite_transaction_type: options.recordType,
                        netsuite_transaction_link: transactionURL
                    };
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
            paymentResponse = options.stripe.API.createApiRequest(params, 'create', 'v1/payment_intents', { 'Idempotency-Key': `${new Date().toString()}` });
            log.debug('paymentResponse', paymentResponse);
        }
        catch (err) {
        }
        if (paymentResponse === null || paymentResponse === void 0 ? void 0 : paymentResponse.id) {
            options.Success(paymentResponse);
        }
        else {
            if (!options.retry) {
                // Create the payment intent
                (0, exports.createPaymentIntent)({
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
                        options.Failed();
                    }
                });
            }
            else {
                options.Failed();
            }
        }
    };
    exports.createPaymentIntent = createPaymentIntent;
    const getPaymentIntent = (options) => {
        let getResponse = null;
        if (options.paymentIntentId) {
            getResponse = options.stripe.API.createApiRequest({ id: options.paymentIntentId }, 'get', 'v1/payment_intents');
        }
        if (getResponse === null || getResponse === void 0 ? void 0 : getResponse.id) {
            options.Found(getResponse);
        }
        else {
            options.NotFound();
        }
    };
    exports.getPaymentIntent = getPaymentIntent;
    const updatePaymentIntentAmount = (options) => {
        let updateResponse = null;
        try {
            if (options.paymentIntentId) {
                updateResponse = options.stripe.API.createApiRequest({ id: options.paymentIntentId, metadata: { stripefee: (options.newAmount - options.oldAmount).toFixed(0) }, amount: (options.newAmount).toFixed(0) }, 'update', 'v1/payment_intents');
            }
            log.debug('updateResponse', updateResponse);
        }
        catch (err) {
        }
        if (updateResponse === null || updateResponse === void 0 ? void 0 : updateResponse.id) {
            options.Success(updateResponse);
        }
        else {
            options.Failed();
        }
    };
    exports.updatePaymentIntentAmount = updatePaymentIntentAmount;
    const getPaymentIntents = (options) => {
        let charges = [];
        try {
            charges = (0, exports.getPaymentIntentsData)(options, [], 1);
            log.debug('charges', charges);
        }
        catch (err) {
            log.error('Error on getCharges', err);
        }
        if (charges.length > 0) {
            options.Found(charges.filter(charge => charge.status === 'succeeded'));
        }
        else {
            options.NotFound();
        }
    };
    exports.getPaymentIntents = getPaymentIntents;
    const getPaymentIntentsData = (options, charges, pageId) => {
        var _a;
        const stripeResponse = options.stripe.API.createApiRequest(options.params, 'search', 'v1/payment_intents');
        if (((_a = stripeResponse.data) === null || _a === void 0 ? void 0 : _a.length) > 0) {
            charges = charges.concat(stripeResponse.data);
            if (stripeResponse.has_more) {
                pageId = +pageId + 1;
                options.params.page = pageId;
                (0, exports.getPaymentIntentsData)(options, charges);
            }
        }
        return charges;
    };
    exports.getPaymentIntentsData = getPaymentIntentsData;
    const updatePaymentIntent = (options) => {
        let updateResponse = null;
        try {
            if (options.params) {
                const getResponse = options.stripe.API.createApiRequest({ id: options.params.id }, 'get', 'v1/payment_intents');
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
        }
        catch (err) {
        }
        if (updateResponse === null || updateResponse === void 0 ? void 0 : updateResponse.id) {
            options.Success(updateResponse);
        }
        else {
            options.Failed();
        }
    };
    exports.updatePaymentIntent = updatePaymentIntent;
});
