/**
 * @copyright 2022 Myers-Holum Inc.
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 * @NScriptType UserEventScript
 */
define(["require", "exports", "N/url", "N/log", "N/record", "../Utils/Common", "../StripeAPI/Stripe"], function (require, exports, url, log, record, Common_1, Stripe_1) {
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
                    const stripePortalURL = context.newRecord.getValue({ fieldId: (0, Common_1.getStripePortalField)(context.newRecord.type) });
                    const status = context.newRecord.getValue({ fieldId: 'status' });
                    const subsidiaryId = +context.newRecord.getValue({ fieldId: 'subsidiary' });
                    const validStatus = ['Pending Billing', 'Pending Fulfillment', 'Pending Approval', 'Open', 'Processed'];
                    const stripe = new Stripe_1.Stripe({ subsidiary: subsidiaryId });
                    if (validStatus.indexOf(`${status}`) !== -1) {
                        if (stripePortalURL) {
                            context.form.addButton({
                                id: 'custpage_mhi_stripe_payment_portal',
                                label: 'Stripe Payment Link',
                                functionName: `window.open("${stripePortalURL}");`
                            });
                        }
                        else {
                            // If it does not exist, add a button to generate link
                            const generateLinkURL = url.resolveScript({
                                scriptId: 'customscript_mhi_stripe_generate_link_su',
                                deploymentId: 'customdeploy_mhi_stripe_generate_link_su',
                                params: { id: context.newRecord.id, type: context.newRecord.type }
                            });
                            context.form.addButton({
                                id: 'custpage_mhi_stripe_generate_link',
                                label: 'Generate Stripe Payment Link',
                                functionName: `window.open("${generateLinkURL}","_self");`
                            });
                        }
                    }
                    break;
                case context.UserEventType.CREATE:
                case context.UserEventType.COPY:
                    context.newRecord.setValue({ fieldId: (0, Common_1.getStripePortalField)(context.newRecord.type), value: '' });
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
                    const stripePortalURL = rec.getValue({ fieldId: (0, Common_1.getStripePortalField)(context.newRecord.type) });
                    const isInactive = rec.getValue({ fieldId: 'isinactive' });
                    // Check stripe portal URL doesnt exist & not inactive
                    if (!isInactive && !stripePortalURL) {
                        // Assign id as parameter
                        const params = `a=${context.newRecord.id}&t=${context.newRecord.type}`;
                        // Generate Payment Link
                        const externalURL = url.resolveScript({
                            scriptId: 'customscript_mhi_stripe_payment_portal',
                            deploymentId: 'customdeploy_mhi_stripe_payment_portal',
                            params: { p: (0, Common_1.encode)(params) },
                            returnExternalUrl: true
                        });
                        // Set the payment portal link
                        rec.setValue({ fieldId: (0, Common_1.getStripePortalField)(context.newRecord.type), value: externalURL });
                        // Save the customer record
                        rec.save({ ignoreMandatoryFields: true });
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
