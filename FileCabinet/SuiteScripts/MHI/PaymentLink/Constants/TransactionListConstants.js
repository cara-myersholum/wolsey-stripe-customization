/**
 * @copyright 2022 Myers-Holum Inc.
 *
 */
define(["require", "exports"], function (require, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TransactionListConstants = void 0;
    // tslint:disable-next-line:variable-name
    exports.TransactionListConstants = {
        ID: 'custpage_transaction_list',
        FIELDID: {
            ID: 'custpage_transaction_id',
            SELECT: 'custpage_select',
            SUBSIDIARY: 'custpage_subsidiary',
            ACCEPTPAYMENT: 'custpage_accept_payment',
            PAYMENTAMOUNT: 'custpage_payment_amount',
            AMOUNTREMAINING: 'custpage_amount_remaining',
            NAME: 'custpage_coltransaction',
            CURRENCY: 'custpage_colcurrency'
        }
    };
});
