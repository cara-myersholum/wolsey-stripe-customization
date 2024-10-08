/**
 * @copyright 2022 Myers-Holum Inc.
 *
 * @NApiVersion 2.1
 */
define(["require", "exports", "N/log", "../../Utils/Common"], function (require, exports, log, Common_1) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getCharge = exports.updateChargeMetadata = void 0;
    const updateChargeMetadata = (options) => {
        let charge = null;
        let upsertChargeResponse = null;
        log.debug('upsertChargeResponse options', options);
        const params = {};
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
            case 'customerpayment':
                params.metadata = {
                    netsuite_customer_payment_id: options.recordId,
                    netsuite_customer_payment_link: `https://${(0, Common_1.getAccountId)()}.app.netsuite.com/app/accounting/transactions/custpymt.nl?id=${options.recordId}`,
                    netsuite_allow_integration: true
                };
                break;
            default:
                break;
        }
        // If it uses charge
        if (options.stripeChargeId) {
            params.id = options.stripeChargeId;
            upsertChargeResponse = options.stripe.API.createApiRequest(params, 'update', 'v1/charges');
        }
        if (options.stripePaymentIntentId) {
            params.id = options.stripePaymentIntentId;
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
        }
        else {
            // Else pass the error message response
            options.NotFound(upsertChargeResponse);
        }
    };
    exports.updateChargeMetadata = updateChargeMetadata;
    const getCharge = (options) => {
        let getResponse = null;
        if (options.chargeId) {
            getResponse = options.stripe.API.createApiRequest({ id: options.chargeId }, 'get', 'v1/charges');
        }
        if (getResponse.id) {
            options.Found(getResponse);
        }
        else {
            options.NotFound();
        }
    };
    exports.getCharge = getCharge;
});
