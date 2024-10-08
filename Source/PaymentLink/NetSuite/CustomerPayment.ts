/**
 * @copyright 2022 Myers-Holum Inc.
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

import * as record from 'N/record';
import * as log from 'N/log';

// This function transforms an invoice to a customer payment
export const generateCustomerPayment = (options: GenerateCustomerPaymentOptions): void => {

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
            customerPayment.setValue({fieldId: 'externalid', value: options.charge.id});
            // Set the stripe charge id
            customerPayment.setValue({fieldId: 'custbody_stripe_chargeid', value: options.charge?.latest_charge});
            customerPayment.setValue({fieldId: 'custbody_stripe_payment_intentid', value: options.charge?.id});
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

        } catch (err) {
            error = err;
        }
    }

    // Return the customer payment id if successful
    if (+customerPaymentId > 0) {

        options.Success(customerPaymentId);
    } else if (error) {
        // Return the error
        options.Failed(error);
    }
};

export interface GenerateCustomerPaymentOptions {
    invoiceId: number;
    charge: any;
    Success(customerPaymentId: number): void;
    Failed(error: any): void;
}

export interface ErrorMessage {
    PaymentId?: string;
    FailureStage?: string;
    Error?: string | any;
}
