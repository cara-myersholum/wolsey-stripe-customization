/**
 * @copyright 2022 Myers-Holum Inc.

 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 */
define(["require", "exports", "../Sublist/PaymentMethodSublist"], function (require, exports, PaymentMethodSublist_1) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PaymentMethodTab = void 0;
    class PaymentMethodTab {
        constructor(context, form) {
            /*
           this.pamentMethodsTab = form.addTab({
               id: PaymentMethodTab.NEW_PAYMENT_METHOD,
               label: 'Add a New Payment Method'
           });
    
           this.paymentMethodField  = form.addField({
               id: PaymentManagementFormConstants.FIELDID.PAYMENTMETHODS,
               type: serverWidget.FieldType.INLINEHTML,
               label: ' ',
               container: PaymentMethodTab.NEW_PAYMENT_METHOD
           });*/
            this.context = context;
            this.pamentMethodsTab = form.addTab({
                id: PaymentMethodTab.SAVED_PAYMENT_METHOD,
                label: 'Saved Payment Methods'
            });
            this.paymentMethodSublist = new PaymentMethodSublist_1.PaymentMethodSublist(context, form, PaymentMethodTab.SAVED_PAYMENT_METHOD);
        }
        get PaymentMethodSublist() {
            return this.paymentMethodSublist;
        }
        get PaymentMethodField() {
            return this.paymentMethodField;
        }
    }
    exports.PaymentMethodTab = PaymentMethodTab;
    PaymentMethodTab.SAVED_PAYMENT_METHOD = 'custpage_payment_method_tab';
    PaymentMethodTab.NEW_PAYMENT_METHOD = 'custpage_payment_method_new_tab';
});
