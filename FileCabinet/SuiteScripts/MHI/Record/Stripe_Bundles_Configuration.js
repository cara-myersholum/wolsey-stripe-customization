/**
 * @copyright 2022 Myers-Holum Inc.
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 */
define(["require", "exports", "N/search", "./CustomRecord"], function (require, exports, search, CustomRecord_1) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Stripe_Bundles_Configuration = void 0;
    // This is the class used to load the Stripe Automatic Payments Custom Record
    class Stripe_Bundles_Configuration extends CustomRecord_1.CustomRecord {
        get Lookup() {
            return {};
        }
        constructor() {
            super(Stripe_Bundles_Configuration.RECORDID);
            this.GENERAL_CALCULATE_STRIPE_FEES = (amount) => {
                return ((amount + this.GENERAL_STRIPE_FLAT_FEE) / (1 - this.GENERAL_STRIPE_PERCENT_FEE)).toFixed(0);
            };
            this.GENERAL_CALCULATE_STRIPE_FEES_ONLY = (amount) => {
                return (((amount + this.GENERAL_STRIPE_FLAT_FEE) / (1 - this.GENERAL_STRIPE_PERCENT_FEE)) - amount).toFixed(0);
            };
            // Search if there is a configuration record
            search.create({
                type: Stripe_Bundles_Configuration.RECORDID,
                filters: ['isinactive', 'is', 'F']
            }).run().each(result => {
                this.recordId = +result.id;
                return true;
            });
        }
        // Customer Portal - check if partial payments is enabled
        get CUSTOMERPORTAL_PARTIALPAYMENTSENABLED() {
            var _a, _b;
            let partialPayments = false;
            // If line level partial payments or body level partial payments is on
            if (this.recordId > -1 && (((_a = this.PaymentPortalConfiguration) === null || _a === void 0 ? void 0 : _a.custrecord_mhi_stripe_portal_partial_lin) || ((_b = this.PaymentPortalConfiguration) === null || _b === void 0 ? void 0 : _b.custrecord_mhi_stripe_portal_partial_bod))) {
                partialPayments = true;
            }
            return partialPayments;
        }
        // Customer Portal - Check if it's line level partials
        get CUSTOMERPORTAL_PARTIALPAYMENTSLINE() {
            var _a;
            return this.recordId > -1 ? (_a = this.PaymentPortalConfiguration) === null || _a === void 0 ? void 0 : _a.custrecord_mhi_stripe_portal_partial_lin : false;
        }
        // Customer Portal - Check if it's body level partials
        get CUSTOMERPORTAL_PARTIALPAYMENTSBODY() {
            var _a;
            return this.recordId > -1 ? (_a = this.PaymentPortalConfiguration) === null || _a === void 0 ? void 0 : _a.custrecord_mhi_stripe_portal_partial_bod : false;
        }
        // Customer Portal - Get customer support's email
        get CUSTOMERPORTAL_SUPPORTEMAIL() {
            var _a;
            return this.recordId > -1 ? (_a = this.PaymentPortalConfiguration) === null || _a === void 0 ? void 0 : _a.custrecord_mhi_stripe_portal_email : 'support@email.com';
        }
        // Customer Portal - Check if customer creation is enabled when not found
        get CUSTOMERPORTAL_CUSTOMERCREATIONENABLED() {
            var _a;
            return this.recordId > -1 ? (_a = this.PaymentPortalConfiguration) === null || _a === void 0 ? void 0 : _a.custrecord_mhi_stripe_portal_create_cust : false;
        }
        // Customer Portal - Check if pin authorization is enabled
        get CUSTOMERPORTAL_PINAUTHORIZATIONENABLED() {
            var _a;
            return this.recordId > -1 ? (_a = this.PaymentPortalConfiguration) === null || _a === void 0 ? void 0 : _a.custrecord_mhi_stripe_portal_pin : false;
        }
        // Customer Portal - Check if charge credit card is enabled
        get CUSTOMERPORTAL_CHARGE_CREDITCARD_FEE() {
            var _a;
            return this.recordId > -1 ? (_a = this.PaymentPortalConfiguration) === null || _a === void 0 ? void 0 : _a.custrecord_mhi_stripe_portal_charge_fee : false;
        }
        // Customer - Check if charge credit card is enabled
        get CUSTOMERPORTAL_CREDITCARD_FEE_THRESHOLD_AMOUNT() {
            var _a;
            return this.recordId > -1 ? +((_a = this.PaymentPortalConfiguration) === null || _a === void 0 ? void 0 : _a.custrecord_mhi_stripe_portal_fee_thresho) : 0;
        }
        // AutoPay - Check if charge credit card is enabled
        get AUTOPAY_CHARGE_CREDITCARD_FEE() {
            var _a;
            return this.recordId > -1 ? (_a = this.AutoPayConfiguration) === null || _a === void 0 ? void 0 : _a.custrecord_mhi_stripe_autopay_charge_fee : false;
        }
        // AutoPay - Get the interval in days
        get AUTOPAY_PAYMENT_INTERVAL() {
            return this.recordId > -1 ? this.AutoPayConfiguration.custrecord_mhi_stripe_autopay_interval : 1;
        }
        // AutoPay - Get the maximum retry count
        get AUTOPAY_MAXIMUM_RETRY_COUNT() {
            var _a;
            return this.recordId > -1 ? +((_a = this.AutoPayConfiguration) === null || _a === void 0 ? void 0 : _a.custrecord_mhi_stripe_autopay_retrycount) : 3;
        }
        // AutoPay - Use Most Recent Payment Method?
        get AUTOPAY_USE_MOST_RECENT_PAYMENT_METHOD() {
            var _a;
            return this.recordId > -1 ? (_a = this.AutoPayConfiguration) === null || _a === void 0 ? void 0 : _a.custrecord_mhi_stripe_autopay_recent_pm : false;
        }
        /*
        // Installments - Check if charge credit card is enabled
        get INSTALLMENTS_CHARGE_CREDITCARD_FEE(): boolean {
            return this.recordId > - 1? (<InstallmentsConfiguration>this.InstallmentsConfiguration)?.custrecord_mhi_stripe_install_charge_fee: false;
        }*/
        // Installments - Get the interval in days
        get INSTALLMENTS_PAYMENT_INTERVAL() {
            return this.recordId > -1 ? this.InstallmentsConfiguration.custrecord_mhi_stripe_install_interval : 1;
        }
        // Installments - Get the maximum retry count
        get INSTALLMENTS_MAXIMUM_RETRY_COUNT() {
            var _a;
            return this.recordId > -1 ? +((_a = this.InstallmentsConfiguration) === null || _a === void 0 ? void 0 : _a.custrecord_mhi_stripe_install_retrycount) : 3;
        }
        // Installments - Use Most Recent Payment Method?
        get INSTALLMENTS_USE_MOST_RECENT_PAYMENT_METHOD() {
            var _a;
            return this.recordId > -1 ? (_a = this.InstallmentsConfiguration) === null || _a === void 0 ? void 0 : _a.custrecord_mhi_stripe_install_recent_pm : false;
        }
        // AuthCapture - Check if charge credit card is enabled
        get AUTHCAPTURE_CHARGE_CREDITCARD_FEE() {
            var _a;
            return this.recordId > -1 ? (_a = this.AuthCaptureConfiguration) === null || _a === void 0 ? void 0 : _a.custrecord_mhi_stripe_authcap_charge_fee : false;
        }
        // AuthCapture - Get the interval in days
        get AUTHCAPTURE_PAYMENT_INTERVAL() {
            return this.recordId > -1 ? this.AuthCaptureConfiguration.custrecord_mhi_stripe_authcap_interval : 1;
        }
        // AuthCapture - Get the maximum retry count
        get AUTHCAPTURE_MAXIMUM_RETRY_COUNT() {
            var _a;
            return this.recordId > -1 ? +((_a = this.AuthCaptureConfiguration) === null || _a === void 0 ? void 0 : _a.custrecord_mhi_stripe_authcap_retrycount) : 3;
        }
        // AuthCapture - Use Most Recent Payment Method?
        get AUTHCAPTURE_USE_MOST_RECENT_PAYMENT_METHOD() {
            var _a;
            return this.recordId > -1 ? (_a = this.AuthCaptureConfiguration) === null || _a === void 0 ? void 0 : _a.custrecord_mhi_stripe_authcap_recent_pm : false;
        }
        // Refund - Get the supported records for refund btn
        get REFUND_BTN_SUPPORTED_RECORDS() {
            var _a, _b, _c, _d;
            let supportedRecords = [];
            if (this.recordId > -1) {
                // If customer deposits is checked
                if ((_a = this.RefundConfiguration) === null || _a === void 0 ? void 0 : _a.custrecord_mhi_stripe_refund_customerdep) {
                    supportedRecords.push('customerdeposit');
                }
                // If customer refund is checked
                if ((_b = this.RefundConfiguration) === null || _b === void 0 ? void 0 : _b.custrecord_mhi_stripe_refund_customerref) {
                    supportedRecords.push('customerrefund');
                }
                // If invoice is checked
                if ((_c = this.RefundConfiguration) === null || _c === void 0 ? void 0 : _c.custrecord_mhi_stripe_refund_invoice) {
                    supportedRecords.push('invoice');
                }
                // If customer payment is checked
                if ((_d = this.RefundConfiguration) === null || _d === void 0 ? void 0 : _d.custrecord_mhi_stripe_refund_payment) {
                    supportedRecords.push('customerpayment');
                }
            }
            return supportedRecords;
        }
        // Refund - Get the supported records for refund automatic
        get REFUND_AUTOMATIC_SUPPORTED_RECORDS() {
            var _a, _b, _c;
            let supportedRecords = [];
            if (this.recordId > -1) {
                // If customer refund is checked
                if ((_a = this.RefundConfiguration) === null || _a === void 0 ? void 0 : _a.custrecord_mhi_stripe_refund_auto_refund) {
                    supportedRecords.push('customerrefund');
                }
                // If customer deposits is checked
                if ((_b = this.RefundConfiguration) === null || _b === void 0 ? void 0 : _b.custrecord_mhi_stripe_refund_auto_cash) {
                    supportedRecords.push('cashrefund');
                }
                // If credit memo is checked
                if ((_c = this.RefundConfiguration) === null || _c === void 0 ? void 0 : _c.custrecord_mhi_stripe_refund_auto_credit) {
                    supportedRecords.push('creditmemo');
                }
            }
            return supportedRecords;
        }
        // Payment Link - Check if SCN is disabled
        get PAYMENTLINK_SCN_DISABLED() {
            var _a;
            return this.recordId > -1 ? (_a = this.PaymentLinkConfiguration) === null || _a === void 0 ? void 0 : _a.custrecord_mhi_stripe_link_scn_disabled : false;
        }
        // Payment Link - Check if it's line level partials
        get PAYMENTLINK_PARTIALPAYMENTSLINE() {
            var _a;
            return this.recordId > -1 ? (_a = this.PaymentLinkConfiguration) === null || _a === void 0 ? void 0 : _a.custrecord_mhi_stripe_link_partial_line : false;
        }
        // Payment Link - Get customer support's email
        get PAYMENTLINK_SUPPORTEMAIL() {
            var _a;
            return this.recordId > -1 ? (_a = this.PaymentLinkConfiguration) === null || _a === void 0 ? void 0 : _a.custrecord_mhi_stripe_link_email : 'support@email.com';
        }
        // Payment Link - Check if customer creation is enabled when not found
        get PAYMENTLINK_CUSTOMERCREATIONENABLED() {
            var _a;
            return this.recordId > -1 ? (_a = this.PaymentLinkConfiguration) === null || _a === void 0 ? void 0 : _a.custrecord_mhi_stripe_link_create_cust : false;
        }
        // Payment Link - Check if pin authorization is enabled
        get PAYMENTLINK_PINAUTHORIZATIONENABLED() {
            var _a;
            return this.recordId > -1 ? (_a = this.PaymentLinkConfiguration) === null || _a === void 0 ? void 0 : _a.custrecord_mhi_stripe_link_pin : false;
        }
        // Payment Link - Check if charge credit card is enabled
        get PAYMENTLINK_CHARGE_CREDITCARD_FEE() {
            var _a;
            return this.recordId > -1 ? (_a = this.PaymentLinkConfiguration) === null || _a === void 0 ? void 0 : _a.custrecord_mhi_stripe_link_charge_fee : false;
        }
        //  Payment Link - Get form label
        get PAYMENTLINK_FORM_LABEL() {
            var _a;
            return this.recordId > -1 ? (_a = this.PaymentLinkConfiguration) === null || _a === void 0 ? void 0 : _a.custrecord_mhi_stripe_link_form_label : null;
        }
        //  Payment Link - Get stripe fee label
        get PAYMENTLINK_STRIPE_FEE_LABEL() {
            var _a;
            return this.recordId > -1 ? (_a = this.PaymentLinkConfiguration) === null || _a === void 0 ? void 0 : _a.custrecord_mhi_stripe_link_label : `Credit Card Surcharge`;
        }
        //  Payment Link - Get Styles CSS
        get PAYMENTLINK_STYLES_CSS() {
            var _a;
            return this.recordId > -1 ? (_a = this.PaymentLinkConfiguration) === null || _a === void 0 ? void 0 : _a.custrecord_mhi_stripe_link_styles_css : `https://tstdrv2374180.app.netsuite.com/core/media/media.nl?id=4482&c=TSTDRV2374180&h=2ITL1sOOJfcSm-_-3eZeGOw1ut9faKegg_1SdxiYFdiljBWx&_xt=.css`;
        }
        //  Payment Link - Portal CSS
        get PAYMENTLINK_PORTAL_CSS() {
            var _a;
            return this.recordId > -1 ? (_a = this.PaymentLinkConfiguration) === null || _a === void 0 ? void 0 : _a.custrecord_mhi_stripe_link_portal_css : `https://tstdrv2374180.app.netsuite.com/core/media/media.nl?id=4478&c=TSTDRV2374180&h=U9vrNwH6d29LOGA1c7DhYPRU1PrAapYy6kljyZ5oRtowlGV2&_xt=.css`;
        }
        //  Check if charge credit card is enabled
        get PAYMENTLINK_CREDITCARD_FEE_THRESHOLD_AMOUNT() {
            var _a;
            return this.recordId > -1 ? +((_a = this.PaymentLinkConfiguration) === null || _a === void 0 ? void 0 : _a.custrecord_mhi_stripe_link_fee_threshold) : 0;
        }
        get GENERAL_STRIPE_PERCENT_FEE() {
            var _a;
            let percentFee = 0;
            const percentConfig = (_a = this.GeneralConfiguration) === null || _a === void 0 ? void 0 : _a.custrecord_mhi_stripe_config_percent_fee;
            if (percentConfig && parseFloat(percentConfig) > 0) {
                // @ts-ignore
                percentFee = (parseFloat(percentConfig) / 100).toFixed(10);
            }
            return percentFee;
        }
        get GENERAL_STRIPE_FLAT_FEE() {
            var _a;
            let flatFee = 0;
            if (this.GeneralConfiguration.custrecord_mhi_stripe_config_flat_fee) {
                flatFee = +((_a = this.GeneralConfiguration) === null || _a === void 0 ? void 0 : _a.custrecord_mhi_stripe_config_flat_fee);
            }
            return flatFee;
        }
        // Get stripe fee item
        get GENERAL_STRIPE_FEE_ITEM() {
            var _a, _b, _c, _d;
            const stripeFeeItem = {
                nondirectrevenue: -1,
                directrevenue: -1
            };
            if ((_a = this.GeneralConfiguration) === null || _a === void 0 ? void 0 : _a.custrecord_mhi_stripe_config_item) {
                stripeFeeItem.nondirectrevenue = +((_b = this.GeneralConfiguration) === null || _b === void 0 ? void 0 : _b.custrecord_mhi_stripe_config_item[0].value);
            }
            if ((_c = this.GeneralConfiguration) === null || _c === void 0 ? void 0 : _c.custrecord_mhi_stripe_config_item_dr) {
                stripeFeeItem.directrevenue = +((_d = this.GeneralConfiguration) === null || _d === void 0 ? void 0 : _d.custrecord_mhi_stripe_config_item_dr[0].value);
            }
            return stripeFeeItem;
        }
        // Get stripe fee item
        get GENERAL_STRIPE_FEES_LABEL() {
            var _a, _b;
            return ((_a = this.GeneralConfiguration) === null || _a === void 0 ? void 0 : _a.custrecord_mhi_stripe_config_fees_label) ? (_b = this.GeneralConfiguration) === null || _b === void 0 ? void 0 : _b.custrecord_mhi_stripe_config_fees_label : `Credit Card Surcharge`;
        }
        // Get Stripe Revenue Fees Account
        get GENERAL_STRIPE_FEES_REVENUEACCOUNT() {
            var _a, _b;
            return ((_a = this.GeneralConfiguration) === null || _a === void 0 ? void 0 : _a.custrecord_mhi_stripe_config_revenue_acc) ? +((_b = this.GeneralConfiguration) === null || _b === void 0 ? void 0 : _b.custrecord_mhi_stripe_config_revenue_acc[0].value) : null;
        }
        get PAYMENTMETHODMANAGEMENT_SUPPORTED_PAYMENT_METHODS() {
            var _a, _b, _c, _d, _e, _f;
            let paymentMethods = [];
            if (this.recordId > -1) {
                // If card is checked
                if ((_a = this.PaymentMethodManagementConfiguration) === null || _a === void 0 ? void 0 : _a.custrecord_mhi_stripe_pm_card) {
                    paymentMethods.push('card');
                }
                // If us_bank_account is checked
                if ((_b = this.PaymentMethodManagementConfiguration) === null || _b === void 0 ? void 0 : _b.custrecord_mhi_stripe_pm_us_bank) {
                    paymentMethods.push('us_bank_account');
                }
                // If sepa_debit is checked
                if ((_c = this.PaymentMethodManagementConfiguration) === null || _c === void 0 ? void 0 : _c.custrecord_mhi_stripe_pm_sepa) {
                    paymentMethods.push('sepa_debit');
                }
                // If acss_debit is checked
                if ((_d = this.PaymentMethodManagementConfiguration) === null || _d === void 0 ? void 0 : _d.custrecord_mhi_stripe_pm_acss_debit) {
                    paymentMethods.push('acss_debit');
                }
                // If bacs_debit is checked
                if ((_e = this.PaymentMethodManagementConfiguration) === null || _e === void 0 ? void 0 : _e.custrecord_mhi_stripe_pm_bacs) {
                    paymentMethods.push('bacs_debit');
                }
                // If au_becs_debit is checked
                if ((_f = this.PaymentMethodManagementConfiguration) === null || _f === void 0 ? void 0 : _f.custrecord_mhi_stripe_pm_becs) {
                    paymentMethods.push('au_becs_debit');
                }
            }
            else {
                // If no setup, default to card
                paymentMethods.push('card');
            }
            return paymentMethods;
        }
        // Search the needed fields from the config record
        get PaymentPortalConfiguration() {
            return search.lookupFields({
                id: this.recordId,
                type: Stripe_Bundles_Configuration.RECORDID,
                columns: ['custrecord_mhi_stripe_portal_create_cust',
                    'custrecord_mhi_stripe_portal_partial_lin',
                    'custrecord_mhi_stripe_portal_partial_bod',
                    'custrecord_mhi_stripe_portal_pin',
                    'custrecord_mhi_stripe_portal_email',
                    'custrecord_mhi_stripe_portal_charge_fee',
                    'custrecord_mhi_stripe_portal_fee_thresho'
                ]
            });
        }
        // Search the needed fields from the config record
        get PaymentLinkConfiguration() {
            return search.lookupFields({
                id: this.recordId,
                type: Stripe_Bundles_Configuration.RECORDID,
                columns: ['custrecord_mhi_stripe_link_create_cust',
                    'custrecord_mhi_stripe_link_partial_line',
                    'custrecord_mhi_stripe_link_pin',
                    'custrecord_mhi_stripe_link_email',
                    'custrecord_mhi_stripe_link_charge_fee',
                    'custrecord_mhi_stripe_link_label',
                    'custrecord_mhi_stripe_link_styles_css',
                    'custrecord_mhi_stripe_link_portal_css',
                    'custrecord_mhi_stripe_link_scn_disabled',
                    'custrecord_mhi_stripe_link_fee_threshold',
                    'custrecord_mhi_stripe_link_form_label'
                ]
            });
        }
        get AutoPayConfiguration() {
            return search.lookupFields({
                id: this.recordId,
                type: Stripe_Bundles_Configuration.RECORDID,
                columns: ['custrecord_mhi_stripe_autopay_interval',
                    'custrecord_mhi_stripe_autopay_retrycount',
                    'custrecord_mhi_stripe_autopay_charge_fee',
                    'custrecord_mhi_stripe_autopay_recent_pm'
                ]
            });
        }
        get InstallmentsConfiguration() {
            return search.lookupFields({
                id: this.recordId,
                type: Stripe_Bundles_Configuration.RECORDID,
                columns: ['custrecord_mhi_stripe_install_interval',
                    'custrecord_mhi_stripe_install_retrycount',
                    'custrecord_mhi_stripe_install_recent_pm'
                ]
            });
        }
        get AuthCaptureConfiguration() {
            return search.lookupFields({
                id: this.recordId,
                type: Stripe_Bundles_Configuration.RECORDID,
                columns: ['custrecord_mhi_stripe_authcap_interval',
                    'custrecord_mhi_stripe_authcap_retrycount',
                    'custrecord_mhi_stripe_authcap_charge_fee',
                    'custrecord_mhi_stripe_authcap_recent_pm'
                ]
            });
        }
        get PaymentMethodManagementConfiguration() {
            return search.lookupFields({
                id: this.recordId,
                type: Stripe_Bundles_Configuration.RECORDID,
                columns: ['custrecord_mhi_stripe_pm_card',
                    'custrecord_mhi_stripe_pm_us_bank',
                    'custrecord_mhi_stripe_pm_sepa',
                    'custrecord_mhi_stripe_pm_acss_debit',
                    'custrecord_mhi_stripe_pm_bacs',
                    'custrecord_mhi_stripe_pm_becs'
                ]
            });
        }
        get RefundConfiguration() {
            return search.lookupFields({
                id: this.recordId,
                type: Stripe_Bundles_Configuration.RECORDID,
                columns: ['custrecord_mhi_stripe_refund_invoice',
                    'custrecord_mhi_stripe_refund_customerdep',
                    'custrecord_mhi_stripe_refund_customerref',
                    'custrecord_mhi_stripe_refund_payment',
                    'custrecord_mhi_stripe_refund_auto_refund',
                    'custrecord_mhi_stripe_refund_auto_cash',
                    'custrecord_mhi_stripe_refund_auto_credit'
                ]
            });
        }
        get GeneralConfiguration() {
            return search.lookupFields({
                id: this.recordId,
                type: Stripe_Bundles_Configuration.RECORDID,
                columns: ['custrecord_mhi_stripe_config_percent_fee',
                    'custrecord_mhi_stripe_config_flat_fee',
                    'custrecord_mhi_stripe_config_item',
                    'custrecord_mhi_stripe_config_item_dr',
                    'custrecord_mhi_stripe_config_fees_label',
                    'custrecord_mhi_stripe_config_revenue_acc'
                ]
            });
        }
    }
    exports.Stripe_Bundles_Configuration = Stripe_Bundles_Configuration;
    // Declare the record id
    Stripe_Bundles_Configuration.RECORDID = 'customrecord_mhi_stripe_bundles_config';
});
