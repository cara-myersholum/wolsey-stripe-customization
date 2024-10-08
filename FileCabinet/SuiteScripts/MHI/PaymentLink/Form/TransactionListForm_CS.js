/**
 * @copyright 2022 Myers-Holum Inc.
 *
 * @NApiVersion 2.0
 * @NModuleScope Public
 * @NScriptType ClientScript
 */
define(["require", "exports", "N/format/i18n"], function (require, exports, format) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.goBack = exports.formatCurrency = exports.getSuiteletPage = void 0;
    const getSuiteletPage = (params) => {
        window.onbeforeunload = null;
        // @ts-ignore
        // document.location = redirectToScript({p: params});
    };
    exports.getSuiteletPage = getSuiteletPage;
    const formatCurrency = (amount, currencyCode) => {
        const curFormatter = format.getCurrencyFormatter({ currency: currencyCode });
        return curFormatter.format({ number: amount });
    };
    exports.formatCurrency = formatCurrency;
    const goBack = () => {
        window.onbeforeunload = null;
        history.go(-1);
    };
    exports.goBack = goBack;
});
