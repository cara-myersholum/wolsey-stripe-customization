/**
 * @copyright 2022 Myers-Holum Inc.
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 */

import * as serverWidget from 'N/ui/serverWidget';
import {TransactionSummarySublist} from '../Sublist/TransactionSummarySublist';
import {EntryPoints} from 'N/types';

export class TransactionSummaryTab {
    private static readonly ID = 'custpage_quotes_tab';

    private readonly invoiceSummaryTab: serverWidget.Tab;
    private readonly invoiceSummarySublist: TransactionSummarySublist;

    constructor(private readonly context: EntryPoints.Suitelet.onRequestContext, form: serverWidget.Form, pageCount: number, pageId: number) {
        this.invoiceSummaryTab = form.addTab({
            id: TransactionSummaryTab.ID,
            label: 'Summary'
        });

        this.invoiceSummarySublist = new TransactionSummarySublist(context, form, TransactionSummaryTab.ID, pageCount, pageId);

    }

    get InvoiceSummarySublist(): TransactionSummarySublist {
        return this.invoiceSummarySublist;
    }
}
