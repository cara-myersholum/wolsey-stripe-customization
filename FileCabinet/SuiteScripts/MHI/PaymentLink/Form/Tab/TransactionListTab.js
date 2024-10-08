/**
 * @copyright 2022 Myers-Holum Inc.
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 */
define(["require", "exports", "../Sublist/TransactionListSublist"], function (require, exports, TransactionListSublist_1) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TransactionListTab = void 0;
    class TransactionListTab {
        constructor(context, form, stripe) {
            this.context = context;
            this.transactionsTab = form.addTab({
                id: TransactionListTab.ID,
                label: 'Transaction Details'
            });
            this.transactionsSublist = new TransactionListSublist_1.TransactionListSublist(context, form, TransactionListTab.ID, stripe);
        }
        get TransactionListSublist() {
            return this.transactionsSublist;
        }
    }
    exports.TransactionListTab = TransactionListTab;
    TransactionListTab.ID = 'custpage_transaction_tab';
});
