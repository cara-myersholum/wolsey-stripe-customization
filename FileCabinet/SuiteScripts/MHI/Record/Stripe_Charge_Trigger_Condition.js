/**
 * @copyright 2022 Myers-Holum Inc.
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 */
define(["require", "exports", "N/search", "N/log", "./CustomRecord"], function (require, exports, search, log, CustomRecord_1) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Stripe_Charge_Trigger_Condition = void 0;
    // This is the class used to load/create the Stripe Payment Event Custom Record
    class Stripe_Charge_Trigger_Condition extends CustomRecord_1.CustomRecord {
        constructor() {
            super(Stripe_Charge_Trigger_Condition.RECORDID);
        }
        // Get the Field IDs
        get AllConditions() {
            const conditions = [];
            search.create({
                type: Stripe_Charge_Trigger_Condition.RECORDID,
                filters: ['isinactive', 'is', 'F'],
                columns: [Stripe_Charge_Trigger_Condition.FIELDID.FIELDID, Stripe_Charge_Trigger_Condition.FIELDID.OPERATOR, Stripe_Charge_Trigger_Condition.FIELDID.VALUE]
            }).run().each(result => {
                // If all is populated
                if (result.getValue(Stripe_Charge_Trigger_Condition.FIELDID.FIELDID) && result.getValue(Stripe_Charge_Trigger_Condition.FIELDID.OPERATOR) && result.getValue(Stripe_Charge_Trigger_Condition.FIELDID.VALUE)) {
                    conditions.push({
                        fieldid: result.getValue(Stripe_Charge_Trigger_Condition.FIELDID.FIELDID),
                        operator: result.getText(Stripe_Charge_Trigger_Condition.FIELDID.OPERATOR),
                        value: result.getValue(Stripe_Charge_Trigger_Condition.FIELDID.VALUE),
                    });
                }
                return true;
            });
            log.debug('conditions', conditions);
            return conditions;
        }
        ComparisonFunction(operator) {
            const comparisonOperatorsHash = {
                '<': function (a, b) { return a < b; },
                'greaterthan': function (a, b) { return a < b; },
                'greater than': function (a, b) { return a < b; },
                '>': function (a, b) { return a > b; },
                'lessthan': function (a, b) { return a > b; },
                'less than': function (a, b) { return a > b; },
                '>=': function (a, b) { return a >= b; },
                'lessthanorequal': function (a, b) { return a >= b; },
                'less than or equal': function (a, b) { return a >= b; },
                '<=': function (a, b) { return a <= b; },
                'greaterthanorequal': function (a, b) { return a <= b; },
                'greater than or equal': function (a, b) { return a <= b; },
                '==': function (a, b) { return a == b; },
                'equal': function (a, b) { return a == b; },
                'equals': function (a, b) { return a == b; },
                '===': function (a, b) { return a === b; },
                '!=': function (a, b) { return a != b; },
                '!==': function (a, b) { return a !== b; },
            };
            return comparisonOperatorsHash[operator];
        }
        // This function gets the field values of the payment event
        get Lookup() {
            return search.lookupFields({
                id: this.recordId,
                type: Stripe_Charge_Trigger_Condition.RECORDID,
                columns: ['custrecord_mhi_stripe_condition_field', 'custrecord_mhi_stripe_condition_operator', 'custrecord_mhi_stripe_condition_value']
            });
        }
    }
    exports.Stripe_Charge_Trigger_Condition = Stripe_Charge_Trigger_Condition;
    // Declare the record id
    Stripe_Charge_Trigger_Condition.RECORDID = 'customrecord_mhi_stripe_condition';
    // Declare the field ids
    Stripe_Charge_Trigger_Condition.FIELDID = {
        FIELDID: 'custrecord_mhi_stripe_condition_field',
        OPERATOR: 'custrecord_mhi_stripe_condition_operator',
        VALUE: 'custrecord_mhi_stripe_condition_value'
    };
});
