/**
 * @copyright 2022 Myers-Holum Inc.
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 */

import * as serverWidget from 'N/ui/serverWidget';
import {EntryPoints} from 'N/types';
import * as log from 'N/log';
import {decode, encode, redirectToScript} from '../../../Utils/Common';

export class TransactionSummarySublist {
    private static readonly ID = 'custpage_transaction_list';

    private static readonly FIELDID = {
        SUBSIDIARY: 'custpage_subsidiary_name',
        SUBSIDIARYID: 'custpage_subsidiary_id',
        CUSTOMER: 'custpage_customer_name',
        CUSTOMERID: 'custpage_customer_id',
        INVOICESNUMBER: 'custpage_invoices_number',
        TOTALAMOUNT: 'custpage_total_amount',
        AMOUNTDUE: 'custpage_amount_due',
        CURRENCY: 'custpage_currency',
        CURRENCYID: 'custpage_currency_id',
        ACCEPTPAYMENT: 'custpage_accept_payment'
    };

    private readonly invoiceSummarySublist: serverWidget.Sublist;

    constructor(private readonly context: EntryPoints.Suitelet.onRequestContext, private readonly form: serverWidget.Form, tab: string, pageCount: number, pageId: number) {
        this.invoiceSummarySublist = form.addSublist({
            id: TransactionSummarySublist.ID,
            type: serverWidget.SublistType.LIST,
            tab: tab,
            label: `Group(s)`
        });

        if (pageCount < 0) {

            this.invoiceSummarySublist.label = `No invoices found`;
        }

        this.invoiceSummarySublist.addField({
            id: TransactionSummarySublist.FIELDID.SUBSIDIARY,
            label: 'Subsidiary',
            type: serverWidget.FieldType.TEXTAREA
        }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});

        this.invoiceSummarySublist.addField({
            id: TransactionSummarySublist.FIELDID.SUBSIDIARYID,
            label: 'Subsidiary ID',
            type: serverWidget.FieldType.INTEGER
        }).updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});

        this.invoiceSummarySublist.addField({
            id: TransactionSummarySublist.FIELDID.CUSTOMER,
            label: 'Customer',
            type: serverWidget.FieldType.TEXTAREA
        }).updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});

        this.invoiceSummarySublist.addField({
            id: TransactionSummarySublist.FIELDID.CUSTOMERID,
            label: 'Customer ID',
            type: serverWidget.FieldType.INTEGER
        }).updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});

        this.invoiceSummarySublist.addField({
            id: TransactionSummarySublist.FIELDID.INVOICESNUMBER,
            label: 'Number of Invoices',
            type: serverWidget.FieldType.TEXT
        });

        this.invoiceSummarySublist.addField({
            id: TransactionSummarySublist.FIELDID.CURRENCY,
            label: 'Currency',
            type: serverWidget.FieldType.TEXT
        });

        this.invoiceSummarySublist.addField({
            id: TransactionSummarySublist.FIELDID.CURRENCYID,
            label: 'Currency ID',
            type: serverWidget.FieldType.INTEGER
        }).updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});


        this.invoiceSummarySublist.addField({
            id: TransactionSummarySublist.FIELDID.TOTALAMOUNT,
            label: 'Total Amount',
            type: serverWidget.FieldType.CURRENCY
        });

        this.invoiceSummarySublist.addField({
            id: TransactionSummarySublist.FIELDID.AMOUNTDUE,
            label: 'Balance Due',
            type: serverWidget.FieldType.CURRENCY
        });



        this.invoiceSummarySublist.addField({
            id: TransactionSummarySublist.FIELDID.ACCEPTPAYMENT,
            label: ' ',
            type: serverWidget.FieldType.TEXTAREA
        });

        this.addPaginationButton(pageId, pageCount);

    }

    public set Invoices(invoiceSummaries: any[]) {
        if (invoiceSummaries.length > 0) {

            invoiceSummaries.forEach((invoiceSummary, index) => {

                log.debug('invoiceSummary', invoiceSummary);

                const parameters = this.context.request.parameters.p;
                const decrypted = decode(parameters);
                const encrypted = encode(`${decrypted}&b=${invoiceSummary.subsidiaryid}&c=${invoiceSummary.currencyid}&e=${invoiceSummary.customerid}`);
                const accept = encode(`${decrypted}&b=${invoiceSummary.subsidiaryid}&c=${invoiceSummary.currencyid}&e=${invoiceSummary.customerid}&g=T`);
                const acceptURL = redirectToScript({p: accept});
                this.invoiceSummarySublist.setSublistValue({
                    id: TransactionSummarySublist.FIELDID.SUBSIDIARY,
                    line: index,
                    value: `${invoiceSummary.subsidiaryname}</p>`
                });
                this.invoiceSummarySublist.setSublistValue({
                    id: TransactionSummarySublist.FIELDID.SUBSIDIARYID,
                    line: index,
                    value: invoiceSummary.subsidiaryid
                });

                this.invoiceSummarySublist.setSublistValue({
                    id: TransactionSummarySublist.FIELDID.INVOICESNUMBER,
                    line: index,
                    value: invoiceSummary.invoicesnumber
                });

                this.invoiceSummarySublist.setSublistValue({
                    id: TransactionSummarySublist.FIELDID.CUSTOMER,
                    line: index,
                    value: invoiceSummary.customername
                });

                this.invoiceSummarySublist.setSublistValue({
                    id: TransactionSummarySublist.FIELDID.CUSTOMERID,
                    line: index,
                    value: invoiceSummary.customerid
                });

                this.invoiceSummarySublist.setSublistValue({
                    id: TransactionSummarySublist.FIELDID.CURRENCY,
                    line: index,
                    value: invoiceSummary.currency
                });


                this.invoiceSummarySublist.setSublistValue({
                    id: TransactionSummarySublist.FIELDID.CURRENCYID,
                    line: index,
                    value: invoiceSummary.currencyid
                });

                this.invoiceSummarySublist.setSublistValue({
                    id: TransactionSummarySublist.FIELDID.TOTALAMOUNT,
                    line: index,
                    value: invoiceSummary.totalamount
                });

                this.invoiceSummarySublist.setSublistValue({
                    id: TransactionSummarySublist.FIELDID.AMOUNTDUE,
                    line: index,
                    value: invoiceSummary.amountdue
                });

                this.invoiceSummarySublist.setSublistValue({
                    id: TransactionSummarySublist.FIELDID.ACCEPTPAYMENT,
                    line: index,
                    value: `<a href="${acceptURL}">Make Payment</a>`
                });

            });

        } else {
            this.invoiceSummarySublist.displayType = serverWidget.SublistDisplayType.HIDDEN;
        }
    }

    public addPaginationButton(pageId, pageCount) {
        // Set pageId to correct value if out of index

        if (pageId === -1) {
            return;
        }

        if (!pageId || pageId === '' || pageId < 0) {
            pageId = 0;
        } else if (pageId >= pageCount) {
            pageId = pageCount - 1;
        }

        const parameters = this.context.request.parameters.p;
        const decrypted = decode(parameters);
        const params = encode(`${decrypted}`);

        // Add buttons to simulate Next & Previous
        if (pageId !== 0) {
            this.invoiceSummarySublist.addButton({
                id: 'custpage_previous',
                label: 'Previous Page',
                functionName: `getSuiteletPage('${params}', '${pageId - 1}')`
            });
        }

        if (pageId !== pageCount - 1) {
            this.invoiceSummarySublist.addButton({
                id: 'custpage_next',
                label: 'Next Page',
                functionName: `getSuiteletPage('${params}', '${pageId + 1}')`
            });
        }
    }
}
