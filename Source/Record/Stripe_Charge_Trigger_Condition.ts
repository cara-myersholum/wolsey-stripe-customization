/**
 * @copyright 2022 Myers-Holum Inc.
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

import * as search from 'N/search';
import * as log from 'N/log';
import {CustomRecord, TextValue} from './CustomRecord';


// This is the class used to load/create the Stripe Payment Event Custom Record

export class Stripe_Charge_Trigger_Condition extends CustomRecord {
    // Declare the record id
    private static readonly RECORDID = 'customrecord_mhi_stripe_condition';
    // Declare the field ids
    private static readonly FIELDID = {
        FIELDID: 'custrecord_mhi_stripe_condition_field',
        OPERATOR: 'custrecord_mhi_stripe_condition_operator',
        VALUE: 'custrecord_mhi_stripe_condition_value'
    };

    constructor() {
        super(Stripe_Charge_Trigger_Condition.RECORDID);

    }

    // Get the Field IDs
    get AllConditions(): Condition [] {
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
                })
            }
            return true;
        });

        log.debug('conditions', conditions)
        return conditions;
    }

    public ComparisonFunction(operator: string): any {
        const comparisonOperatorsHash = {
            '<': function(a, b) { return a < b; },
            'greaterthan': function(a, b) { return a < b; },
            'greater than': function(a, b) { return a < b; },
            '>': function(a, b) { return a > b; },
            'lessthan': function(a, b) { return a > b; },
            'less than': function(a, b) { return a > b; },
            '>=': function(a, b) { return a >= b; },
            'lessthanorequal': function(a, b) { return a >= b; },
            'less than or equal': function(a, b) { return a >= b; },
            '<=': function(a, b) { return a <= b; },
            'greaterthanorequal': function(a, b) { return a <= b; },
            'greater than or equal': function(a, b) { return a <= b; },
            '==': function(a, b) { return a == b; },
            'equal': function(a, b) { return a == b; },
            'equals': function(a, b) { return a == b; },
            '===': function(a, b) { return a === b; },
            '!=': function(a, b) { return a != b; },
            '!==': function(a, b) { return a !== b; },
        };

        return comparisonOperatorsHash[operator];

    }

    // This function gets the field values of the payment event
    public get Lookup(): LookupResponse {
        return <LookupResponse>search.lookupFields({
            id: this.recordId,
            type: Stripe_Charge_Trigger_Condition.RECORDID,
            columns: ['custrecord_mhi_stripe_condition_field', 'custrecord_mhi_stripe_condition_operator', 'custrecord_mhi_stripe_condition_value']
        });
    }

}

interface Condition {
    fieldid: string;
    operator: string;
    value: string;
}

interface LookupResponse {
    custrecord_mhi_stripe_condition_field: string;
    custrecord_mhi_stripe_condition_operator: string;
    custrecord_mhi_stripe_condition_value: string;
}
