/**
 * @copyright 2022 Myers-Holum Inc.
 *
 */
define(["require", "exports"], function (require, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InvoiceSummaryFormConstants = void 0;
    // tslint:disable-next-line:variable-name
    exports.InvoiceSummaryFormConstants = {
        FIELD_GROUP: {
            FILTERS: 'custpage_mhi_stripe_filters_group',
            PAYMENTMETHODS: 'custpage_mhi_stripe_payment_method_group'
        },
        PARAMS: {
            KEY: 'p'
        },
        FIELDID: {
            ENTITY: 'custpage_mhi_stripe_entity',
            ENTITYID: 'custpage_mhi_stripe_entity_type',
            RESETDATE: 'custpage_mhi_stripe_reset_date',
            SUMMARY: 'custpage_mhi_stripe_summary',
            SUBTOTAL: 'custpage_mhi_stripe_subtotal',
            CURRENCY: 'custpage_mhi_stripe_currency',
            CSS: 'custpage_mhi_stripe_css'
        },
        PAYMENTMETHOD: {
            SUBLIST: 'custpage_payment_method_list',
            ID: 'custpage_payment_method_id',
            CID: 'custpage_payment_method_id',
            SELECT: 'custpage_payment_method_select'
        }
    };
});
