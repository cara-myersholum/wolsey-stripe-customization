/**
 * @copyright 2022 Myers-Holum Inc.
 * @author
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

import * as error from 'N/error';
import * as search from 'N/search';
import {CustomRecord, TextValue} from './CustomRecord';
import {isProduction} from "../Utils/Common";

// This is the class used to load the Stripe Setup Custom Record

export class Stripe_Setup extends CustomRecord {
    // Declare the record id
    public static readonly RECORDID = 'customrecord_mhi_stripe_setup';

    constructor(options?: StripeConstructorOptions) {
        super(Stripe_Setup.RECORDID);
        // If no subsidiary is passed, just search for the first one we get using search
        if (!options) {
            search.create({
                type: Stripe_Setup.RECORDID,
                filters: ['isinactive', 'is', 'F']
            }).run().each(result => {
                this.recordId = +result.id;
                return true;
            });
        } else if (options.id) {
            // If subsidiary is passed, use the setup mapped to that subsidiary
            search.create({
                type: Stripe_Setup.RECORDID,
                filters: [['isinactive', 'is', 'F'], 'AND' , ['internalid', 'anyof', options.id]]
            }).run().each(result => {
                this.recordId = +result.id;
                return true;
            });
        }else if (options.subsidiary) {
        // If subsidiary is passed, use the setup mapped to that subsidiary
            search.create({
                type: Stripe_Setup.RECORDID,
                filters: [['isinactive', 'is', 'F'], 'AND' , ['custrecord_mhi_setup_subsidiary', 'anyof', options.subsidiary]]
            }).run().each(result => {
                this.recordId = +result.id;
                return true;
            });
        }

        if (+this.recordId > 0) {
            // Check if record id was got
        } 
    }
    // Get the Application ID
    get appid(): string {
        return isProduction() ?  (<LookupResponse>this.RecordValues)?.custrecord_mhi_setup_appid :  (<LookupResponse>this.RecordValues)?.custrecord_mhi_setup_appid_sb;
    }
    // Get the Secret ID
    get secret(): string {
        return isProduction() ? (<LookupResponse>this.RecordValues)?.custrecord_mhi_setup_secret : (<LookupResponse>this.RecordValues)?.custrecord_mhi_setup_secret_sb;
    }

    // Get the Secret ID
    get subsidiary(): number {
        return +(<LookupResponse>this.RecordValues)?.custrecord_mhi_setup_subsidiary[0].value;
    }

    // Get the Webhook ID
    get webhook(): string {
        return (<LookupResponse>this.RecordValues)?.custrecord_mhi_setup_webhook;
    }

    set webhookId(id: string) {
        this.setFieldValue({custrecord_mhi_setup_webhook: id});
    }

    // Get the Field IDs
    get Lookup(): LookupResponse {
        return <LookupResponse>search.lookupFields({
            id: this.recordId,
            type: Stripe_Setup.RECORDID,
            columns: ['custrecord_mhi_setup_subsidiary',
                'custrecord_mhi_setup_acctid',
                'custrecord_mhi_setup_secret',
                'custrecord_mhi_setup_appid',
                'custrecord_mhi_setup_appid_sb',
                'custrecord_mhi_setup_secret_sb',
                'custrecord_mhi_setup_webhook'
            ]
        });
    }

    public static getAllSetupIds(): number[] {
        let setupIds: number[] = [];
        try {
            search.create({
                type: Stripe_Setup.RECORDID,
            }).run().each(result => {
                setupIds.push(+result.id);
                return true;
            });
        } catch (err) {

        }
        return setupIds;
    }
}

// instantiate the inteface -- call the class by using either the configuration id or context
export interface StripeConstructorOptions {
    subsidiary?: number;
    id?: number;
}

interface LookupResponse {
    custrecord_mhi_setup_subsidiary: TextValue[];
    custrecord_mhi_setup_acctid: string;
    custrecord_mhi_setup_secret: string;
    custrecord_mhi_setup_appid: string;
    custrecord_mhi_setup_appid_sb: string;
    custrecord_mhi_setup_secret_sb: string;
    custrecord_mhi_setup_webhook: string;
}
