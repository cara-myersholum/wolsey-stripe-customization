/**
 * @copyright 2022 Myers-Holum Inc.
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 */

import * as serverWidget from 'N/ui/serverWidget';
import * as search from 'N/search';
import * as log from 'N/log';
import {EntryPoints} from 'N/types';
import {TransactionListConstants} from '../../Constants/TransactionListConstants';
import {decode, encode, parseQueryString} from '../../../Utils/Common';
import {Stripe} from "../../../StripeAPI/Stripe";

export class TransactionListSublist {
    private static readonly ID = 'custpage_transaction_list';
    private static readonly FIELDID = {
        ID: 'custpage_transaction_id',
        SELECT: 'custpage_select',
        PAYMENTAMOUNT: 'custpage_payment_amount',
        AMOUNTREMAINING: 'custpage_amount_remaining'
    };
    private static readonly CURRENCYFIELDS = ['fxamount', 'fxamountpaid', 'fxamountremaining'];
    private static readonly DATEFIELDS = ['date', 'duedate', 'trandate', 'invoicedate'];
    private readonly transSearch: search.Search;
    private readonly transactionSublist: serverWidget.Sublist;
    private readonly stripe: Stripe;

    constructor(private readonly context: EntryPoints.Suitelet.onRequestContext, private readonly form: serverWidget.Form, tab: string, stripe: Stripe) {
        this.transSearch = search.load({id: 'customsearch_mhi_stripe_transaction_list'});
        this.stripe = stripe;
        this.transactionSublist = form.addSublist({
            id: TransactionListSublist.ID,
            type: serverWidget.SublistType.LIST,
            tab: tab,
            label: `Transaction Details`
        });

        this.transactionSublist.addField({
            id: TransactionListSublist.FIELDID.ID,
            label: 'Transaction',
            type: serverWidget.FieldType.INTEGER
        }).updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});

        const selectField = this.transactionSublist.addField({
            id: TransactionListSublist.FIELDID.SELECT,
            label: 'Select',
            type: serverWidget.FieldType.CHECKBOX
        });

        selectField.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
        selectField.defaultValue = 'T';

        this.transSearch.columns.forEach((column: search.Column, index) => {

            if (TransactionListSublist.DATEFIELDS.indexOf(column.name) !== -1) {
                const dateField = this.transactionSublist.addField({
                    id: `custpage_col${column.label}`,
                    label: column.label,
                    type: serverWidget.FieldType.DATE,
                }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});

                if (column.label === 'duedate') {
                    dateField.label = 'Due Date';
                } else if (column.label === 'trandate') {
                    dateField.label = 'Transaction Date';
                }

            } else if (TransactionListSublist.CURRENCYFIELDS.indexOf(column.name) !== -1) {
                const currencyField = this.transactionSublist.addField({
                    id: `custpage_col${column.label}`,
                    label: column.label,
                    type: serverWidget.FieldType.CURRENCY,
                }).updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});

                if (column.label === 'amount') {
                    currencyField.label = 'Total';
                }

                if (column.label === 'amountpaid') {
                    currencyField.label = 'Amount Paid';
                }
            }else if (column.label === 'amountremaining') {
                this.transactionSublist.addField({
                    id: `custpage_col${column.label}`,
                    label: 'Amount Due',
                    type: serverWidget.FieldType.CURRENCY,
                }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});

            } else {
                const textField = this.transactionSublist.addField({
                    id: `custpage_col${column.label}`,
                    label: column.label,
                    type: serverWidget.FieldType.TEXT,
                });

                textField.updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});

                if (column.label === 'currency') {
                    textField.label = 'Currency';
                }

                if (column.label === 'daysoverdue') {
                    textField.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
                }
            }
        });

        const paymentAmtField = this.transactionSublist.addField({
            id: TransactionListConstants.FIELDID.PAYMENTAMOUNT,
            label: 'Payment Amount',
            type: serverWidget.FieldType.CURRENCY
        });
        if (this.stripe.BUNDLESCONFIGURATION.PAYMENTLINK_PARTIALPAYMENTSLINE) {
            paymentAmtField.updateDisplayType({displayType: serverWidget.FieldDisplayType.ENTRY});
        } else {
            paymentAmtField.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
        }


        const amtRemainingField = this.transactionSublist.addField({
            id: TransactionListConstants.FIELDID.AMOUNTREMAINING,
            label: 'Amt Remaining',
            type: serverWidget.FieldType.CURRENCY
        });

        amtRemainingField.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});

        form.addSubmitButton({label: 'Make Payment'});
    }

    public set Invoices(invoices: any[]) {
        let accepted = false;
        try {
            const parameters = this.context.request.parameters.p;
            const decrypted = decode(parameters);

            const parsed = parseQueryString(decrypted);
            accepted = parsed.g === 'T';
        } catch (err) {

        }

        invoices.forEach((invoice, index) => {
            this.transactionSublist.setSublistValue({id: TransactionListSublist.FIELDID.ID, value: `${invoice.id}`, line: index});
            this.transactionSublist.setSublistValue({id: TransactionListSublist.FIELDID.AMOUNTREMAINING, value: `${Number(invoice.amountremaining).toFixed(2)}`, line: index});
            Object.keys(invoice).forEach(key => {
                this.transactionSublist.setSublistValue({id: `custpage_col${key}`, value: invoice[key], line: index});
            });
            this.transactionSublist.setSublistValue({id: TransactionListSublist.FIELDID.PAYMENTAMOUNT, value: Number(invoice.amountremaining).toFixed(2), line: index});


        });

    }



}
