/**
 * @copyright 2022 Myers-Holum Inc.
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 * @NScriptType Suitelet
 */
define(["require", "exports", "N/https", "./Form/TransactionListForm", "./Form/TransactionPaymentForm"], function (require, exports, https, TransactionListForm_1, TransactionPaymentForm_1) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.writePage = exports.onRequest = void 0;
    const onRequest = (context) => {
        switch (context.request.method) {
            case https.Method.GET:
                const transactionListForm = new TransactionListForm_1.TransactionListForm(context);
                (0, exports.writePage)(context, transactionListForm.FORM);
                break;
            case https.Method.POST:
                const transactionReviewForm = new TransactionPaymentForm_1.TransactionPaymentForm(context);
                transactionReviewForm.InvoiceReview = context;
                (0, exports.writePage)(context, transactionReviewForm.FORM);
                break;
            default:
                break;
        }
    };
    exports.onRequest = onRequest;
    const writePage = (context, form) => {
        // If html page, use context.response.write else, writePage
        if (typeof form === 'string') {
            context.response.write(form);
        }
        else {
            context.response.writePage(form);
        }
    };
    exports.writePage = writePage;
});
