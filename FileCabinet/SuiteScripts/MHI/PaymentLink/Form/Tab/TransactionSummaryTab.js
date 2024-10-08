/**
 * @copyright 2022 Myers-Holum Inc.
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 */
define(["require", "exports", "../Sublist/TransactionSummarySublist"], function (require, exports, TransactionSummarySublist_1) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TransactionSummaryTab = void 0;
    class TransactionSummaryTab {
        constructor(context, form, pageCount, pageId) {
            this.context = context;
            this.invoiceSummaryTab = form.addTab({
                id: TransactionSummaryTab.ID,
                label: 'Summary'
            });
            this.invoiceSummarySublist = new TransactionSummarySublist_1.TransactionSummarySublist(context, form, TransactionSummaryTab.ID, pageCount, pageId);
        }
        get InvoiceSummarySublist() {
            return this.invoiceSummarySublist;
        }
    }
    exports.TransactionSummaryTab = TransactionSummaryTab;
    TransactionSummaryTab.ID = 'custpage_quotes_tab';
});
