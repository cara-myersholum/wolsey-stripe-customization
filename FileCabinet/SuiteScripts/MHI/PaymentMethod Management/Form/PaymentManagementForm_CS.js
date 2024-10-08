/**
 * @copyright 2022 Myers-Holum Inc.
 *
 * @NApiVersion 2.0
 * @NModuleScope Public
 * @NScriptType ClientScript
 */
define(["require", "exports", "N/ui/dialog", "N/https", "N/currentRecord", "../Constants/PaymentManagementFormConstants"], function (require, exports, dialog, https, currentRecrd, PaymentManagementFormConstants_1) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.defaultCard = exports.deleteCard = exports.goBack = exports.pageInit = void 0;
    const pageInit = (context) => {
    };
    exports.pageInit = pageInit;
    const goBack = () => {
        window.onbeforeunload = null;
        const currentURL = new URL(location.href);
        history.go(-1);
    };
    exports.goBack = goBack;
    const deleteCard = () => {
        const currentRec = currentRecrd.get();
        const subsidiaryId = +currentRec.getValue({ fieldId: PaymentManagementFormConstants_1.PaymentManagementFormConstants.FIELDID.SUBSIDIARYID });
        const paymentMethodCount = +currentRec.getLineCount({ sublistId: PaymentManagementFormConstants_1.PaymentManagementFormConstants.PAYMENTMETHOD.SUBLIST });
        for (let i = 0; i < paymentMethodCount; i += 1) {
            const isSelected = currentRec.getSublistValue({ sublistId: PaymentManagementFormConstants_1.PaymentManagementFormConstants.PAYMENTMETHOD.SUBLIST, fieldId: PaymentManagementFormConstants_1.PaymentManagementFormConstants.PAYMENTMETHOD.SELECT, line: i });
            if (isSelected) {
                const customerId = currentRec.getSublistValue({ sublistId: PaymentManagementFormConstants_1.PaymentManagementFormConstants.PAYMENTMETHOD.SUBLIST, fieldId: PaymentManagementFormConstants_1.PaymentManagementFormConstants.PAYMENTMETHOD.CID, line: i });
                const paymentMethodId = currentRec.getSublistValue({ sublistId: PaymentManagementFormConstants_1.PaymentManagementFormConstants.PAYMENTMETHOD.SUBLIST, fieldId: PaymentManagementFormConstants_1.PaymentManagementFormConstants.PAYMENTMETHOD.ID, line: i });
                dialog.confirm({
                    title: 'Confirmation',
                    message: 'Are you sure you want to delete this payment method?'
                }).then(result => {
                    try {
                        if (result) {
                            https.post({
                                body: {},
                                url: `${location.href}&pm=${paymentMethodId}&cs=${customerId}&s=${subsidiaryId}`
                            });
                            window.onbeforeunload = null;
                            location.reload();
                        }
                    }
                    catch (err) {
                    }
                }).catch(reason => {
                    // do nothing
                });
            }
        }
    };
    exports.deleteCard = deleteCard;
    const defaultCard = (index) => {
        const currentRec = currentRecrd.get();
        const subsidiaryId = +currentRec.getValue({ fieldId: PaymentManagementFormConstants_1.PaymentManagementFormConstants.FIELDID.SUBSIDIARYID });
        const paymentMethodCount = +currentRec.getLineCount({ sublistId: PaymentManagementFormConstants_1.PaymentManagementFormConstants.PAYMENTMETHOD.SUBLIST });
        let customerId = '';
        let paymentMethodId = '';
        let selectedCount = 0;
        for (let i = 0; i < paymentMethodCount; i += 1) {
            const isSelected = currentRec.getSublistValue({ sublistId: PaymentManagementFormConstants_1.PaymentManagementFormConstants.PAYMENTMETHOD.SUBLIST, fieldId: PaymentManagementFormConstants_1.PaymentManagementFormConstants.PAYMENTMETHOD.SELECT, line: i });
            if (isSelected) {
                customerId = currentRec.getSublistValue({ sublistId: PaymentManagementFormConstants_1.PaymentManagementFormConstants.PAYMENTMETHOD.SUBLIST, fieldId: PaymentManagementFormConstants_1.PaymentManagementFormConstants.PAYMENTMETHOD.CID, line: i });
                paymentMethodId = currentRec.getSublistValue({ sublistId: PaymentManagementFormConstants_1.PaymentManagementFormConstants.PAYMENTMETHOD.SUBLIST, fieldId: PaymentManagementFormConstants_1.PaymentManagementFormConstants.PAYMENTMETHOD.ID, line: i });
                selectedCount++;
            }
        }
        if (selectedCount === 1) {
            dialog.confirm({
                title: 'Confirmation',
                message: 'Are you sure you want to set this payment method as default?'
            }).then(result => {
                try {
                    if (result) {
                        https.post({
                            body: {},
                            url: `${location.href}&pm=${paymentMethodId}&cs=${customerId}&s=${subsidiaryId}&default=T`
                        });
                        window.onbeforeunload = null;
                        location.reload();
                    }
                }
                catch (err) {
                }
            }).catch(reason => {
                // do nothing
            });
        }
        else {
            alert("One payment method needs to be selected.");
        }
    };
    exports.defaultCard = defaultCard;
});
