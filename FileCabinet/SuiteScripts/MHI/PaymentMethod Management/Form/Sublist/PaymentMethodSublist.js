/**
 * @copyright 2022 Myers-Holum Inc.

 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 */
define(["require", "exports", "N/ui/serverWidget"], function (require, exports, serverWidget) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PaymentMethodSublist = void 0;
    class PaymentMethodSublist {
        constructor(context, form, tab) {
            this.context = context;
            this.form = form;
            this.paymentMethodSublist = form.addSublist({
                id: PaymentMethodSublist.ID,
                type: serverWidget.SublistType.LIST,
                tab: tab,
                label: `Saved Payment Methods`
            });
            this.paymentMethodSublist.addField({
                id: PaymentMethodSublist.FIELDID.ID,
                label: 'ID',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
            this.paymentMethodSublist.addField({
                id: PaymentMethodSublist.FIELDID.CID,
                label: 'CID',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
            this.paymentMethodSublist.addField({
                id: PaymentMethodSublist.FIELDID.SELECT,
                label: 'Select',
                type: serverWidget.FieldType.CHECKBOX
            }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });
            this.paymentMethodSublist.addField({
                id: PaymentMethodSublist.FIELDID.TYPE,
                label: 'Payment Method Type',
                type: serverWidget.FieldType.TEXT
            });
            this.paymentMethodSublist.addField({
                id: PaymentMethodSublist.FIELDID.PAYMENTMETHOD,
                label: 'Payment Method',
                type: serverWidget.FieldType.TEXT
            });
            this.paymentMethodSublist.addField({
                id: PaymentMethodSublist.FIELDID.DEFAULT,
                label: 'Default',
                type: serverWidget.FieldType.TEXT
            });
            this.paymentMethodSublist.addButton({
                id: PaymentMethodSublist.FIELDID.DEFAULTBUTTON,
                label: 'Default',
                functionName: 'defaultCard()'
            });
            this.paymentMethodSublist.addButton({
                id: PaymentMethodSublist.FIELDID.DELETEBUTTON,
                label: 'Delete',
                functionName: 'deleteCard()'
            });
            form.addButton({ functionName: 'goBack()', id: 'custpage_back_btn', label: 'Back' });
        }
        set PaymentMethods(paymentMethods) {
            paymentMethods.forEach((paymentMethod, index) => {
                this.paymentMethodSublist.setSublistValue({ id: PaymentMethodSublist.FIELDID.ID, value: `${paymentMethod.id}`, line: index });
                this.paymentMethodSublist.setSublistValue({ id: PaymentMethodSublist.FIELDID.CID, value: `${paymentMethod.customer}`, line: index });
                this.paymentMethodSublist.setSublistValue({ id: PaymentMethodSublist.FIELDID.TYPE, value: `${paymentMethod.type}`, line: index });
                this.paymentMethodSublist.setSublistValue({ id: PaymentMethodSublist.FIELDID.DEFAULT, value: paymentMethod.default ? `Default` : ` `, line: index });
                switch (paymentMethod.type) {
                    case 'card':
                        this.paymentMethodSublist.setSublistValue({ id: PaymentMethodSublist.FIELDID.PAYMENTMETHOD, value: `${paymentMethod.card.brand.toUpperCase()}   ****${paymentMethod.card.last4}   ${paymentMethod.card.exp_month}/${paymentMethod.card.exp_year}`.toUpperCase(), line: index });
                        break;
                    case 'us_bank_account':
                        this.paymentMethodSublist.setSublistValue({ id: PaymentMethodSublist.FIELDID.PAYMENTMETHOD, value: `${paymentMethod.us_bank_account.bank_name.toUpperCase()}   ****${paymentMethod.us_bank_account.last4}  ${paymentMethod.us_bank_account.account_type.toUpperCase()}`.toUpperCase(), line: index });
                        break;
                    case 'sepa_debit':
                        this.paymentMethodSublist.setSublistValue({ id: PaymentMethodSublist.FIELDID.PAYMENTMETHOD, value: `SEPA Direct Debit   ****${paymentMethod.sepa_debit.last4}`.toUpperCase(), line: index });
                        break;
                    case 'acss_debit':
                        this.paymentMethodSublist.setSublistValue({ id: PaymentMethodSublist.FIELDID.PAYMENTMETHOD, value: `CANADA Pre-Authorized Debit   ****${paymentMethod.acss_debit.last4}`.toUpperCase(), line: index });
                        break;
                    case 'bacs_debit':
                        this.paymentMethodSublist.setSublistValue({ id: PaymentMethodSublist.FIELDID.PAYMENTMETHOD, value: `UK BACS DIRECT DEBIT   ****${paymentMethod.bacs_debit.last4}`.toUpperCase(), line: index });
                        break;
                    case 'au_becs_debit':
                        this.paymentMethodSublist.setSublistValue({ id: PaymentMethodSublist.FIELDID.PAYMENTMETHOD, value: `AU BECS DIRECT DEBIT   ****${paymentMethod.au_becs_debit.last4}`.toUpperCase(), line: index });
                        break;
                    default:
                        break;
                }
            });
        }
    }
    exports.PaymentMethodSublist = PaymentMethodSublist;
    PaymentMethodSublist.ID = 'custpage_payment_method_list';
    PaymentMethodSublist.FIELDID = {
        ID: 'custpage_payment_method_id',
        CID: 'custpage_payment_method_cid',
        SELECT: 'custpage_payment_method_select',
        TYPE: 'custpage_payment_method_type',
        PAYMENTMETHOD: 'custpage_payment_method',
        DEFAULT: 'custpage_payment_method_deflt',
        DEFAULTBUTTON: 'custpage_payment_method_deflt_btn',
        DELETEBUTTON: 'custpage_payment_method_delete_btn',
    };
});
