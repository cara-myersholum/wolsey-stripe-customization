/**
 * @copyright 2022 Myers-Holum Inc.
 * @author
 *
 */
define(["require", "exports"], function (require, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PaymentManagementFormConstants = void 0;
    // tslint:disable-next-line:variable-name
    exports.PaymentManagementFormConstants = {
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
            SUBSIDIARYID: 'custpage_mhi_stripe_subsidiaryid',
            CSS: 'custpage_mhi_stripe_css',
            PAYMENTMETHODS: 'custpage_mhi_stripe_payment_method'
        },
        PAYMENTMETHOD: {
            SUBLIST: 'custpage_payment_method_list',
            ID: 'custpage_payment_method_id',
            CID: 'custpage_payment_method_cid',
            SELECT: 'custpage_payment_method_select'
        }
    };
});
