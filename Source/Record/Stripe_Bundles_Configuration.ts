/**
 * @copyright 2022 Myers-Holum Inc.
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

import * as search from 'N/search';
import {CustomRecord, TextValue} from './CustomRecord';

// This is the class used to load the Stripe Automatic Payments Custom Record
export class Stripe_Bundles_Configuration extends CustomRecord {
    protected get Lookup(): any {

        return {}
    }
    // Declare the record id
    public static readonly RECORDID = 'customrecord_mhi_stripe_bundles_config';

    constructor() {
        super(Stripe_Bundles_Configuration.RECORDID);

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
    get CUSTOMERPORTAL_PARTIALPAYMENTSENABLED(): boolean {
        let partialPayments = false;

        // If line level partial payments or body level partial payments is on
        if (this.recordId > - 1 && ((<PaymentPortalConfiguration>this.PaymentPortalConfiguration)?.custrecord_mhi_stripe_portal_partial_lin || (<PaymentPortalConfiguration>this.PaymentPortalConfiguration)?.custrecord_mhi_stripe_portal_partial_bod)) {
            partialPayments = true;
        }

        return partialPayments;
    }

    // Customer Portal - Check if it's line level partials
    get CUSTOMERPORTAL_PARTIALPAYMENTSLINE(): boolean {
        return this.recordId > - 1? (<PaymentPortalConfiguration>this.PaymentPortalConfiguration)?.custrecord_mhi_stripe_portal_partial_lin: false;
    }

    // Customer Portal - Check if it's body level partials
    get CUSTOMERPORTAL_PARTIALPAYMENTSBODY(): boolean {
        return this.recordId > - 1? (<PaymentPortalConfiguration>this.PaymentPortalConfiguration)?.custrecord_mhi_stripe_portal_partial_bod: false;
    }

    // Customer Portal - Get customer support's email
    get CUSTOMERPORTAL_SUPPORTEMAIL(): string {
        return this.recordId > - 1? (<PaymentPortalConfiguration>this.PaymentPortalConfiguration)?.custrecord_mhi_stripe_portal_email: 'support@email.com';
    }

    // Customer Portal - Check if customer creation is enabled when not found
    get CUSTOMERPORTAL_CUSTOMERCREATIONENABLED(): boolean {
        return this.recordId > - 1? (<PaymentPortalConfiguration>this.PaymentPortalConfiguration)?.custrecord_mhi_stripe_portal_create_cust: false;
    }

    // Customer Portal - Check if pin authorization is enabled
    get CUSTOMERPORTAL_PINAUTHORIZATIONENABLED(): boolean {

        return this.recordId > - 1? (<PaymentPortalConfiguration>this.PaymentPortalConfiguration)?.custrecord_mhi_stripe_portal_pin: false;
    }

    // Customer Portal - Check if charge credit card is enabled
    get CUSTOMERPORTAL_CHARGE_CREDITCARD_FEE(): boolean {
        return this.recordId > - 1? (<PaymentPortalConfiguration>this.PaymentPortalConfiguration)?.custrecord_mhi_stripe_portal_charge_fee: false;
    }

    // Customer - Check if charge credit card is enabled
    get CUSTOMERPORTAL_CREDITCARD_FEE_THRESHOLD_AMOUNT(): number {
        return this.recordId > - 1? +(<PaymentPortalConfiguration>this.PaymentPortalConfiguration)?.custrecord_mhi_stripe_portal_fee_thresho: 0;
    }

    // AutoPay - Check if charge credit card is enabled
    get AUTOPAY_CHARGE_CREDITCARD_FEE(): boolean {
        return this.recordId > - 1? (<AutoPayConfiguration>this.AutoPayConfiguration)?.custrecord_mhi_stripe_autopay_charge_fee: false;
    }

    // AutoPay - Get the interval in days
    get AUTOPAY_PAYMENT_INTERVAL(): number {
        return this.recordId > - 1? (<AutoPayConfiguration>this.AutoPayConfiguration).custrecord_mhi_stripe_autopay_interval:  1;
    }

    // AutoPay - Get the maximum retry count
    get AUTOPAY_MAXIMUM_RETRY_COUNT(): number {
        return this.recordId > - 1? +(<AutoPayConfiguration>this.AutoPayConfiguration)?.custrecord_mhi_stripe_autopay_retrycount: 3;
    }

    // AutoPay - Use Most Recent Payment Method?
    get AUTOPAY_USE_MOST_RECENT_PAYMENT_METHOD(): boolean {
        return this.recordId > - 1? (<AutoPayConfiguration>this.AutoPayConfiguration)?.custrecord_mhi_stripe_autopay_recent_pm: false;
    }

    /*
    // Installments - Check if charge credit card is enabled
    get INSTALLMENTS_CHARGE_CREDITCARD_FEE(): boolean {
        return this.recordId > - 1? (<InstallmentsConfiguration>this.InstallmentsConfiguration)?.custrecord_mhi_stripe_install_charge_fee: false;
    }*/

    // Installments - Get the interval in days
    get INSTALLMENTS_PAYMENT_INTERVAL(): number {
        return this.recordId > - 1? (<InstallmentsConfiguration>this.InstallmentsConfiguration).custrecord_mhi_stripe_install_interval:  1;
    }

    // Installments - Get the maximum retry count
    get INSTALLMENTS_MAXIMUM_RETRY_COUNT(): number {
        return this.recordId > - 1? +(<InstallmentsConfiguration>this.InstallmentsConfiguration)?.custrecord_mhi_stripe_install_retrycount: 3;
    }

    // Installments - Use Most Recent Payment Method?
    get INSTALLMENTS_USE_MOST_RECENT_PAYMENT_METHOD(): boolean {
        return this.recordId > - 1? (<InstallmentsConfiguration>this.InstallmentsConfiguration)?.custrecord_mhi_stripe_install_recent_pm: false;
    }

    // AuthCapture - Check if charge credit card is enabled
    get AUTHCAPTURE_CHARGE_CREDITCARD_FEE(): boolean {
        return this.recordId > - 1? (<AuthCaptureConfiguration>this.AuthCaptureConfiguration)?.custrecord_mhi_stripe_authcap_charge_fee: false;
    }

    // AuthCapture - Get the interval in days
    get AUTHCAPTURE_PAYMENT_INTERVAL(): number {
        return this.recordId > - 1? (<AuthCaptureConfiguration>this.AuthCaptureConfiguration).custrecord_mhi_stripe_authcap_interval:  1;
    }

    // AuthCapture - Get the maximum retry count
    get AUTHCAPTURE_MAXIMUM_RETRY_COUNT(): number {
        return this.recordId > - 1? +(<AuthCaptureConfiguration>this.AuthCaptureConfiguration)?.custrecord_mhi_stripe_authcap_retrycount: 3;
    }

    // AuthCapture - Use Most Recent Payment Method?
    get AUTHCAPTURE_USE_MOST_RECENT_PAYMENT_METHOD(): boolean {
        return this.recordId > - 1? (<AuthCaptureConfiguration>this.AuthCaptureConfiguration)?.custrecord_mhi_stripe_authcap_recent_pm: false;
    }

    // Refund - Get the supported records for refund btn
    get REFUND_BTN_SUPPORTED_RECORDS(): string[] {
        let supportedRecords = [];
        if (this.recordId > - 1) {
            // If customer deposits is checked
            if(this.RefundConfiguration?.custrecord_mhi_stripe_refund_customerdep) {
                supportedRecords.push('customerdeposit');
            }
            // If customer refund is checked
            if(this.RefundConfiguration?.custrecord_mhi_stripe_refund_customerref) {
                supportedRecords.push('customerrefund');
            }
            // If invoice is checked
            if(this.RefundConfiguration?.custrecord_mhi_stripe_refund_invoice) {
                supportedRecords.push('invoice');
            }

            // If customer payment is checked
            if(this.RefundConfiguration?.custrecord_mhi_stripe_refund_payment) {
                supportedRecords.push('customerpayment');
            }
        }

        return supportedRecords;
    }

    // Refund - Get the supported records for refund automatic
    get REFUND_AUTOMATIC_SUPPORTED_RECORDS(): string[] {
        let supportedRecords = [];
        if (this.recordId > - 1) {
            // If customer refund is checked
            if(this.RefundConfiguration?.custrecord_mhi_stripe_refund_auto_refund) {
                supportedRecords.push('customerrefund');
            }

            // If customer deposits is checked
            if(this.RefundConfiguration?.custrecord_mhi_stripe_refund_auto_cash) {
                supportedRecords.push('cashrefund');
            }

            // If credit memo is checked
            if(this.RefundConfiguration?.custrecord_mhi_stripe_refund_auto_credit) {
                supportedRecords.push('creditmemo');
            }
        }

        return supportedRecords;
    }

    // Payment Link - Check if SCN is disabled
    get PAYMENTLINK_SCN_DISABLED(): boolean {
        return this.recordId > - 1? (<PaymentLinkConfiguration>this.PaymentLinkConfiguration)?.custrecord_mhi_stripe_link_scn_disabled: false;
    }

    // Payment Link - Check if it's line level partials
    get PAYMENTLINK_PARTIALPAYMENTSLINE(): boolean {
        return this.recordId > - 1? (<PaymentLinkConfiguration>this.PaymentLinkConfiguration)?.custrecord_mhi_stripe_link_partial_line: false;
    }

    // Payment Link - Get customer support's email
    get PAYMENTLINK_SUPPORTEMAIL(): string {
        return this.recordId > - 1? (<PaymentLinkConfiguration>this.PaymentLinkConfiguration)?.custrecord_mhi_stripe_link_email: 'support@email.com';
    }

    // Payment Link - Check if customer creation is enabled when not found
    get PAYMENTLINK_CUSTOMERCREATIONENABLED(): boolean {
        return this.recordId > - 1? (<PaymentLinkConfiguration>this.PaymentLinkConfiguration)?.custrecord_mhi_stripe_link_create_cust: false;
    }

    // Payment Link - Check if pin authorization is enabled
    get PAYMENTLINK_PINAUTHORIZATIONENABLED(): boolean {

        return this.recordId > - 1? (<PaymentLinkConfiguration>this.PaymentLinkConfiguration)?.custrecord_mhi_stripe_link_pin: false;
    }

    // Payment Link - Check if charge credit card is enabled
    get PAYMENTLINK_CHARGE_CREDITCARD_FEE(): boolean {
        return this.recordId > - 1? (<PaymentLinkConfiguration>this.PaymentLinkConfiguration)?.custrecord_mhi_stripe_link_charge_fee: false;
    }
    //  Payment Link - Get form label
    get PAYMENTLINK_FORM_LABEL(): string {
        return this.recordId > - 1? (<PaymentLinkConfiguration>this.PaymentLinkConfiguration)?.custrecord_mhi_stripe_link_form_label: null;
    }

    //  Payment Link - Get stripe fee label
    get PAYMENTLINK_STRIPE_FEE_LABEL(): string {
        return this.recordId > - 1? (<PaymentLinkConfiguration>this.PaymentLinkConfiguration)?.custrecord_mhi_stripe_link_label: `Credit Card Surcharge`;
    }

    //  Payment Link - Get Styles CSS
    get PAYMENTLINK_STYLES_CSS(): string {
        return this.recordId > - 1? (<PaymentLinkConfiguration>this.PaymentLinkConfiguration)?.custrecord_mhi_stripe_link_styles_css: `https://tstdrv2374180.app.netsuite.com/core/media/media.nl?id=4482&c=TSTDRV2374180&h=2ITL1sOOJfcSm-_-3eZeGOw1ut9faKegg_1SdxiYFdiljBWx&_xt=.css`;
    }

    //  Payment Link - Portal CSS
    get PAYMENTLINK_PORTAL_CSS(): string {
        return this.recordId > - 1? (<PaymentLinkConfiguration>this.PaymentLinkConfiguration)?.custrecord_mhi_stripe_link_portal_css: `https://tstdrv2374180.app.netsuite.com/core/media/media.nl?id=4478&c=TSTDRV2374180&h=U9vrNwH6d29LOGA1c7DhYPRU1PrAapYy6kljyZ5oRtowlGV2&_xt=.css`;
    }

    //  Check if charge credit card is enabled
    get PAYMENTLINK_CREDITCARD_FEE_THRESHOLD_AMOUNT(): number {
        return this.recordId > - 1? +(<PaymentLinkConfiguration>this.PaymentLinkConfiguration)?.custrecord_mhi_stripe_link_fee_threshold: 0;
    }

    get GENERAL_STRIPE_PERCENT_FEE(): number {
        let percentFee: number = 0;
        const percentConfig = (<GeneralConfiguration>this.GeneralConfiguration)?.custrecord_mhi_stripe_config_percent_fee;
        if (percentConfig && parseFloat(percentConfig) > 0) {
            // @ts-ignore
            percentFee =  (parseFloat(percentConfig) / 100).toFixed(10);
        }

        return percentFee;
    }

    get GENERAL_STRIPE_FLAT_FEE(): number {
        let flatFee: number = 0;

        if ((<GeneralConfiguration>this.GeneralConfiguration).custrecord_mhi_stripe_config_flat_fee) {
            flatFee = +(<GeneralConfiguration>this.GeneralConfiguration)?.custrecord_mhi_stripe_config_flat_fee;
        }
        return flatFee;
    }

    // Get stripe fee item
    get GENERAL_STRIPE_FEE_ITEM(): {nondirectrevenue: number, directrevenue: number } {
        const stripeFeeItem = {
            nondirectrevenue: -1,
            directrevenue: -1
        };
        if ((<GeneralConfiguration>this.GeneralConfiguration)?.custrecord_mhi_stripe_config_item) {
            stripeFeeItem.nondirectrevenue =  +(<GeneralConfiguration>this.GeneralConfiguration)?.custrecord_mhi_stripe_config_item[0].value
        }
        if ((<GeneralConfiguration>this.GeneralConfiguration)?.custrecord_mhi_stripe_config_item_dr) {
            stripeFeeItem.directrevenue =  +(<GeneralConfiguration>this.GeneralConfiguration)?.custrecord_mhi_stripe_config_item_dr[0].value
        }

        return  stripeFeeItem;
    }
    public GENERAL_CALCULATE_STRIPE_FEES = (amount: number): any => {

        return ((amount + this.GENERAL_STRIPE_FLAT_FEE) / (1 - this.GENERAL_STRIPE_PERCENT_FEE)).toFixed(0);
    }

    public GENERAL_CALCULATE_STRIPE_FEES_ONLY = (amount: number): any => {

        return (((amount + this.GENERAL_STRIPE_FLAT_FEE) / (1 - this.GENERAL_STRIPE_PERCENT_FEE)) - amount).toFixed(0) ;
    }


    // Get stripe fee item
    get GENERAL_STRIPE_FEES_LABEL(): string {
        return (<GeneralConfiguration>this.GeneralConfiguration)?.custrecord_mhi_stripe_config_fees_label ? (<GeneralConfiguration>this.GeneralConfiguration)?.custrecord_mhi_stripe_config_fees_label : `Credit Card Surcharge`;
    }

    // Get Stripe Revenue Fees Account
    get GENERAL_STRIPE_FEES_REVENUEACCOUNT(): number {
        return (<GeneralConfiguration>this.GeneralConfiguration)?.custrecord_mhi_stripe_config_revenue_acc ? +(<GeneralConfiguration>this.GeneralConfiguration)?.custrecord_mhi_stripe_config_revenue_acc[0].value : null;
    }


    get PAYMENTMETHODMANAGEMENT_SUPPORTED_PAYMENT_METHODS(): string [] {
        let paymentMethods: string [] = [];
        if(this.recordId > - 1) {

            // If card is checked
            if ((<PaymentMethodManagementConfiguration>this.PaymentMethodManagementConfiguration)?.custrecord_mhi_stripe_pm_card) {
                paymentMethods.push('card');
            }
            // If us_bank_account is checked
            if ((<PaymentMethodManagementConfiguration>this.PaymentMethodManagementConfiguration)?.custrecord_mhi_stripe_pm_us_bank) {
                paymentMethods.push('us_bank_account');
            }
            // If sepa_debit is checked
            if ((<PaymentMethodManagementConfiguration>this.PaymentMethodManagementConfiguration)?.custrecord_mhi_stripe_pm_sepa) {
                paymentMethods.push('sepa_debit');
            }
            // If acss_debit is checked
            if ((<PaymentMethodManagementConfiguration>this.PaymentMethodManagementConfiguration)?.custrecord_mhi_stripe_pm_acss_debit) {
                paymentMethods.push('acss_debit');
            }

            // If bacs_debit is checked
            if ((<PaymentMethodManagementConfiguration>this.PaymentMethodManagementConfiguration)?.custrecord_mhi_stripe_pm_bacs) {
                paymentMethods.push('bacs_debit');
            }

            // If au_becs_debit is checked
            if ((<PaymentMethodManagementConfiguration>this.PaymentMethodManagementConfiguration)?.custrecord_mhi_stripe_pm_becs) {
                paymentMethods.push('au_becs_debit');
            }

        } else {
            // If no setup, default to card
            paymentMethods.push('card');
        }

        return paymentMethods;
    }


    // Search the needed fields from the config record
    get PaymentPortalConfiguration(): PaymentPortalConfiguration {
        return <PaymentPortalConfiguration>search.lookupFields({
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
    get PaymentLinkConfiguration(): PaymentLinkConfiguration {
        return <PaymentLinkConfiguration>search.lookupFields({
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

    get AutoPayConfiguration(): AutoPayConfiguration {
        return <AutoPayConfiguration>search.lookupFields({
            id: this.recordId,
            type: Stripe_Bundles_Configuration.RECORDID,
            columns: ['custrecord_mhi_stripe_autopay_interval',
                'custrecord_mhi_stripe_autopay_retrycount',
                'custrecord_mhi_stripe_autopay_charge_fee',
                'custrecord_mhi_stripe_autopay_recent_pm'
            ]
        });
    }

    get InstallmentsConfiguration(): InstallmentsConfiguration {
        return <InstallmentsConfiguration>search.lookupFields({
            id: this.recordId,
            type: Stripe_Bundles_Configuration.RECORDID,
            columns: ['custrecord_mhi_stripe_install_interval',
                'custrecord_mhi_stripe_install_retrycount',
                'custrecord_mhi_stripe_install_recent_pm'
            ]
        });
    }

    get AuthCaptureConfiguration(): AuthCaptureConfiguration {
        return <AuthCaptureConfiguration>search.lookupFields({
            id: this.recordId,
            type: Stripe_Bundles_Configuration.RECORDID,
            columns: ['custrecord_mhi_stripe_authcap_interval',
                'custrecord_mhi_stripe_authcap_retrycount',
                'custrecord_mhi_stripe_authcap_charge_fee',
                'custrecord_mhi_stripe_authcap_recent_pm'

            ]
        });
    }

    get PaymentMethodManagementConfiguration(): PaymentMethodManagementConfiguration {
        return <PaymentMethodManagementConfiguration>search.lookupFields({
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

    get RefundConfiguration(): RefundConfiguration {
        return <RefundConfiguration>search.lookupFields({
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

    get GeneralConfiguration(): GeneralConfiguration {
        return <GeneralConfiguration>search.lookupFields({
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

interface PaymentPortalConfiguration {
    custrecord_mhi_stripe_portal_create_cust: boolean;
    custrecord_mhi_stripe_portal_partial_lin: boolean;
    custrecord_mhi_stripe_portal_partial_bod: boolean;
    custrecord_mhi_stripe_portal_pin: boolean;
    custrecord_mhi_stripe_portal_email: string;
    custrecord_mhi_stripe_portal_charge_fee: boolean;
    custrecord_mhi_stripe_portal_fee_thresho: number;
}

interface PaymentLinkConfiguration {
    custrecord_mhi_stripe_link_create_cust: boolean;
    custrecord_mhi_stripe_link_partial_line: boolean;
    custrecord_mhi_stripe_portal_partial_bod: boolean;
    custrecord_mhi_stripe_link_pin: boolean;
    custrecord_mhi_stripe_link_email: string;
    custrecord_mhi_stripe_link_charge_fee: boolean;
    custrecord_mhi_stripe_link_label: string;
    custrecord_mhi_stripe_link_styles_css: string;
    custrecord_mhi_stripe_link_portal_css: string;
    custrecord_mhi_stripe_link_scn_disabled: boolean;
    custrecord_mhi_stripe_link_fee_threshold: number;
    custrecord_mhi_stripe_link_form_label: string;
}
interface PaymentMethodManagementConfiguration {
    custrecord_mhi_stripe_pm_card: boolean;
    custrecord_mhi_stripe_pm_us_bank: boolean;
    custrecord_mhi_stripe_pm_sepa: boolean;
    custrecord_mhi_stripe_pm_acss_debit: boolean;
    custrecord_mhi_stripe_pm_bacs: boolean;
    custrecord_mhi_stripe_pm_becs: boolean;
}

interface AutoPayConfiguration {
    custrecord_mhi_stripe_autopay_interval: number;
    custrecord_mhi_stripe_autopay_retrycount: number;
    custrecord_mhi_stripe_autopay_charge_fee: boolean;
    custrecord_mhi_stripe_autopay_recent_pm: boolean;
}

interface InstallmentsConfiguration {
    custrecord_mhi_stripe_install_interval: number;
    custrecord_mhi_stripe_install_retrycount: number;
    custrecord_mhi_stripe_install_recent_pm: boolean;
}


interface AuthCaptureConfiguration {
    custrecord_mhi_stripe_authcap_interval: number;
    custrecord_mhi_stripe_authcap_retrycount: number;
    custrecord_mhi_stripe_authcap_charge_fee: boolean;
    custrecord_mhi_stripe_authcap_recent_pm: boolean;
}

interface RefundConfiguration {
    custrecord_mhi_stripe_refund_invoice: boolean;
    custrecord_mhi_stripe_refund_customerdep: boolean;
    custrecord_mhi_stripe_refund_customerref: boolean;
    custrecord_mhi_stripe_refund_payment: boolean;
    custrecord_mhi_stripe_refund_auto_refund: boolean;
    custrecord_mhi_stripe_refund_auto_cash: boolean;
    custrecord_mhi_stripe_refund_auto_credit: boolean;
}

interface GeneralConfiguration {
    custrecord_mhi_stripe_config_percent_fee: string;
    custrecord_mhi_stripe_config_flat_fee: number;
    custrecord_mhi_stripe_config_item: [TextValue];
    custrecord_mhi_stripe_config_item_dr: [TextValue];
    custrecord_mhi_stripe_config_fees_label: string;
    custrecord_mhi_stripe_config_revenue_acc: [TextValue];
}
