/**
 * @copyright 2022 Myers-Holum Inc.
 *
 * @NApiVersion 2.1
 */
define(["require", "exports", "N/log"], function (require, exports, log) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getSetupIntent = exports.createSetupIntent = void 0;
    const createSetupIntent = (options) => {
        let paymentResponse = null;
        try {
            const params = { customer: options.stripeCustomerId, payment_method_types: options.paymentMethods,
                payment_method_options: {
                    acss_debit: {
                        mandate_options: {
                            payment_schedule: 'sporadic',
                            transaction_type: 'business',
                        },
                        currency: 'cad'
                    },
                } };
            if (options.retry) {
                params['automatic_payment_methods[enabled]'] = true;
                delete params['payment_method_types'];
            }
            log.debug('params', params);
            paymentResponse = options.stripe.API.createApiRequest(params, 'create', 'v1/setup_intents');
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
                (0, exports.createSetupIntent)({
                    paymentMethods: options.paymentMethods,
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
    exports.createSetupIntent = createSetupIntent;
    const getSetupIntent = (options) => {
        let getResponse = null;
        if (options.id) {
            getResponse = options.stripe.API.createApiRequest({ id: options.id }, 'get', 'v1/setup_intents');
        }
        log.debug('getSetupIntent', getResponse);
        if (getResponse === null || getResponse === void 0 ? void 0 : getResponse.id) {
            options.Found(getResponse);
        }
        else {
            options.NotFound();
        }
    };
    exports.getSetupIntent = getSetupIntent;
});
