/**
 * @copyright 2022 Myers-Holum Inc.
 *
 * @NApiVersion 2.0
 * @NModuleScope Public
 * @NScriptType ClientScript
 */

import {EntryPoints} from 'N/types';
import * as format from 'N/format/i18n';
import * as dialog from 'N/ui/dialog';

export const getSuiteletPage = (params) => {
    window.onbeforeunload = null;
    // @ts-ignore
   // document.location = redirectToScript({p: params});
};

export const formatCurrency = (amount: number, currencyCode: string) => {
    const curFormatter = format.getCurrencyFormatter({currency: currencyCode});
    return curFormatter.format({number: amount});
};

export const goBack = () => {
    window.onbeforeunload = null;
    history.go(-1);
};
