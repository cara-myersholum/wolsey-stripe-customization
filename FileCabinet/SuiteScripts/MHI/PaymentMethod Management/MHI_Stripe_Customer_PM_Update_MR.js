/**
 * @copyright 2022 Myers-Holum Inc.
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @NScriptType MapReduceScript
 */
define(["require", "exports", "N/record", "N/log", "../StripeAPI/Stripe", "../Record/Stripe_Setup", "./Stripe/Customer"], function (require, exports, record, log, Stripe_1, Stripe_Setup_1, Customer_1) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.summarize = exports.map = exports.getInputData = void 0;
    const getInputData = () => {
        const data = [];
        const stripeIds = Stripe_Setup_1.Stripe_Setup.getAllSetupIds();
        stripeIds.forEach(stripeId => {
            const stripe = new Stripe_1.Stripe({ id: stripeId });
            // Get list of charges
            (0, Customer_1.getCustomers)({
                stripe: stripe,
                params: { query: `-metadata[\'netsuite_customer_id\']: null`, limit: 100 },
                Found: customers => {
                    // add the customers to our array
                    customers.forEach(customer => {
                        customer.stripeId = stripeId;
                    });
                    data.push(...customers);
                },
                NotFound: () => {
                    // Nothing to do here.
                }
            });
        });
        log.debug('customers length', data.length);
        log.debug('customers', data);
        return data;
    };
    exports.getInputData = getInputData;
    const map = (context) => {
        var _a, _b;
        // Parse the values from get Input Stage
        const values = JSON.parse(context.value);
        const customerId = +((_a = values.metadata) === null || _a === void 0 ? void 0 : _a.netsuite_customer_id);
        const stripe = new Stripe_1.Stripe({ id: +values.stripeId });
        if (+customerId > 0) {
            const defaultPaymentSource = values.invoice_settings.default_payment_method || values.default_source || null;
            let last4 = null;
            if (defaultPaymentSource) {
                const paymentMethod = stripe.API.createApiRequest({ id: defaultPaymentSource }, 'get', 'v1/payment_methods');
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
                            last4 = (_b = paymentMethod[paymentMethod.type]) === null || _b === void 0 ? void 0 : _b.last4;
                            break;
                    }
                }
            }
            try {
                record.submitFields({
                    id: customerId,
                    type: record.Type.CUSTOMER,
                    values: {
                        custentity_mhi_payment_method: defaultPaymentSource,
                        custentity_mhi_payment_method_last4: last4
                    }
                });
                log.debug(`Customer ${customerId} Updated`, {
                    custentity_mhi_payment_method: defaultPaymentSource,
                    custentity_mhi_payment_method_last4: last4
                });
            }
            catch (err) {
                log.audit(`Customer ${customerId} Doesnt Exist/Not found`, err);
            }
        }
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
