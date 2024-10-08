/**
 * @copyright 2022 Myers-Holum Inc.

 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 * @NScriptType Suitelet
 */
define(["require", "exports", "N/https", "N/record", "N/log", "../Utils/Common", "../StripeAPI/Stripe", "./Stripe/Charge", "./Record/Stripe_Pending_Payment"], function (require, exports, https, record, log, Common_1, Stripe_1, Charge_1, Stripe_Pending_Payment_1) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.onRequest = void 0;
    const onRequest = (context) => {
        switch (context.request.method) {
            case https.Method.GET:
            case https.Method.POST:
                // Check the parameters passed
                const event = context.request.parameters;
                log.debug('parameters', event);
                if (event === null || event === void 0 ? void 0 : event.id) {
                    switch (event.type) {
                        case 'payment_intent.succeeded':
                        case 'charge.succeeded':
                            try {
                                const stripePendingPaymentId = Stripe_Pending_Payment_1.Stripe_Pending_Payment.updateStatus(event.data.object.id, Stripe_Pending_Payment_1.Stripe_Pending_Payment_Status.SUCCESS);
                                if (+stripePendingPaymentId > 0) {
                                    const stripePendingPayment = new Stripe_Pending_Payment_1.Stripe_Pending_Payment({ recordId: stripePendingPaymentId });
                                    const recordDetails = (0, Common_1.getTransactionDetails)({ transactionId: +stripePendingPayment.Lookup.custrecord_mhi_stripe_pending_trans[0].value });
                                    const stripe = new Stripe_1.Stripe({ subsidiary: +recordDetails.subsidiary.value });
                                    if (event.data.object.latest_charge) {
                                        // Update the metatada
                                        (0, Charge_1.updateChargeMetadata)({
                                            recordId: recordDetails.internalid,
                                            recordType: recordDetails.recordtype,
                                            stripe: stripe,
                                            stripeChargeId: event.data.object.latest_charge,
                                            Found(charge) {
                                            }, NotFound(response) {
                                            }
                                        });
                                        try {
                                            // Set the charge id and stripe payment intent id
                                            record.submitFields({
                                                type: recordDetails.recordtype,
                                                id: recordDetails.internalid,
                                                values: {
                                                    custbody_stripe_chargeid: `${event.data.object.latest_charge}`,
                                                    custbody_stripe_payment_intentid: `${event.data.object.id}`
                                                },
                                                options: { ignoreMandatoryFields: true }
                                            });
                                        }
                                        catch (er) {
                                            log.error('Error saving invoice', er);
                                        }
                                    }
                                }
                            }
                            catch (err) {
                                log.error('err', err);
                            }
                            break;
                        case 'payment_intent.payment_failed':
                        case 'charge.failed':
                            Stripe_Pending_Payment_1.Stripe_Pending_Payment.updateStatus(event.data.object.id, Stripe_Pending_Payment_1.Stripe_Pending_Payment_Status.FAIL, event.data.object.last_payment_error);
                            break;
                        default:
                            break;
                    }
                }
                break;
            default:
                break;
        }
    };
    exports.onRequest = onRequest;
});
