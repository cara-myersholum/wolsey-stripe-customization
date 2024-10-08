/**
 * @copyright 2022 Myers-Holum Inc.
 *
 * @NApiVersion 2.1
 */
define(["require", "exports", "N/log", "../../Utils/Common", "N/url"], function (require, exports, log, Common_1, url) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.updatePaymentIntentAmount = exports.addInvoiceMetadata = exports.capturePaymentIntent = exports.createPaymentIntentAuthorizeCapture = exports.getPaymentIntent = exports.createPaymentIntent = void 0;
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
                case 'EUR':
                    paymentMethodTypes.push('sepa_debit');
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
                payment_method_types: paymentMethodTypes,
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
                case 'estimate':
                    params.metadata = {
                        netsuite_transaction_id: options.recordId,
                        netsuite_transaction_link: `https://${(0, Common_1.getAccountId)()}.app.netsuite.com/app/accounting/transactions/estimate.nl?id=${options.recordId}`, // The url of the estimate
                    };
                    break;
                default:
                    break;
            }
            if (options.retry) {
                params['automatic_payment_methods[enabled]'] = true;
                delete params['payment_method_types'];
            }
            log.debug('params', params);
            paymentResponse = options.stripe.API.createApiRequest(params, 'create', 'v1/payment_intents');
            log.debug('paymentResponse', paymentResponse);
        }
        catch (err) {
        }
        if (paymentResponse.id) {
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
        if (getResponse.id) {
            options.Found(getResponse);
        }
        else {
            options.NotFound();
        }
    };
    exports.getPaymentIntent = getPaymentIntent;
    const createPaymentIntentAuthorizeCapture = (options) => {
        let paymentResponse = null;
        try {
            log.debug('options', options);
            let stripeAmount = options.amount;
            if (options.currencyCode !== 'JPY') {
                stripeAmount = options.amount * 100;
                // @ts-ignore
                stripeAmount = stripeAmount.toFixed(0);
            }
            let transactionURL = `https://${(0, Common_1.getAccountId)()}.app.netsuite.com${url.resolveRecord({
                recordType: options.recordType,
                recordId: options.recordId,
            })}`;
            transactionURL = transactionURL.substring(0, transactionURL.indexOf('&'));
            const paymentMethodTypes = ['card'];
            // Banks are not supported
            if (options.capture_method !== 'manual') {
                // Manage supported payment methods
                switch (options.currencyCode) {
                    case 'USD':
                        paymentMethodTypes.push('us_bank_account');
                        break;
                    case 'CAD':
                        paymentMethodTypes.push('acss_debit');
                        break;
                    case 'EUR':
                        paymentMethodTypes.push('sepa_debit');
                        break;
                    case 'GBP':
                        paymentMethodTypes.push('bacs_debit');
                        break;
                    default:
                        break;
                }
            }
            const params = { customer: options.stripeCustomerId, amount: `${stripeAmount}`, setup_future_usage: 'off_session', currency: options.currencyCode,
                payment_method_options: {
                    acss_debit: {
                        mandate_options: {
                            payment_schedule: 'sporadic',
                            transaction_type: 'business',
                        },
                    }
                },
                payment_method_types: paymentMethodTypes,
                metadata: {
                    netsuite_transaction_id: options.recordId,
                    netsuite_transaction_type: options.recordType,
                    netsuite_link: transactionURL
                }
            };
            if (options.recordType === 'invoice') {
                params.metadata['netsuite_invoice_id'] = options.recordId;
                delete params.metadata['netsuite_transaction_id'];
            }
            if (options.capture_method) {
                params['capture_method'] = options.capture_method;
                params['confirm'] = true;
            }
            if (options.payment_method) {
                params['payment_method'] = options.payment_method;
            }
            if (options.retry && options.capture_method !== 'manual') {
                params['automatic_payment_methods[enabled]'] = true;
                delete params['payment_method_types'];
            }
            log.debug('params', params);
            paymentResponse = options.stripe.API.createApiRequest(params, 'create', 'v1/payment_intents');
            log.debug('paymentResponse', paymentResponse);
        }
        catch (err) {
            log.debug('err', err);
        }
        if (paymentResponse === null || paymentResponse === void 0 ? void 0 : paymentResponse.id) {
            options.Success(paymentResponse);
        }
        else {
            if (!options.retry) {
                // Create the payment intent
                (0, exports.createPaymentIntentAuthorizeCapture)({
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
                    Failed: paymentResponse => {
                        options.Failed(paymentResponse);
                    }
                });
            }
            else {
                options.Failed(paymentResponse);
            }
        }
    };
    exports.createPaymentIntentAuthorizeCapture = createPaymentIntentAuthorizeCapture;
    const capturePaymentIntent = (options) => {
        let getResponse = null;
        let stripeAmount = options.amount * 100;
        // @ts-ignore
        stripeAmount = stripeAmount.toFixed(0);
        const params = {
            id: options.paymentIntentId,
            amount_to_capture: stripeAmount,
            metadata: {
                netsuite_invoice_id: `${options.netsuiteId}`,
                netsuite_invoice_link: `https://${(0, Common_1.getAccountId)()}.app.netsuite.com/app/accounting/transactions/custinvc.nl?id=${options.netsuiteId}`, // The url of the invoice
            }
        };
        log.debug('capturePaymentIntent params', params);
        if (options.paymentIntentId) {
            getResponse = options.stripe.API.createApiRequest(params, 'capture', 'v1/payment_intents');
        }
        log.debug('getResponse', getResponse);
        if (getResponse.id) {
            options.Success(getResponse);
        }
        else {
            options.Failed(getResponse);
        }
    };
    exports.capturePaymentIntent = capturePaymentIntent;
    const addInvoiceMetadata = (options) => {
        let getResponse = null;
        const params = {
            id: options.chargeId,
            metadata: {
                netsuite_invoice_id: `${options.netsuiteId}`,
                netsuite_invoice_link: `https://${(0, Common_1.getAccountId)()}.app.netsuite.com/app/accounting/transactions/custinvc.nl?id=${options.netsuiteId}`,
                netsuite_allow_integration: true
            }
        };
        log.debug('capturePaymentIntent params', params);
        if (options.chargeId) {
            getResponse = options.stripe.API.createApiRequest(params, 'update', 'v1/charges');
        }
        if (getResponse.id) {
            options.Success(getResponse);
        }
        else {
            options.Failed(getResponse);
        }
    };
    exports.addInvoiceMetadata = addInvoiceMetadata;
    const updatePaymentIntentAmount = (options) => {
        let updateResponse = null;
        if (options.paymentIntentId) {
            updateResponse = options.stripe.API.createApiRequest({ id: options.paymentIntentId, metadata: { stripefee: (options.newAmount - options.oldAmount).toFixed(0) }, amount: options.newAmount }, 'update', 'v1/payment_intents');
        }
        log.debug('updateResponse', updateResponse);
        if (updateResponse.id) {
            options.Success(updateResponse);
        }
        else {
            options.Failed();
        }
    };
    exports.updatePaymentIntentAmount = updatePaymentIntentAmount;
});
