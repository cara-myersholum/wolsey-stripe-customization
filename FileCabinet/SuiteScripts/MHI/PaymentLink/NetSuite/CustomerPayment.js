/**
 * @copyright 2022 Myers-Holum Inc.
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 */
define(["require", "exports", "N/record", "N/log"], function (require, exports, record, log) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.generateCustomerPayment = void 0;
    // This function transforms an invoice to a customer payment
    const generateCustomerPayment = (options) => {
        var _a, _b;
        const tranid = null;
        let customerPaymentId = null;
        let error = null;
        log.debug('options', options);
        if (+options.invoiceId > 0) {
            try {
                // Transform the invoice to customer payment
                const customerPayment = record.transform({
                    fromType: record.Type.INVOICE,
                    fromId: options.invoiceId,
                    toType: record.Type.CUSTOMER_PAYMENT,
                    isDynamic: true
                });
                // Set the external id
                customerPayment.setValue({ fieldId: 'externalid', value: options.charge.id });
                // Set the stripe charge id
                customerPayment.setValue({ fieldId: 'custbody_stripe_chargeid', value: (_a = options.charge) === null || _a === void 0 ? void 0 : _a.latest_charge });
                customerPayment.setValue({ fieldId: 'custbody_stripe_payment_intentid', value: (_b = options.charge) === null || _b === void 0 ? void 0 : _b.id });
                const amount = (+options.charge.amount) / 100;
                // Get the index id of the invoice
                const index = customerPayment.findSublistLineWithValue({ sublistId: 'apply', fieldId: 'internalid', value: +options.invoiceId });
                // If index is found, set apply to true and save
                if (index > -1) {
                    customerPayment.selectLine({ sublistId: 'apply', line: index });
                    customerPayment.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'apply', value: true });
                    customerPayment.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'amount', value: amount });
                    customerPaymentId = customerPayment.save({
                        ignoreMandatoryFields: true
                    });
                }
            }
            catch (err) {
                error = err;
            }
        }
        // Return the customer payment id if successful
        if (+customerPaymentId > 0) {
            options.Success(customerPaymentId);
        }
        else if (error) {
            // Return the error
            options.Failed(error);
        }
    };
    exports.generateCustomerPayment = generateCustomerPayment;
});
