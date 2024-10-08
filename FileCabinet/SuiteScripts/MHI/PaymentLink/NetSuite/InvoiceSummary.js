/**
 * @copyright 2022 Myers-Holum Inc.
 *
 * @NApiVersion 2.1
 */
define(["require", "exports", "N/search", "N/log", "../../Utils/StringToObject", "../../Utils/ObjectCleaner", "./PendingPayment"], function (require, exports, search, log, StringToObject_1, ObjectCleaner_1, PendingPayment_1) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getInvoiceSummary = void 0;
    const getInvoiceSummary = (options) => {
        let totalCount = 0;
        let invoiceSummaries = [];
        if (options.recordId > 0) {
            const invoiceSummarySearch = search.load({ id: 'customsearch_mhi_stripe_invoice_summary' });
            switch (options.recordType) {
                case 'customer':
                    invoiceSummarySearch.filters.push(search.createFilter({
                        name: 'internalidnumber',
                        join: 'customer',
                        operator: search.Operator.EQUALTO,
                        values: options.recordId
                    }));
                    break;
                default: // If it is a transaction
                    invoiceSummarySearch.filters.push(search.createFilter({
                        name: 'internalidnumber',
                        operator: search.Operator.EQUALTO,
                        values: options.recordId
                    }));
                    break;
            }
            try {
                const pagedData = invoiceSummarySearch.runPaged({
                    pageSize: options.searchPageSize
                });
                totalCount = pagedData.count;
                const searchPage = pagedData.fetch({
                    index: options.pageIndex
                });
                searchPage.data.forEach(result => {
                    const invoiceSummary = {};
                    result.columns.forEach(column => {
                        const [path, valueType] = column.label.split('_');
                        (0, StringToObject_1.stringToObject)(path, valueType === 't' && result.getText(column) ? result.getText(column) : result.getValue(column), invoiceSummary);
                    });
                    invoiceSummaries.push((0, ObjectCleaner_1.objectCleaner)(invoiceSummary));
                    return true;
                });
            }
            catch (e) {
            }
        }
        invoiceSummaries = updatePendingPaymentAmount(invoiceSummaries, options);
        if (invoiceSummaries.length === 1) {
            options.FoundOne(invoiceSummaries.pop());
        }
        else if (invoiceSummaries.length >= 1) {
            options.Found(invoiceSummaries);
        }
        else {
            options.NotFound();
        }
    };
    exports.getInvoiceSummary = getInvoiceSummary;
    const updatePendingPaymentAmount = (invoiceSummaries, options) => {
        // Get all Pending Payment List
        try {
            invoiceSummaries.forEach((invoiceSummary, index) => {
                (0, PendingPayment_1.getPendingPaymentList)({
                    transactionId: options.recordId,
                    Found: (pendingPaymentList) => {
                        log.debug('pendingPaymentList', pendingPaymentList);
                        // Get the total paid
                        const pendingPaymentTotal = pendingPaymentList.reduce(function (a, b) {
                            return a + (b.amount || 0);
                        }, 0);
                        log.debug('pendingPaymentTotal', pendingPaymentTotal);
                        invoiceSummaries[index].amountdue = invoiceSummaries[index].amountdue - pendingPaymentTotal;
                    },
                    NotFound: () => {
                        // Nothing to do here.
                    }
                });
            });
        }
        catch (err) {
            log.error('Error with updatePendingPaymentAmount', err);
        }
        return invoiceSummaries.filter(invoiceSummary => invoiceSummary.amountdue > 0);
    };
});
