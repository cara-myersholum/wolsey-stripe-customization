/**
 * @copyright 2022 Myers-Holum Inc.
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 * @NScriptType UserEventScript
 */
define(["require", "exports", "N/url", "N/log", "N/record", "../Utils/Common"], function (require, exports, url, log, record, Common_1) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.afterSubmit = exports.beforeLoad = void 0;
    const beforeLoad = (context) => {
        try {
            switch (context.type) {
                case context.UserEventType.VIEW:
                case context.UserEventType.EDIT:
                case context.UserEventType.XEDIT:
                case context.UserEventType.APPROVE:
                    // If stripe portal URL exist, add a button for customer payment portal
                    const stripePaymentManagementURL = context.newRecord.getValue({ fieldId: 'custentity_mhi_stripe_payment_management' });
                    const subsidiaryId = +context.newRecord.getValue({ fieldId: 'subsidiary' });
                    const params = `a=${context.newRecord.id}&b=${subsidiaryId}`;
                    const externalURL = url.resolveScript({
                        scriptId: 'customscript_mhi_stripe_paymentmethod_su',
                        deploymentId: 'customdeploy_mhi_stripe_paymentmethod_su',
                        params: { p: (0, Common_1.encode)(params) },
                        returnExternalUrl: true
                    });
                    context.form.addButton({
                        id: 'custpage_mhi_stripe_payment_method',
                        label: 'Stripe Payment Method Management',
                        functionName: `window.open("${externalURL}");`
                    });
                    if (!stripePaymentManagementURL) {
                        record.submitFields({ id: context.newRecord.id, type: context.newRecord.type, values: { custentity_mhi_stripe_payment_management: externalURL } });
                    }
                    break;
                case context.UserEventType.CREATE:
                case context.UserEventType.COPY:
                    context.newRecord.setValue({ fieldId: 'custentity_mhi_stripe_payment_management', value: '' });
                    break;
                default:
                    break;
            }
        }
        catch (error) {
            // If an error is encountered, log it
            log.debug('Error on Generate Payment Link UE', error);
        }
    };
    exports.beforeLoad = beforeLoad;
    const afterSubmit = (context) => {
        switch (context.type) {
            // On create,edit,inline edit of a customer
            case context.UserEventType.CREATE:
            case context.UserEventType.EDIT:
            case context.UserEventType.XEDIT:
                try {
                    // Load the customer record
                    const rec = record.load({
                        type: context.newRecord.type,
                        id: context.newRecord.id,
                        isDynamic: true
                    });
                    const stripePaymentManagementURL = rec.getValue({ fieldId: 'custentity_mhi_stripe_payment_management' });
                    const isInactive = rec.getValue({ fieldId: 'isinactive' });
                    // Check stripe portal URL doesnt exist & not inactive
                    if (!isInactive && !stripePaymentManagementURL) {
                        const subsidiaryId = +rec.getValue({ fieldId: 'subsidiary' });
                        const params = `a=${context.newRecord.id}&b=${subsidiaryId}`;
                        const externalURL = url.resolveScript({
                            scriptId: 'customscript_mhi_stripe_paymentmethod_su',
                            deploymentId: 'customdeploy_mhi_stripe_paymentmethod_su',
                            params: { p: (0, Common_1.encode)(params) },
                            returnExternalUrl: true
                        });
                        if (!stripePaymentManagementURL) {
                            // Set the payment portal link
                            rec.setValue({ fieldId: 'custentity_mhi_stripe_payment_management', value: externalURL });
                            // Save the customer record
                            rec.save({ ignoreMandatoryFields: true });
                        }
                    }
                }
                catch (err) {
                    // If an error is encountered, log it
                    log.debug('Error on aftersubmit', err);
                }
                break;
            default:
                break;
        }
    };
    exports.afterSubmit = afterSubmit;
});
