/**
 * @copyright 2022 Myers-Holum Inc.
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

import * as record from 'N/record';
import * as log from 'N/log';
import * as search from "N/search";
import * as format from "N/format";

// This function transforms an invoice to a customer payment
export const generateSalesOrder = (options: GenerateSalesOrderOptions): void => {

    let salesOrderId = null;
    if (+options.recordId) {

        try {
            switch (options.recordType) {

                case 'salesorder':
                    salesOrderId = options.recordId;
                    break;
                default:

                    search.create({
                        type: search.Type.TRANSACTION,
                        filters:
                            [
                                ['externalid', 'is', `inv_${options.charge?.id}`]
                            ]
                    }).run().each(result => {
                        salesOrderId = result.id;

                        return false;
                    })

                    if (!salesOrderId) {
                        const salesOrder = record.transform({
                            fromType: options.recordType,
                            fromId: options.recordId,
                            toType: record.Type.SALES_ORDER,
                            isDynamic: true
                        });
                        salesOrder.setValue({fieldId: 'custbody_stripe_chargeid', value: options.charge?.latest_charge});
                        salesOrder.setValue({fieldId: 'custbody_stripe_payment_intentid', value: options.charge?.id});
                        salesOrder.setValue({fieldId: 'externalid', value: `so_${options.charge?.id}`});
                        salesOrder.setValue({fieldId: 'custbody_mhi_stripe_payment_portal', value: ''});
                        salesOrder.setValue({fieldId: 'orderstatus', value: 'B'});


                        let nsAmount = options.charge.amount;

                        if (options.charge.currency?.toUpperCase() !== 'JPY') {
                            nsAmount = nsAmount / 100;
                        }

                        const lines = +salesOrder.getLineCount({sublistId: 'item'});

                        const soAmount = +salesOrder.getValue({fieldId: 'total'});

                        log.audit('soAmount', soAmount);
                        log.audit('nsAmount', nsAmount);
                        let divider = 1;
                        if (soAmount > 0) {
                            divider = soAmount/nsAmount;
                        }

                        if (lines > 0) {
                            for (let i = 0; i < lines; i++){
                                salesOrder.selectLine({sublistId: 'item', line: i});


                                const amount = +salesOrder.getCurrentSublistValue({sublistId: 'item', fieldId: 'amount'});
                                const rate = +salesOrder.getCurrentSublistValue({sublistId: 'item', fieldId: 'rate'});
                                log.audit(`line ${i} rate`, rate);
                                if (rate > 0)
                                    salesOrder.setCurrentSublistValue({sublistId: 'item', fieldId: 'rate', value: (rate/divider).toFixed(2)});

                                if (amount > 0)
                                    salesOrder.setCurrentSublistValue({sublistId: 'item', fieldId: 'amount', value: (amount/divider).toFixed(2)});
                                salesOrder.commitLine({sublistId: 'item'})
                            }


                        }
                        salesOrder.save({ignoreMandatoryFields: true});
                        salesOrderId = salesOrder.id;
                    }
                    break;

            }
        } catch (err) {
            log.debug('err', err)
        }
    }


    // Return the customer payment id if successful
    if (+salesOrderId > 0) {

        options.Success(salesOrderId);
    } else {
        options.Failed();
    }
};



export interface GenerateSalesOrderOptions {
    recordId: number;
    recordType: string;
    charge: any;
    Success(salesOrderId: number): void;
    Failed(): void;
}
