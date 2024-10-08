/**
 * @copyright 2022 Myers-Holum Inc.
 *
 * @NApiVersion 2.1
 */

import * as search from 'N/search';
import * as log from 'N/log';
import {stringToObject} from '../../Utils/StringToObject';
import {objectCleaner} from '../../Utils/ObjectCleaner';

export const getPendingPaymentList = (options: PendingPaymentOptions): void => {
    const pendingPaymentList = [];

    const pendingPaymentListSearch = search.load({id: 'customsearch_mhi_stripe_pending_payment'});

    if (+options.transactionId > 0) {
        pendingPaymentListSearch.filters.push(search.createFilter({
            name: 'custrecord_mhi_stripe_pending_trans',
            operator: search.Operator.ANYOF,
            values: options.transactionId
        }));
    }

    if (+options.entityId > 0) {
        pendingPaymentListSearch.filters.push(search.createFilter({
            name: 'custrecord_mhi_stripe_pending_cust',
            operator: search.Operator.ANYOF,
            values: options.entityId
        }));
    }


    if (+options.subsidiaryId > 0) {
        pendingPaymentListSearch.filters.push(search.createFilter({
            name: 'custrecord_mhi_stripe_pending_sub',
            operator: search.Operator.ANYOF,
            values: options.subsidiaryId
        }));
    }

    if (+options.currencyId > 0) {
        pendingPaymentListSearch.filters.push(search.createFilter({
            name: 'custrecord_mhi_stripe_pending_currency',
            operator: search.Operator.ANYOF,
            values: options.currencyId
        }));
    }

    if (options.paymentIntentId) {
        pendingPaymentListSearch.filters.push(search.createFilter({
            name: 'custrecord_mhi_stripe_pending_id',
            operator: search.Operator.IS,
            values: options.transactionId
        }));
    }


    try {

        pendingPaymentListSearch.run().each(result => {
            const pendingPayment = {id: result.id};
            result.columns.forEach(column => {
                const [path, valueType] = column.label.split('_');
                stringToObject(path, valueType === 't' && result.getText(column) ? result.getText(column) : result.getValue(column), pendingPayment);
            });

            pendingPaymentList.push(objectCleaner(pendingPayment));
            return true;
        });
    } catch (e) {

    }



    if (pendingPaymentList.length > 0) {
        options.Found(pendingPaymentList);
    } else {
        options.NotFound();
    }
};

interface PendingPaymentOptions {
    entityId?: number;
    subsidiaryId?: number;
    currencyId?: number;
    transactionId?: number;
    paymentIntentId?: string;
    Found(pendingPaymentList: any[]): void;
    NotFound(): void;
}
