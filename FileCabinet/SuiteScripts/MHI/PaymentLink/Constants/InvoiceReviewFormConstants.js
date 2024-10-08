/**
 * @copyright 2022 Myers-Holum Inc.
 *
 */
define(["require", "exports"], function (require, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InvoiceReviewFormConstants = void 0;
    // tslint:disable-next-line:variable-name
    exports.InvoiceReviewFormConstants = {
        FIELD_GROUP: {
            SUBTOTAL: 'custpage_mhi_stripe_subtotal_group',
            INVOICES: 'custpage_mhi_stripe_invoices_group',
            PAYMENTMETHODS: 'custpage_mhi_stripe_payment_method_group'
        },
        PARAMS: {
            KEY: 'p'
        },
        FIELDID: {
            INVOICES: 'custpage_mhi_stripe_invoices',
            PAYMENTMETHODS: 'custpage_mhi_stripe_payment_method',
            ENTITY: 'custpage_mhi_stripe_entity',
            SUBTOTAL: 'custpage_mhi_stripe_subtotal',
            CSS: 'custpage_mhi_stripe_css',
            PIN: 'custpage_mhi_stripe_pin',
            HTML: 'custpage_mhi_stripe_pin_html'
        }
    };
});
