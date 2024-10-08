/**
 * @copyright 2022 Myers-Holum Inc.
 * @author

 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 */
define(["require", "exports", "N/ui/serverWidget", "N/log", "N/url", "../../Utils/Common", "../../StripeAPI/Stripe", "../Stripe/Customer", "../../Record/Stripe_Bundles_Configuration", "./Tab/PaymentMethodTab", "../Constants/PaymentManagementFormConstants", "../Stripe/Setup_Intent"], function (require, exports, serverWidget, log, url, Common_1, Stripe_1, Customer_1, Stripe_Bundles_Configuration_1, PaymentMethodTab_1, PaymentManagementFormConstants_1, Setup_Intent_1) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PaymentManagementForm = void 0;
    class PaymentManagementForm {
        constructor(context) {
            this.context = context;
            this.formName = 'Payment Method Management';
            this.stripeBundleConfiguration = new Stripe_Bundles_Configuration_1.Stripe_Bundles_Configuration();
            this.form = serverWidget.createForm({
                title: this.formName
            });
            this.form.clientScriptModulePath = './PaymentManagementForm_CS';
            // region Transaction Group
            const fieldGroup = this.form.addFieldGroup({
                id: PaymentManagementFormConstants_1.PaymentManagementFormConstants.FIELD_GROUP.FILTERS,
                label: ' '
            });
            fieldGroup.isSingleColumn = true;
            this.entityNameField = this.form.addField({
                id: PaymentManagementFormConstants_1.PaymentManagementFormConstants.FIELDID.ENTITY,
                type: serverWidget.FieldType.TEXT,
                label: ' ',
                container: PaymentManagementFormConstants_1.PaymentManagementFormConstants.FIELD_GROUP.FILTERS
            });
            this.entityNameField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
            this.entityIdField = this.form.addField({
                id: PaymentManagementFormConstants_1.PaymentManagementFormConstants.FIELDID.ENTITYID,
                type: serverWidget.FieldType.INTEGER,
                label: 'EntityId',
                container: PaymentManagementFormConstants_1.PaymentManagementFormConstants.FIELD_GROUP.FILTERS
            });
            this.entityIdField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
            this.subsidiaryField = this.form.addField({
                id: PaymentManagementFormConstants_1.PaymentManagementFormConstants.FIELDID.SUBSIDIARYID,
                type: serverWidget.FieldType.INTEGER,
                label: 'SubsidiaryId',
                container: PaymentManagementFormConstants_1.PaymentManagementFormConstants.FIELD_GROUP.FILTERS
            });
            this.subsidiaryField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
            this.cssField = this.form.addField({
                id: PaymentManagementFormConstants_1.PaymentManagementFormConstants.FIELDID.CSS,
                type: serverWidget.FieldType.INLINEHTML,
                label: ' '
            });
            this.cssField.defaultValue = `<script>jQuery("head").append("<meta http-equiv='Cache-Control' content='no-cache, no-store, must-revalidate'/><meta http-equiv='Pragma' content='no-cache' /><meta http-equiv='Expires' content='0' />");jQuery("<link/>", {rel: "stylesheet",type: "text/css",href: "${this.stripeBundleConfiguration.PAYMENTLINK_STYLES_CSS}");jQuery('#main_form').attr('action', '#');</script>`;
            this.paymentMethodField = this.form.addField({
                id: PaymentManagementFormConstants_1.PaymentManagementFormConstants.FIELDID.PAYMENTMETHODS,
                type: serverWidget.FieldType.INLINEHTML,
                label: ' ',
                container: PaymentManagementFormConstants_1.PaymentManagementFormConstants.FIELD_GROUP.FILTERS
            });
            this.InvoiceList = context;
        }
        get FORM() {
            let form = this.form;
            return form;
        }
        set InvoiceList(context) {
            try {
                const parameters = this.context.request.parameters.p;
                let pageId = +this.context.request.parameters.page;
                if (!pageId || pageId < 0) {
                    pageId = 0;
                }
                const decrypted = (0, Common_1.decode)(parameters);
                const parsed = (0, Common_1.parseQueryString)(decrypted);
                log.debug('parsed', parsed);
                const entityId = +parsed.a; // internalid of the customer
                let subsidiaryId = +parsed.b; // internalid of the subsidiary
                let currencyId = +parsed.c; // the netsuite currency ID
                let currencyCode = (0, Common_1.getCurrencyCode)(currencyId); // 3 letter ISO code
                let netsuiteStripeId = '';
                let firstPM = true;
                if (entityId > 0) { // If we have entityId
                    const entityDetails = (0, Common_1.getInstallmentEntityDetails)({ entityId: +parsed.a });
                    this.entityNameField.defaultValue = `${entityDetails.name}`;
                    this.entityIdField.defaultValue = `${entityDetails.internalid}`;
                    this.subsidiaryField.defaultValue = `${!parsed.b ? entityDetails.subsidiary : subsidiaryId}`;
                    const stripe = new Stripe_1.Stripe({ subsidiary: subsidiaryId });
                    (0, Customer_1.getPaymentMethods)({
                        netsuiteId: +entityDetails.internalid,
                        netsuiteStripeId: netsuiteStripeId,
                        stripe: stripe,
                        Found: paymentMethods => {
                            log.debug('payment methods', paymentMethods);
                            const paymentMethodTab = new PaymentMethodTab_1.PaymentMethodTab(this.context, this.form);
                            paymentMethodTab.PaymentMethodSublist.PaymentMethods = paymentMethods;
                            firstPM = false;
                        },
                        NotFound: () => {
                            const paymentMethodTab = new PaymentMethodTab_1.PaymentMethodTab(this.context, this.form);
                            paymentMethodTab.PaymentMethodSublist.PaymentMethods = [];
                        }
                    });
                    // Create a Setup Intent
                    let paymentIntentId = '';
                    (0, Customer_1.upsertCustomer)({
                        netsuiteId: entityId,
                        netsuiteStripeId: netsuiteStripeId,
                        stripe: stripe,
                        Found: stripeId => {
                            netsuiteStripeId = stripeId;
                            log.audit('entityDetails.allowablePM', entityDetails.allowablePM); // @SOW5
                            let paymentMethodTypes = ['acss_debit'];
                            switch (entityDetails.allowablePM) {
                                case 2: // ALL
                                    paymentMethodTypes.push('card');
                                    break;
                                default:
                                    break;
                            }
                            (0, Setup_Intent_1.createSetupIntent)({
                                paymentMethods: paymentMethodTypes,
                                stripe: stripe,
                                stripeCustomerId: stripeId,
                                Failed() {
                                },
                                Success(setup_intent) {
                                    paymentIntentId = setup_intent.client_secret;
                                }
                            });
                        },
                        NotFound: () => {
                            // Nothing to do here.
                        }
                    });
                    (0, Common_1.getFileContent)({
                        fileName: `stripe_payment_method_management.html`,
                        Found: (fileContent) => {
                            fileContent = fileContent.replace('${CSS}', this.stripeBundleConfiguration.PAYMENTMETHODMANAGEMENT_PORTAL_CSS);
                            // Replace the clientSecret and pubKey
                            fileContent = fileContent.replace('${clientSecret}', paymentIntentId);
                            fileContent = fileContent.replace('${publishableKey}', stripe.SETUP.appid);
                            log.debug('paymentIntentId', paymentIntentId);
                            log.debug('publishableKey', stripe.SETUP.appid);
                            // Create the return URL
                            const link = url.resolveScript({
                                scriptId: 'customscript_mhi_stripe_paymentmethod_su',
                                deploymentId: 'customdeploy_mhi_stripe_paymentmethod_su',
                                returnExternalUrl: true,
                                params: { firstPM: firstPM, sub: subsidiaryId, cs: netsuiteStripeId }
                            });
                            // Replace the return URL
                            fileContent = fileContent.replace('${returnUrl}', `${link}&p=${parameters}`);
                            this.paymentMethodField.defaultValue = fileContent;
                        },
                        NotFound: () => {
                            // Nothing to do here.
                        }
                    });
                }
                else {
                    this.returnInvalidLink();
                }
            }
            catch (err) {
                log.debug('err', err);
                this.returnInvalidLink();
            }
        }
        returnInvalidLink(notFoundInStripe) {
            let message = `Invalid Link. Please contact support at ${this.stripeBundleConfiguration.PAYMENTMETHODMANAGEMENT_SUPPORTEMAIL}`;
            if (notFoundInStripe) {
                message = `No customer found in Stripe. Please contact support at ${this.stripeBundleConfiguration.PAYMENTMETHODMANAGEMENT_SUPPORTEMAIL}.`;
            }
            // @ts-ignore
            this.form = `${message}`;
            this.entityNameField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
            this.cssField.defaultValue = message;
        }
    }
    exports.PaymentManagementForm = PaymentManagementForm;
});
