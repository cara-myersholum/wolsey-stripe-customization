/**
 * @copyright 2022 Myers-Holum Inc.
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @NScriptType MapReduceScript
 */
define(["require", "exports", "N/log", "N/search", "../StripeAPI/Stripe", "./Stripe/Setup_Intent", "N/record"], function (require, exports, log, search, Stripe_1, Setup_Intent_1, record) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.summarize = exports.map = exports.getInputData = void 0;
    const getInputData = () => {
        return search.load({ id: 'customsearch_mhi_stripe_pm_search' });
    };
    exports.getInputData = getInputData;
    const map = (context) => {
        // Parse the values from get Input Stage
        const values = JSON.parse(context.value).values;
        const customerId = JSON.parse(context.value).id;
        log.debug('values', values);
        const subsidiaryId = values.subsidiary.value;
        const setupIntentId = values.custentity_mhi_setup_intent;
        const stripe = new Stripe_1.Stripe({ subsidiary: +subsidiaryId });
        log.debug('stripe appid', stripe.SETUP.appid);
        log.debug('stripe secret', stripe.SETUP.secret);
        log.debug('subsidiaryId', subsidiaryId);
        log.debug('setupIntentId', setupIntentId);
        // Get list of charges
        (0, Setup_Intent_1.getSetupIntent)({
            stripe: stripe,
            id: setupIntentId,
            Found: setup_intent => {
                var _a;
                log.debug('setup_intent', setup_intent);
                if ((setup_intent === null || setup_intent === void 0 ? void 0 : setup_intent.status) === 'succeeded') {
                    const customerUpdate = stripe.API.createApiRequest({
                        id: setup_intent.customer,
                        invoice_settings: { default_payment_method: setup_intent.payment_method }
                    }, 'update', 'v1/customers');
                    if (customerUpdate === null || customerUpdate === void 0 ? void 0 : customerUpdate.id) {
                        if (setup_intent === null || setup_intent === void 0 ? void 0 : setup_intent.payment_method) {
                            let last4 = null;
                            const paymentMethod = stripe.API.createApiRequest({ id: setup_intent.payment_method }, 'get', 'v1/payment_methods');
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
                                        last4 = (_a = paymentMethod[paymentMethod.type]) === null || _a === void 0 ? void 0 : _a.last4;
                                        break;
                                }
                            }
                            if (last4) {
                                record.submitFields({
                                    id: customerId,
                                    type: record.Type.CUSTOMER,
                                    values: {
                                        custentity_mhi_payment_method: setup_intent.payment_method,
                                        custentity_mhi_payment_method_last4: last4,
                                        custentity_mhi_payment_method_failed: false
                                    }
                                });
                            }
                        }
                    }
                }
            },
            NotFound: () => {
                // Nothing to do here.
            }
        });
    };
    exports.map = map;
    const summarize = (context) => {
        try {
            context.mapSummary.errors.iterator().each((key, error) => {
                log.audit('error', JSON.parse(error));
                return true;
            });
        }
        catch (e) {
        }
    };
    exports.summarize = summarize;
});
