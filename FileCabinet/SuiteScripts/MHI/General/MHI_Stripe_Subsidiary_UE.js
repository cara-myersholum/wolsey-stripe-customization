/**
 * @copyright 2022 Myers-Holum Inc.
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @NScriptType UserEventScript
 */
define(["require", "exports", "N/url", "N/log", "N/ui/serverWidget", "../Record/Stripe_Setup"], function (require, exports, url, log, serverWidget, Stripe_Setup_1) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.beforeLoad = void 0;
    const beforeLoad = (context) => {
        try {
            const setup = new Stripe_Setup_1.Stripe_Setup({ subsidiary: context.newRecord.id });
            let setupURL = url.resolveRecord({ recordType: Stripe_Setup_1.Stripe_Setup.RECORDID, recordId: setup.Id, isEditMode: true, params: { 'record.custrecord_mhi_setup_subsidiary': context.newRecord.id } });
            // Add a tab
            context.form.addTab({
                id: 'custpage_stripe',
                label: 'Stripe'
            });
            // Add a button on the tab
            const stripeSetupBtn = context.form.addField({ id: 'custpage_stripe_btn', type: serverWidget.FieldType.INLINEHTML, label: ' ', container: 'custpage_stripe' });
            stripeSetupBtn.defaultValue = `<button onclick="location.href='${setupURL}'" type="button">Configure Stripe Secret API Keys</button>`;
            // Add a button on the form
            context.form.addButton({
                id: 'custpage_mhi_stripe_setup',
                label: 'Configure Stripe Secret API Keys',
                functionName: `window.open("${setupURL}","_self");`
            });
        }
        catch (error) {
            log.debug('Error on Stripe Subsidiary UE', error);
        }
    };
    exports.beforeLoad = beforeLoad;
});
