/**
 * @copyright 2022 Myers-Holum Inc.
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 * @NScriptType Suitelet
 */

import {EntryPoints} from 'N/types';
import * as https from 'N/https';
import {TransactionListForm} from './Form/TransactionListForm';
import {TransactionPaymentForm} from './Form/TransactionPaymentForm';

export const onRequest: EntryPoints.Suitelet.onRequest = (context: EntryPoints.Suitelet.onRequestContext) => {

    switch (context.request.method) {
        case https.Method.GET:

            const transactionListForm: TransactionListForm = new TransactionListForm(context);
            writePage(context, transactionListForm.FORM);
            break;

        case https.Method.POST:

            const transactionReviewForm: TransactionPaymentForm = new TransactionPaymentForm(context);
            transactionReviewForm.InvoiceReview = context;
            writePage(context, transactionReviewForm.FORM);

            break;

        default:
            break;
    }

};

export const writePage = (context, form) => {
    
    // If html page, use context.response.write else, writePage
    
    if (typeof form === 'string'){
        context.response.write(form);
    } else {
        context.response.writePage(form);
    }

}
