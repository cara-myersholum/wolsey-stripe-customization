/**
 * @copyright 2022 Myers-Holum Inc.
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 * @NScriptType Suitelet
 */
define(["require", "exports", "N/https", "./Form/PaymentManagementForm", "../StripeAPI/Stripe", "N/log", "N/record", "N/ui/message", "../Utils/Common"], function (require, exports, https, PaymentManagementForm_1, Stripe_1, log, record, message, Common_1) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.writePage = exports.onRequest = void 0;
    const onRequest = (context) => {
        var _a, _b, _c;
        switch (context.request.method) {
            case https.Method.GET:
                let setupIntentId = null;
                let paymentMethodId = null;
                let last4 = null;
                let failedToUpdate = false;
                if (context.request.parameters.sub) {
                    log.debug('params 2', context.request.parameters);
                    const stripe = new Stripe_1.Stripe({ subsidiary: context.request.parameters.sub });
                    if (context.request.parameters.pm) {
                        const updateResponse = stripe.API.createApiRequest({
                            id: context.request.parameters.cs,
                            invoice_settings: { default_payment_method: context.request.parameters.pm }
                        }, 'update', 'v1/customers');
                        log.debug('updateResponse', updateResponse);
                        paymentMethodId = context.request.parameters.pm;
                    }
                    const setupIntent = stripe.API.createApiRequest({ id: context.request.parameters.setup_intent }, 'get', 'v1/setup_intents');
                    log.debug('setupIntent', setupIntent);
                    setupIntentId = setupIntent === null || setupIntent === void 0 ? void 0 : setupIntent.id;
                    if (setupIntent === null || setupIntent === void 0 ? void 0 : setupIntent.payment_method) {
                        paymentMethodId = setupIntent.payment_method;
                    }
                    if (setupIntent.customer && setupIntent.payment_method) {
                        const customerUpdate = stripe.API.createApiRequest({
                            id: setupIntent.customer,
                            invoice_settings: { default_payment_method: setupIntent.payment_method }
                        }, 'update', 'v1/customers');
                        if (((_b = (_a = customerUpdate === null || customerUpdate === void 0 ? void 0 : customerUpdate.error) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.length) > 0) {
                            failedToUpdate = true;
                        }
                        log.debug('customerUpdate', customerUpdate);
                    }
                }
                try {
                    const decrypted = (0, Common_1.decode)(context.request.parameters.p);
                    const parsed = (0, Common_1.parseQueryString)(decrypted);
                    log.debug('parsed', parsed);
                    const entityId = +parsed.a; // internalid of the customer
                    const stripe = new Stripe_1.Stripe({ subsidiary: context.request.parameters.sub });
                    if (paymentMethodId) {
                        const paymentMethod = stripe.API.createApiRequest({ id: paymentMethodId }, 'get', 'v1/payment_methods');
                        if (paymentMethod === null || paymentMethod === void 0 ? void 0 : paymentMethod.type) {
                            switch (paymentMethod.type) {
                                case 'card':
                                    last4 = `${paymentMethod.card.brand.toUpperCase()}   ****${paymentMethod.card.last4}   ${paymentMethod.card.exp_month}/${paymentMethod.card.exp_year}`.toUpperCase();
                                    break;
                                case 'us_bank_account':
                                    last4 = `${paymentMethod.us_bank_account.bank_name.toUpperCase()}   ****${paymentMethod.us_bank_account.last4}  ${paymentMethod.us_bank_account.account_type.toUpperCase()}`.toUpperCase();
                                    break;
                                case 'sepa_debit':
                                    last4 = `SEPA Direct Debit   ****${paymentMethod.sepa_debit.last4}`.toUpperCase();
                                    break;
                                case 'acss_debit':
                                    last4 = `CANADA Pre-Authorized Debit   ****${paymentMethod.acss_debit.last4}`.toUpperCase();
                                    break;
                                case 'bacs_debit':
                                    last4 = `UK BACS DIRECT DEBIT   ****${paymentMethod.bacs_debit.last4}`.toUpperCase();
                                    break;
                                case 'au_becs_debit':
                                    last4 = `AU BECS DIRECT DEBIT   ****${paymentMethod.au_becs_debit.last4}`.toUpperCase();
                                    break;
                                default:
                                    last4 = (_c = paymentMethod[paymentMethod.type]) === null || _c === void 0 ? void 0 : _c.last4;
                                    break;
                            }
                        }
                    }
                    record.submitFields({
                        id: entityId,
                        type: record.Type.CUSTOMER,
                        values: {
                            custentity_mhi_setup_intent: setupIntentId,
                            custentity_mhi_payment_method: paymentMethodId,
                            custentity_mhi_payment_method_last4: last4,
                            custentity_mhi_payment_method_failed: failedToUpdate,
                        }
                    });
                }
                catch (e) {
                }
                const paymentManagementForm = new PaymentManagementForm_1.PaymentManagementForm(context);
                if (context.request.parameters.redirect_status === "succeeded") {
                    paymentManagementForm.FORM.addPageInitMessage({
                        duration: 10000,
                        message: "Successfully Added Payment Method.<br>Note: Microdeposits need to be verified for it to appear in the page",
                        title: "Success!",
                        type: message.Type.CONFIRMATION
                    });
                }
                (0, exports.writePage)(context, paymentManagementForm.FORM);
                break;
            default:
                const parameters = context.request.parameters.p;
                const decrypted = (0, Common_1.decode)(parameters);
                const parsed = (0, Common_1.parseQueryString)(decrypted);
                log.debug('parsed', parsed);
                log.debug('params', context.request.parameters);
                const stripe = new Stripe_1.Stripe({ subsidiary: context.request.parameters.s });
                let response = null;
                if (context.request.parameters.default) {
                    response = stripe.API.createApiRequest({
                        id: context.request.parameters.cs,
                        invoice_settings: { default_payment_method: context.request.parameters.pm }
                    }, 'update', 'v1/customers');
                    log.debug('updateResponse', response);
                }
                else {
                    response = stripe.API.createApiRequest({
                        id: context.request.parameters.pm,
                        customer: context.request.parameters.cs
                    }, 'detach', 'v1/payment_methods');
                    log.debug('detachResponse', response);
                }
                (0, exports.writePage)(context, response);
                break;
        }
    };
    exports.onRequest = onRequest;
    const writePage = (context, form) => {
        // If html page, use context.response.write else, writePage
        if (typeof form === 'string') {
            context.response.write(form);
        }
        else {
            context.response.writePage(form);
        }
    };
    exports.writePage = writePage;
});
