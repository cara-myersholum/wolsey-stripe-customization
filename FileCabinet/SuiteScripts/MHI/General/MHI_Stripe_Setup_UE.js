/**
 * @copyright 2022 Myers-Holum Inc.
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @NScriptType UserEventScript
 */
define(["require", "exports", "N/log", "N/ui/serverWidget"], function (require, exports, log, serverWidget) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SetupConstants = exports.beforeSubmit = exports.beforeLoad = void 0;
    const beforeLoad = (context) => {
        try {
            switch (context.type) {
                case context.UserEventType.EDIT:
                case context.UserEventType.VIEW:
                    // Add a button for production PK
                    const productionPKBtn = context.form.addField({
                        id: exports.SetupConstants.PRODUCTION.PK,
                        type: serverWidget.FieldType.TEXT,
                        label: 'PUBLISHABLE KEY (PRODUCTION)'
                    });
                    productionPKBtn.defaultValue = exports.SetupConstants.ENCRYPTED;
                    context.form.getField({ id: exports.SetupConstants.PRODUCTION.PUBLICKEY }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                    // Add a button for production SK
                    const productionSKBtn = context.form.addField({
                        id: exports.SetupConstants.PRODUCTION.SK,
                        type: serverWidget.FieldType.TEXT,
                        label: 'STRIPE SECRET KEY (PRODUCTION)'
                    });
                    productionSKBtn.defaultValue = exports.SetupConstants.ENCRYPTED;
                    context.form.getField({ id: exports.SetupConstants.PRODUCTION.SECRETKEY }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                    // Add a button for sandbox PK
                    const sandboxPKBtn = context.form.addField({
                        id: exports.SetupConstants.SANDBOX.PK,
                        type: serverWidget.FieldType.TEXT,
                        label: 'PUBLISHABLE KEY (SANDBOX)'
                    });
                    sandboxPKBtn.defaultValue = exports.SetupConstants.ENCRYPTED;
                    context.form.getField({ id: exports.SetupConstants.SANDBOX.PUBLICKEY }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                    // Add a button for sandbox SK
                    const sandboxSKBtn = context.form.addField({
                        id: exports.SetupConstants.SANDBOX.SK,
                        type: serverWidget.FieldType.TEXT,
                        label: 'STRIPE SECRET KEY (SANDBOX)'
                    });
                    sandboxSKBtn.defaultValue = exports.SetupConstants.ENCRYPTED;
                    context.form.getField({ id: exports.SetupConstants.SANDBOX.SECRETKEY }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                    break;
                default:
                    break;
            }
        }
        catch (error) {
            log.debug('Error on Stripe Setup UE', error);
        }
    };
    exports.beforeLoad = beforeLoad;
    const beforeSubmit = (context) => {
        try {
            switch (context.type) {
                case context.UserEventType.EDIT:
                    const productionPK = context.newRecord.getValue({ fieldId: exports.SetupConstants.PRODUCTION.PK });
                    const productionSK = context.newRecord.getValue({ fieldId: exports.SetupConstants.PRODUCTION.SK });
                    const sandboxPK = context.newRecord.getValue({ fieldId: exports.SetupConstants.SANDBOX.PK });
                    const sandboxSK = context.newRecord.getValue({ fieldId: exports.SetupConstants.SANDBOX.SK });
                    if (productionPK !== exports.SetupConstants.ENCRYPTED) {
                        context.newRecord.setValue({ fieldId: exports.SetupConstants.PRODUCTION.PUBLICKEY, value: productionPK });
                    }
                    if (productionSK !== exports.SetupConstants.ENCRYPTED) {
                        context.newRecord.setValue({ fieldId: exports.SetupConstants.PRODUCTION.SECRETKEY, value: productionSK });
                    }
                    if (sandboxPK !== exports.SetupConstants.ENCRYPTED) {
                        context.newRecord.setValue({ fieldId: exports.SetupConstants.SANDBOX.PUBLICKEY, value: sandboxPK });
                    }
                    if (sandboxSK !== exports.SetupConstants.ENCRYPTED) {
                        context.newRecord.setValue({ fieldId: exports.SetupConstants.SANDBOX.SECRETKEY, value: sandboxSK });
                    }
                    break;
                default:
                    break;
            }
        }
        catch (error) {
            log.debug('Error on Stripe Setup UE', error);
        }
    };
    exports.beforeSubmit = beforeSubmit;
    exports.SetupConstants = {
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
});
