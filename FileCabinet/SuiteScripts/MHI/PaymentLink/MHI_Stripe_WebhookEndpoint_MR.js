/**
 * @copyright 2022 Myers-Holum Inc.
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @NScriptType MapReduceScript
 */
define(["require", "exports", "N/search", "N/log", "./Stripe/Payment_Intent", "../Utils/Common", "../StripeAPI/Stripe", "./Stripe/Charge", "./Record/Stripe_Pending_Payment"], function (require, exports, search, log, Payment_Intent_1, Common_1, Stripe_1, Charge_1, Stripe_Pending_Payment_1) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.summarize = exports.map = exports.getInputData = void 0;
    const getInputData = () => {
        // Load the saved search for invoices
        return search.load({ id: 'customsearch_mhi_stripe_pending_payment' });
    };
    exports.getInputData = getInputData;
    const map = (context) => {
        // Parse the values from get Input Stage
        const values = JSON.parse(context.value);
        log.debug('values', values);
        // Get the netsuite transaction id & fields
        const pendingPaymentId = +values.id;
        const transactionId = +values.values['custrecord_mhi_stripe_pending_trans'].value;
        const paymentIntentId = values.values['custrecord_mhi_stripe_pending_id'];
        if (paymentIntentId) {
            if (+transactionId > 0) {
                const recordDetails = (0, Common_1.getTransactionDetails)({ transactionId: transactionId });
                const subsidiaryId = +recordDetails.subsidiary.value;
                const stripe = new Stripe_1.Stripe({ subsidiary: subsidiaryId });
                (0, Payment_Intent_1.getPaymentIntent)({
                    stripe: stripe,
                    paymentIntentId: paymentIntentId,
                    Found: payment_intent => {
                        // Read the charge object from stripe
                        (0, Charge_1.getCharge)({
                            stripe: stripe,
                            chargeId: payment_intent.latest_charge,
                            Found: charge => {
                                switch (charge.status) {
                                    case 'failed':
                                        Stripe_Pending_Payment_1.Stripe_Pending_Payment.updateStatus(paymentIntentId, Stripe_Pending_Payment_1.Stripe_Pending_Payment_Status.FAIL, charge.failure_message);
                                        break;
                                    case 'succeeded':
                                        Stripe_Pending_Payment_1.Stripe_Pending_Payment.updateStatus(paymentIntentId, Stripe_Pending_Payment_1.Stripe_Pending_Payment_Status.SUCCESS);
                                        break;
                                    default:
                                        break;
                                }
                            },
                            NotFound: () => {
                            }
                        });
                    },
                    NotFound: () => {
                    }
                });
            }
            else {
                Stripe_Pending_Payment_1.Stripe_Pending_Payment.updateStatus(paymentIntentId, Stripe_Pending_Payment_1.Stripe_Pending_Payment_Status.FAIL, `No Transaction Linked`);
            }
        }
        context.write({
            key: `${pendingPaymentId}`,
            value: `${pendingPaymentId}`,
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
