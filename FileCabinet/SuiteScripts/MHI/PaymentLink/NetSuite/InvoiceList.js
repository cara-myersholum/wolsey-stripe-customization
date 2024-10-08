/**
 * @copyright 2022 Myers-Holum Inc.
 *
 * @NApiVersion 2.1
 */
define(["require", "exports", "N/record", "N/search", "N/log", "N/format", "../../Utils/StringToObject", "../../Utils/ObjectCleaner", "./PendingPayment"], function (require, exports, record, search, log, format, StringToObject_1, ObjectCleaner_1, PendingPayment_1) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getInvoiceList = void 0;
    const getInvoiceList = (options) => {
        let invoiceLists = [];
        log.debug('getInvoiceListOptions', options);
        if (options.recordId > 0) {
            const invoiceListSearch = search.load({ id: 'customsearch_mhi_stripe_transaction_list' });
            switch (options.recordType) {
                case 'customer':
                    invoiceListSearch.filters.push(search.createFilter({
                        name: 'internalidnumber',
                        join: 'customer',
                        operator: search.Operator.EQUALTO,
                        values: options.recordId
                    }));
                    if (+options.subsidiaryId > 0) {
                        invoiceListSearch.filters.push(search.createFilter({
                            name: 'subsidiary',
                            operator: search.Operator.ANYOF,
                            values: options.subsidiaryId
                        }));
                    }
                    if (+options.currencyId > 0) {
                        invoiceListSearch.filters.push(search.createFilter({
                            name: 'currency',
                            operator: search.Operator.ANYOF,
                            values: options.currencyId
                        }));
                    }
                    break;
                default: // If it is a transaction
                    invoiceListSearch.filters.push(search.createFilter({
                        name: 'internalidnumber',
                        operator: search.Operator.EQUALTO,
                        values: options.recordId
                    }));
                    break;
            }
            try {
                const pagedData = invoiceListSearch.runPaged({
                    pageSize: options.searchPageSize
                });
                const searchPage = pagedData.fetch({
                    index: options.pageIndex
                });
                searchPage.data.forEach(result => {
                    const invoiceList = { id: result.id };
                    result.columns.forEach(column => {
                        const [path, valueType] = column.label.split('_');
                        (0, StringToObject_1.stringToObject)(path, valueType === 't' && result.getText(column) ? result.getText(column) : result.getValue(column), invoiceList);
                    });
                    if (+invoiceList.amountremaining < 0) {
                        try {
                            const transaction = record.load({ type: `${result.recordType}`, id: result.id, isDynamic: true });
                            const billingScheduleId = transaction.getValue({ fieldId: 'billingschedule' });
                            const lines = transaction.getLineCount({ sublistId: 'billingschedule' });
                            if (+billingScheduleId > 0 && lines > 0) {
                                const firstLineAmount = +transaction.getSublistValue({ sublistId: 'billingschedule', fieldId: 'billamount', line: 0 });
                                const firstDueDate = transaction.getSublistValue({ sublistId: 'billingschedule', fieldId: 'billdate', line: 0 });
                                invoiceList.amountremaining = firstLineAmount;
                                invoiceList.duedate = format.format({
                                    value: firstDueDate,
                                    type: format.Type.DATE
                                });
                                ;
                            }
                        }
                        catch (e) {
                        }
                    }
                    invoiceLists.push((0, ObjectCleaner_1.objectCleaner)(invoiceList));
                    return true;
                });
            }
            catch (e) {
            }
        }
        invoiceLists = updatePendingPaymentAmount(invoiceLists, options);
        if (invoiceLists.length > 0) {
            options.Found(invoiceLists);
        }
        else {
            options.NotFound();
        }
    };
    exports.getInvoiceList = getInvoiceList;
    const updatePendingPaymentAmount = (invoiceLists, options) => {
        // Get all Pending Payment List
        try {
            (0, PendingPayment_1.getPendingPaymentList)({
                transactionId: options.recordId,
                Found: (pendingPaymentList) => {
                    // Match the invoices against the pending payments
                    pendingPaymentList.forEach(pendingPayment => {
                        invoiceLists = invoiceLists.map(invoiceList => {
                            if (+invoiceList.id === +pendingPayment.transaction) {
                                return {
                                    ...invoiceList,
                                    amountremaining: +invoiceList.amountremaining - (+pendingPayment.amount || 0),
                                    amountpaid: +invoiceList.amountpaid + (+pendingPayment.amount || 0)
                                };
                            }
                            return invoiceList;
                        });
                    });
                },
                NotFound: () => {
                    // Nothing to do here.
                }
            });
        }
        catch (err) {
            log.error('Error with updatePendingPaymentAmount', err);
        }
        return invoiceLists.filter(invoiceList => invoiceList.amountremaining > 0);
    };
});
