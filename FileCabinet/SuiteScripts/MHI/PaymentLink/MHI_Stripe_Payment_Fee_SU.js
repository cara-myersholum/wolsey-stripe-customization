/**
 * @copyright 2022 Myers-Holum Inc.

 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 * @NScriptType Suitelet
 */
define(["require", "exports", "N/https", "N/log", "N/currency", "./Stripe/Payment_Intent", "../StripeAPI/Stripe", "../Utils/Common"], function (require, exports, https, log, currency, Payment_Intent_1, Stripe_1, Common_1) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.onRequest = void 0;
    const onRequest = (context) => {
        switch (context.request.method) {
            case https.Method.GET:
                log.debug('context.request.parameters', context.request.parameters);
                const subsidiaryId = +context.request.parameters.si;
                const paymentIntentId = context.request.parameters.pi;
                const transactionId = context.request.parameters.ti;
                const recordType = context.request.parameters.ty;
                const action = context.request.parameters.ac;
                const stripe = new Stripe_1.Stripe({ subsidiary: subsidiaryId });
                switch (action) {
                    case 'save':
                        (0, Payment_Intent_1.updatePaymentIntent)({
                            stripe: stripe,
                            params: {
                                id: paymentIntentId,
                                setup_future_usage: 'off_session'
                            },
                            Success: paymentIntent => {
                                context.response.write('true');
                            },
                            Failed: () => {
                                context.response.write('false');
                            }
                        });
                        break;
                    default:
                        let amount = 0;
                        let newAmount = null;
                        let currencyCode = 'USD';
                        let updatedAlready = false;
                        (0, Payment_Intent_1.getPaymentIntent)({
                            stripe: stripe,
                            paymentIntentId: paymentIntentId,
                            Found: paymentIntent => {
                                var _a, _b;
                                amount = +paymentIntent.amount;
                                currencyCode = paymentIntent.currency.toUpperCase();
                                if (((_a = paymentIntent.metadata) === null || _a === void 0 ? void 0 : _a.stripefee) && +((_b = paymentIntent.metadata) === null || _b === void 0 ? void 0 : _b.stripefee) > 0) {
                                    updatedAlready = true;
                                }
                            },
                            NotFound: () => {
                                // test
                            }
                        });
                        let threshold = true;
                        // If threshold amount is set
                        if (stripe.BUNDLESCONFIGURATION.PAYMENTLINK_CREDITCARD_FEE_THRESHOLD_AMOUNT > 0) {
                            // Declare the USD amount
                            let usdAmount = amount;
                            if (currencyCode !== 'JPY') {
                                usdAmount = usdAmount / 100;
                            }
                            // If currency is not USD, convert it
                            if (currencyCode !== 'USD') {
                                const rate = currency.exchangeRate({
                                    source: currencyCode,
                                    target: 'USD',
                                    date: new Date()
                                });
                                usdAmount = amount * rate;
                            }
                            // Dont add fee if amt <= threshold
                            if (usdAmount <= stripe.BUNDLESCONFIGURATION.PAYMENTLINK_CREDITCARD_FEE_THRESHOLD_AMOUNT) {
                                threshold = false;
                            }
                        }
                        const isCreditChargeExcluded = (0, Common_1.isPaymentCreditChargeExcluded)(+transactionId, recordType);
                        newAmount = +stripe.BUNDLESCONFIGURATION.GENERAL_CALCULATE_STRIPE_FEES(amount);
                        // If charge stripe fee is checked
                        if (stripe.BUNDLESCONFIGURATION.PAYMENTLINK_CHARGE_CREDITCARD_FEE && amount > 0 && newAmount > 0 && subsidiaryId > 0 && paymentIntentId && threshold && !isCreditChargeExcluded && !updatedAlready) {
                            // Create the payment intent
                            (0, Payment_Intent_1.updatePaymentIntentAmount)({
                                stripe: stripe,
                                paymentIntentId: paymentIntentId,
                                oldAmount: +amount,
                                newAmount: +newAmount,
                                Success: paymentIntent => {
                                    context.response.write('true');
                                },
                                Failed: () => {
                                    context.response.write('false');
                                }
                            });
                        }
                        else {
                            context.response.write('false');
                        }
                        break;
                }
                break;
            default:
                break;
        }
    };
    exports.onRequest = onRequest;
});
