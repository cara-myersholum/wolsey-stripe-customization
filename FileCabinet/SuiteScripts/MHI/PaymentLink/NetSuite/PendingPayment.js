/**
 * @copyright 2022 Myers-Holum Inc.
 *
 * @NApiVersion 2.1
 */
define(["require", "exports", "N/search", "../../Utils/StringToObject", "../../Utils/ObjectCleaner"], function (require, exports, search, StringToObject_1, ObjectCleaner_1) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getPendingPaymentList = void 0;
    const getPendingPaymentList = (options) => {
        const pendingPaymentList = [];
        const pendingPaymentListSearch = search.load({ id: 'customsearch_mhi_stripe_pending_payment' });
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
                const pendingPayment = { id: result.id };
                result.columns.forEach(column => {
                    const [path, valueType] = column.label.split('_');
                    (0, StringToObject_1.stringToObject)(path, valueType === 't' && result.getText(column) ? result.getText(column) : result.getValue(column), pendingPayment);
                });
                pendingPaymentList.push((0, ObjectCleaner_1.objectCleaner)(pendingPayment));
                return true;
            });
        }
        catch (e) {
        }
        if (pendingPaymentList.length > 0) {
            options.Found(pendingPaymentList);
        }
        else {
            options.NotFound();
        }
    };
    exports.getPendingPaymentList = getPendingPaymentList;
});
