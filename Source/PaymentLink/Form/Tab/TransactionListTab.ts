/**
 * @copyright 2022 Myers-Holum Inc.
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 */

import * as serverWidget from 'N/ui/serverWidget';
import {EntryPoints} from 'N/types';
import {TransactionListSublist} from '../Sublist/TransactionListSublist';
import {Stripe} from "../../../StripeAPI/Stripe";

export class TransactionListTab {
    private static readonly ID = 'custpage_transaction_tab';

    private readonly transactionsTab: serverWidget.Tab;
    private readonly transactionsSublist: TransactionListSublist;

    constructor(private readonly context: EntryPoints.Suitelet.onRequestContext, form: serverWidget.Form, stripe: Stripe) {
        this.transactionsTab = form.addTab({
            id: TransactionListTab.ID,
            label: 'Transaction Details'
        });

        this.transactionsSublist = new TransactionListSublist(context, form, TransactionListTab.ID, stripe);

    }

    get TransactionListSublist(): TransactionListSublist {
      return this.transactionsSublist;
    }
}
