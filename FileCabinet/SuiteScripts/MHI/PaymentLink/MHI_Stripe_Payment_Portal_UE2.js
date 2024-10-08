/**
 * @copyright 2022 Myers-Holum Inc.
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 * @NScriptType UserEventScript
 */
define(["require", "exports", "N/record", "N/log", "./Stripe/Payment_Intent", "../StripeAPI/Stripe", "../Utils/Common", "./NetSuite/SalesOrder"], function (require, exports, record, log, Payment_Intent_1, Stripe_1, Common_1, SalesOrder_1) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.afterSubmit = exports.beforeSubmit = void 0;
    const beforeSubmit = (context) => {
        try {
            switch (context.type) {
                case context.UserEventType.CREATE:
                    const subsidiaryId = +context.newRecord.getValue({ fieldId: 'subsidiary' });
                    let paymentIntentId = context.newRecord.getValue({ fieldId: 'custbody_stripe_payment_intentid' });
                    const authorizationCode = context.newRecord.getValue({ fieldId: 'custbody_suitesync_authorization_code' });
                    if (authorizationCode) {
                        if (authorizationCode.indexOf('pi_') > -1) {
                            paymentIntentId = authorizationCode;
                        }
                    }
                    if (paymentIntentId && paymentIntentId.length > 0) {
                        // Load the stripe API class
                        const stripe = new Stripe_1.Stripe({ subsidiary: subsidiaryId });
                        (0, Payment_Intent_1.getPaymentIntent)({
                            stripe: stripe,
                            paymentIntentId: paymentIntentId,
                            Found: payment_intent => {
                                var _a, _b;
                                if ((_a = payment_intent.metadata) === null || _a === void 0 ? void 0 : _a.netsuite_transaction_id) {
                                    const transactionDetails = (0, Common_1.getTransactionDetails)({ transactionId: (_b = payment_intent.metadata) === null || _b === void 0 ? void 0 : _b.netsuite_transaction_id });
                                    const subsidiaryId = +transactionDetails.subsidiary.value;
                                    if (subsidiaryId > 0) {
                                        context.newRecord.setValue({ fieldId: 'subsidiary', value: subsidiaryId });
                                        log.debug('changing subsidiary', subsidiaryId);
                                    }
                                }
                            },
                            NotFound: () => {
                            }
                        });
                    }
                    break;
                default:
                    // Do Nothing
                    break;
            }
        }
        catch (error) {
            log.debug('Error on Stripe Payment Portal UE', error);
        }
    };
    exports.beforeSubmit = beforeSubmit;
    const afterSubmit = (context) => {
        try {
            switch (context.type) {
                case context.UserEventType.CREATE:
                    // case context.UserEventType.EDIT:
                    let customerPayment = record.load({
                        type: record.Type.CUSTOMER_PAYMENT,
                        id: context.newRecord.id,
                        isDynamic: true
                    });
                    const subsidiaryId = +customerPayment.getValue({ fieldId: 'subsidiary' });
                    let paymentIntentId = customerPayment.getValue({ fieldId: 'custbody_stripe_payment_intentid' });
                    const authorizationCode = customerPayment.getValue({ fieldId: 'custbody_suitesync_authorization_code' });
                    if (authorizationCode) {
                        if (authorizationCode.indexOf('pi_') > -1) {
                            paymentIntentId = authorizationCode;
                        }
                    }
                    log.debug('paymentIntentId', paymentIntentId);
                    if (paymentIntentId && paymentIntentId.length > 0) {
                        // Load the stripe API class
                        const stripe = new Stripe_1.Stripe({ subsidiary: subsidiaryId });
                        (0, Payment_Intent_1.getPaymentIntent)({
                            stripe: stripe,
                            paymentIntentId: paymentIntentId,
                            Found: payment_intent => {
                                var _a, _b;
                                log.debug('payment_intent.metadata', payment_intent.metadata);
                                if ((_a = payment_intent.metadata) === null || _a === void 0 ? void 0 : _a.netsuite_transaction_id) {
                                    const transactionDetails = (0, Common_1.getTransactionDetails)({ transactionId: (_b = payment_intent.metadata) === null || _b === void 0 ? void 0 : _b.netsuite_transaction_id });
                                    log.debug('payment_intent.transactionDetails', transactionDetails);
                                    (0, SalesOrder_1.generateSalesOrder)({
                                        recordId: transactionDetails.internalid,
                                        recordType: transactionDetails.recordtype,
                                        charge: payment_intent,
                                        Success: invoiceId => {
                                            log.debug('payment_intent.invoiceId', invoiceId);
                                            customerPayment = record.load({
                                                type: record.Type.CUSTOMER_PAYMENT,
                                                id: context.newRecord.id,
                                                isDynamic: true
                                            });
                                            // Loop thru all the payment event detail
                                            const customerPaymentIndex = customerPayment.findSublistLineWithValue({ sublistId: 'apply', fieldId: 'internalid', value: `${invoiceId}` });
                                            const paymentAmount = payment_intent.amount / 100;
                                            // If index is found, apply it and set the amount
                                            if (customerPaymentIndex > -1) {
                                                customerPayment.selectLine({ sublistId: 'apply', line: customerPaymentIndex });
                                                customerPayment.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'apply', value: true });
                                                customerPayment.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'amount', value: paymentAmount });
                                            }
                                            // Save the customer record
                                            customerPayment.save({ ignoreMandatoryFields: true });
                                        },
                                        Failed: () => {
                                        }
                                    });
                                }
                            },
                            NotFound: () => {
                            }
                        });
                    }
                    break;
                default:
                    // Do Nothing
                    break;
            }
        }
        catch (error) {
            log.debug('Error on Stripe Payment Portal UE', error);
        }
    };
    exports.afterSubmit = afterSubmit;
});
