/**
 * @copyright 2022 Myers-Holum Inc.
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @NScriptType UserEventScript
 */

import {EntryPoints} from 'N/types';
import * as log from 'N/log';
import * as serverWidget from 'N/ui/serverWidget';

export const beforeLoad: EntryPoints.UserEvent.beforeLoad = (context: EntryPoints.UserEvent.beforeLoadContext) => {
    try {
        switch (context.type) {
            case context.UserEventType.EDIT:
            case context.UserEventType.VIEW:
                // Add a button for production PK
                const productionPKBtn = context.form.addField({
                    id: SetupConstants.PRODUCTION.PK,
                    type: serverWidget.FieldType.TEXT,
                    label: 'PUBLISHABLE KEY (PRODUCTION)'
                });
                productionPKBtn.defaultValue = SetupConstants.ENCRYPTED;
                context.form.getField({id: SetupConstants.PRODUCTION.PUBLICKEY}).updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});

                // Add a button for production SK
                const productionSKBtn = context.form.addField({
                    id: SetupConstants.PRODUCTION.SK,
                    type: serverWidget.FieldType.TEXT,
                    label: 'STRIPE SECRET KEY (PRODUCTION)'
                });
                productionSKBtn.defaultValue = SetupConstants.ENCRYPTED;
                context.form.getField({id: SetupConstants.PRODUCTION.SECRETKEY}).updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});

                // Add a button for sandbox PK
                const sandboxPKBtn = context.form.addField({
                    id: SetupConstants.SANDBOX.PK,
                    type: serverWidget.FieldType.TEXT,
                    label: 'PUBLISHABLE KEY (SANDBOX)'
                });
                sandboxPKBtn.defaultValue = SetupConstants.ENCRYPTED;
                context.form.getField({id: SetupConstants.SANDBOX.PUBLICKEY}).updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});


                // Add a button for sandbox SK
                const sandboxSKBtn = context.form.addField({
                    id: SetupConstants.SANDBOX.SK,
                    type: serverWidget.FieldType.TEXT,
                    label: 'STRIPE SECRET KEY (SANDBOX)'
                });
                sandboxSKBtn.defaultValue = SetupConstants.ENCRYPTED;
                context.form.getField({id: SetupConstants.SANDBOX.SECRETKEY}).updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
                break;
            default:
                break;
        }

    } catch (error) {
        log.debug('Error on Stripe Setup UE', error);
    }
}

export const beforeSubmit: EntryPoints.UserEvent.beforeSubmit = (context: EntryPoints.UserEvent.beforeSubmitContext) => {
    try {
        switch (context.type) {
            case context.UserEventType.EDIT:
                const productionPK = context.newRecord.getValue({fieldId: SetupConstants.PRODUCTION.PK});
                const productionSK = context.newRecord.getValue({fieldId: SetupConstants.PRODUCTION.SK});
                const sandboxPK = context.newRecord.getValue({fieldId: SetupConstants.SANDBOX.PK});
                const sandboxSK = context.newRecord.getValue({fieldId: SetupConstants.SANDBOX.SK});

                if (productionPK !== SetupConstants.ENCRYPTED) {
                    context.newRecord.setValue({fieldId: SetupConstants.PRODUCTION.PUBLICKEY, value: productionPK});
                }
                if (productionSK !== SetupConstants.ENCRYPTED) {
                    context.newRecord.setValue({fieldId: SetupConstants.PRODUCTION.SECRETKEY, value: productionSK});
                }
                if (sandboxPK !== SetupConstants.ENCRYPTED) {
                    context.newRecord.setValue({fieldId: SetupConstants.SANDBOX.PUBLICKEY, value: sandboxPK});
                }
                if (sandboxSK !== SetupConstants.ENCRYPTED) {
                    context.newRecord.setValue({fieldId: SetupConstants.SANDBOX.SECRETKEY, value: sandboxSK});
                }
                break;
            default:
                break;
        }

    } catch (error) {
        log.debug('Error on Stripe Setup UE', error);
    }
}

export const SetupConstants = {
    PRODUCTION: {
        PUBLICKEY: 'custrecord_mhi_setup_appid',
        SECRETKEY: 'custrecord_mhi_setup_secret',
        SK: 'custpage_production_sk',
        PK: 'custpage_production_pk'
    },
    SANDBOX: {
        PUBLICKEY: 'custrecord_mhi_setup_appid_sb',
        SECRETKEY: 'custrecord_mhi_setup_secret_sb',
        PK: 'custpage_sandbox_pk',
        SK: 'custpage_sandbox_sk',
    },
    ENCRYPTED: '*******'

};
