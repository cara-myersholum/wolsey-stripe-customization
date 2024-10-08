/**
 * @copyright 2022 Myers-Holum Inc.
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @NScriptType MapReduceScript
 */
define(["require", "exports", "N/log", "../StripeAPI/Stripe", "./Stripe/Payment_Intent", "./NetSuite/SalesOrder", "../Utils/Common", "../Record/Stripe_Setup", "./Stripe/Charge", "../Record/Stripe_Event_Log"], function (require, exports, log, Stripe_1, Payment_Intent_1, SalesOrder_1, Common_1, Stripe_Setup_1, Charge_1, Stripe_Event_Log_1) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.summarize = exports.map = exports.getInputData = void 0;
    const getInputData = () => {
        // This will contain all JSON from stripe dispute, payout & charges
        const data = [];
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        startDate.setHours(0, 0, 0, 0);
        const stripeIds = Stripe_Setup_1.Stripe_Setup.getAllSetupIds();
        stripeIds.forEach(stripeId => {
            const stripe = new Stripe_1.Stripe({ id: stripeId });
            const yesterday = stripe.API.getUnixTime(startDate);
            // Get list of charges
            (0, Payment_Intent_1.getPaymentIntents)({
                stripe: stripe,
                params: { query: `-metadata[\'netsuite_transaction_id\']: null AND metadata[\'netsuite_sales_order_id\']: null AND created > ${yesterday}`, limit: 100 },
                Found: charges => {
                    // add the payouts to our array
                    data.push(...charges);
                },
                NotFound: () => {
                    // Nothing to do here.
                }
            });
        });
        return data;
    };
    exports.getInputData = getInputData;
    const map = (context) => {
        var _a, _b, _c;
        // Parse the values from get Input Stage
        const values = JSON.parse(context.value);
        if (((_a = values.metadata) === null || _a === void 0 ? void 0 : _a.netsuite_transaction_id) && !((_b = values.metadata) === null || _b === void 0 ? void 0 : _b.netsuite_sales_order_id)) {
            const transactionDetails = (0, Common_1.getTransactionDetails)({ transactionId: (_c = values.metadata) === null || _c === void 0 ? void 0 : _c.netsuite_transaction_id });
            (0, SalesOrder_1.generateSalesOrder)({
                recordId: transactionDetails.internalid,
                recordType: transactionDetails.recordtype,
                charge: values,
                Success: salesOrderId => {
                    Stripe_Event_Log_1.Stripe_Event_Log.updateStatus(values.id, Stripe_Event_Log_1.Stripe_Event_Log_Status.SUCCESS);
                    // Update the metadata
                    (0, Charge_1.updateChargeMetadata)({
                        recordId: salesOrderId,
                        recordType: 'salesorder',
                        stripe: new Stripe_1.Stripe({ subsidiary: +transactionDetails.subsidiary.value }),
                        stripeChargeId: values.latest_charge,
                        stripePaymentIntentId: values.id,
                        Found(charge) {
                        }, NotFound(response) {
                        }
                    });
                },
                Failed: () => {
                }
            });
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
