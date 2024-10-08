/**
 * @copyright 2022 Myers-Holum Inc.
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 */
define(["require", "exports", "N/ui/serverWidget", "N/log", "N/format/i18n", "N/record", "../Constants/InvoiceSummaryFormConstants", "./Tab/TransactionListTab", "../../Utils/Common", "../NetSuite/InvoiceSummary", "./Tab/TransactionSummaryTab", "../NetSuite/InvoiceList", "../../StripeAPI/Stripe", "../Stripe/Customer", "../../Record/Stripe_Bundles_Configuration", "../Record/Stripe_Pending_Payment", "../Stripe/Charge"], function (require, exports, serverWidget, log, format, record, InvoiceSummaryFormConstants_1, TransactionListTab_1, Common_1, InvoiceSummary_1, TransactionSummaryTab_1, InvoiceList_1, Stripe_1, Customer_1, Stripe_Bundles_Configuration_1, Stripe_Pending_Payment_1, Charge_1) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TransactionListForm = void 0;
    class TransactionListForm {
        constructor(context) {
            this.context = context;
            this.formName = 'Stripe Payment Link';
            this.pageSize = 10;
            this.pageListSize = 4000;
            this.stripeBundleConfiguration = new Stripe_Bundles_Configuration_1.Stripe_Bundles_Configuration();
            if (this.stripeBundleConfiguration.PAYMENTLINK_FORM_LABEL) {
                this.formName = this.stripeBundleConfiguration.PAYMENTLINK_FORM_LABEL;
            }
            this.form = serverWidget.createForm({
                title: this.formName
            });
            // region Transaction Group
            const fieldGroup = this.form.addFieldGroup({
                id: InvoiceSummaryFormConstants_1.InvoiceSummaryFormConstants.FIELD_GROUP.FILTERS,
                label: ' '
            });
            fieldGroup.isSingleColumn = true;
            this.entityNameField = this.form.addField({
                id: InvoiceSummaryFormConstants_1.InvoiceSummaryFormConstants.FIELDID.ENTITY,
                type: serverWidget.FieldType.TEXT,
                label: ' ',
                container: InvoiceSummaryFormConstants_1.InvoiceSummaryFormConstants.FIELD_GROUP.FILTERS
            });
            this.entityNameField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
            this.entityIdField = this.form.addField({
                id: InvoiceSummaryFormConstants_1.InvoiceSummaryFormConstants.FIELDID.ENTITYID,
                type: serverWidget.FieldType.INTEGER,
                label: 'EntityId',
                container: InvoiceSummaryFormConstants_1.InvoiceSummaryFormConstants.FIELD_GROUP.FILTERS
            });
            this.entityIdField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
            this.subtotalField = this.form.addField({
                id: InvoiceSummaryFormConstants_1.InvoiceSummaryFormConstants.FIELDID.SUBTOTAL,
                type: serverWidget.FieldType.TEXT,
                label: ' ',
                container: InvoiceSummaryFormConstants_1.InvoiceSummaryFormConstants.FIELD_GROUP.FILTERS
            });
            this.subtotalField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
            this.summaryField = this.form.addField({
                id: InvoiceSummaryFormConstants_1.InvoiceSummaryFormConstants.FIELDID.SUMMARY,
                type: serverWidget.FieldType.TEXT,
                label: 'SUMMARY',
                container: InvoiceSummaryFormConstants_1.InvoiceSummaryFormConstants.FIELD_GROUP.FILTERS
            });
            this.summaryField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
            this.currencyField = this.form.addField({
                id: InvoiceSummaryFormConstants_1.InvoiceSummaryFormConstants.FIELDID.CURRENCY,
                type: serverWidget.FieldType.TEXT,
                label: 'Currency',
                container: InvoiceSummaryFormConstants_1.InvoiceSummaryFormConstants.FIELD_GROUP.FILTERS
            });
            this.currencyField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
            this.cssField = this.form.addField({
                id: InvoiceSummaryFormConstants_1.InvoiceSummaryFormConstants.FIELDID.CSS,
                type: serverWidget.FieldType.INLINEHTML,
                label: ' '
            });
            this.cssField.defaultValue = `<script>jQuery("head").append("<meta http-equiv='Cache-Control' content='no-cache, no-store, must-revalidate'/><meta http-equiv='Pragma' content='no-cache' /><meta http-equiv='Expires' content='0' />");jQuery("<link/>", {rel: "stylesheet",type: "text/css",href: "${this.stripeBundleConfiguration.PAYMENTLINK_STYLES_CSS}"}).appendTo("head");jQuery('#main_form').attr('action', '#');</script>`;
            this.InvoiceList = context;
        }
        get FORM() {
            let form = this.form;
            // if payment_intent is present, return success page
            if (this.context.request.parameters.payment_intent) {
                log.debug('this.context.request.parameters', this.context.request.parameters);
                try {
                    const decrypted = (0, Common_1.decode)(this.context.request.parameters.p);
                    const parsed = (0, Common_1.parseQueryString)(decrypted);
                    const recordDetails = (0, Common_1.getTransactionDetails)({ transactionId: +parsed.a });
                    const stripe = new Stripe_1.Stripe({ subsidiary: +recordDetails.subsidiary.value });
                    const paymentResponse = stripe.API.createApiRequest({ id: this.context.request.parameters.payment_intent }, 'get', 'v1/payment_intents');
                    let netsuiteAmt = paymentResponse.amount / 100;
                    const currencyId = +recordDetails.currency.value;
                    if ((0, Common_1.getCurrencyCode)(currencyId) !== 'JPY') {
                        netsuiteAmt = paymentResponse.amount / 100;
                    }
                    new Stripe_Pending_Payment_1.Stripe_Pending_Payment({ values: { PaymentIntent: paymentResponse.id, StatusId: Stripe_Pending_Payment_1.Stripe_Pending_Payment_Status.PENDINGPAYMENT, TransactionId: +parsed.a, Amount: netsuiteAmt, CurrencyId: currencyId, Type: this.context.request.parameters.type } });
                    if (paymentResponse === null || paymentResponse === void 0 ? void 0 : paymentResponse.latest_charge) {
                        (0, Charge_1.updateChargeMetadata)({
                            recordId: recordDetails.internalid,
                            recordType: recordDetails.recordtype,
                            stripe: stripe,
                            stripeChargeId: paymentResponse.latest_charge,
                            stripePaymentIntentId: paymentResponse.id,
                            Found(charge) {
                            }, NotFound(response) {
                            }
                        });
                        try {
                            // Set the charge id and stripe payment intent id
                            record.submitFields({
                                type: recordDetails.recordtype,
                                id: recordDetails.internalid,
                                values: {
                                    custbody_stripe_chargeid: `${paymentResponse.latest_charge}`,
                                    custbody_stripe_payment_intentid: `${paymentResponse.id}`
                                },
                                options: { ignoreMandatoryFields: true }
                            });
                        }
                        catch (er) {
                            log.error('Error saving invoice', er);
                        }
                    }
                    // If it is a new card, set default
                    if (paymentResponse.payment_method && paymentResponse.customer) {
                        // set default
                        const updateResponse = stripe.API.createApiRequest({
                            id: paymentResponse.customer,
                            invoice_settings: { default_payment_method: paymentResponse.payment_method }
                        }, 'update', 'v1/customers');
                        log.debug('updateResponse', updateResponse);
                    }
                }
                catch (err) {
                    log.error('err', err);
                }
                (0, Common_1.getFileContent)({
                    fileName: `stripe_payment_portal_success.html`,
                    Found: fileContent => {
                        form = fileContent.replace('${CSS}', this.stripeBundleConfiguration.PAYMENTLINK_STYLES_CSS);
                    },
                    NotFound: () => {
                        // Nothing to do here.
                    }
                });
            }
            return form;
        }
        set InvoiceList(context) {
            try {
                const parameters = this.context.request.parameters.p;
                const decrypted = (0, Common_1.decode)(parameters);
                const parsed = (0, Common_1.parseQueryString)(decrypted);
                let pageId = +this.context.request.parameters.page;
                log.debug('parsed', parsed);
                if (!pageId || pageId < 0) {
                    pageId = 0;
                }
                const recordId = +parsed.a; // internalid of the record
                const recordType = parsed.t; // type of the record
                let netsuiteCustomerId = +parsed.a;
                let skipSummaryPage = false;
                if (recordId > 0) { // If we have recordId
                    let recordDetails = null;
                    switch (recordType) {
                        case 'customer':
                        case 'partner': // If it is a customer or partner, get the entity details
                            recordDetails = (0, Common_1.getEntityDetails)({ entityId: recordId });
                            if (parsed.b) {
                                skipSummaryPage = true;
                            }
                            break;
                        default: // If it is a transaction, get the transaction details
                            recordDetails = (0, Common_1.getTransactionDetails)({ transactionId: recordId });
                            netsuiteCustomerId = recordDetails.entity.value;
                            skipSummaryPage = true;
                            break;
                    }
                    log.debug('recordDetails', recordDetails);
                    this.entityNameField.defaultValue = `${recordDetails.entity.text}`;
                    this.entityIdField.defaultValue = `${recordDetails.entity.value}`;
                    let currencyId = +recordDetails.currency.value;
                    let currency = (0, Common_1.getCurrencyCode)(currencyId); // 3 letter ISO code
                    let subsidiaryId = +recordDetails.subsidiary.value; // internalid of the subsidiary
                    if (currencyId > 0) {
                        this.currencyField.defaultValue = currency;
                    }
                    const stripe = new Stripe_1.Stripe({ subsidiary: parsed.b ? parsed.b : subsidiaryId });
                    (0, Customer_1.upsertCustomer)({
                        netsuiteId: netsuiteCustomerId,
                        netsuiteStripeId: recordDetails.netsuiteStripeId,
                        stripe: stripe,
                        Found: stripeId => {
                            if (!skipSummaryPage) {
                                (0, InvoiceSummary_1.getInvoiceSummary)({
                                    recordId: recordId,
                                    recordType: recordType,
                                    pageIndex: pageId,
                                    searchPageSize: this.pageSize,
                                    FoundOne: invoiceSummary => {
                                        // Go straight to list
                                        subsidiaryId = invoiceSummary.subsidiaryid;
                                        currencyId = invoiceSummary.currencyid;
                                        currency = (0, Common_1.getCurrencyCode)(invoiceSummary.currencyid);
                                        const summary = (0, Common_1.encode)(`${decrypted}&b=${invoiceSummary.subsidiaryid}&c=${invoiceSummary.currencyid}&e=${invoiceSummary.customerid}&g=T`);
                                        this.summaryField.defaultValue = `${summary}`;
                                        this.currencyField.defaultValue = currency;
                                    },
                                    Found: invoiceSummaries => {
                                        const pageCount = Math.ceil(invoiceSummaries.length / this.pageSize);
                                        const invoiceSummaryTab = new TransactionSummaryTab_1.TransactionSummaryTab(this.context, this.form, pageCount, pageId);
                                        invoiceSummaryTab.InvoiceSummarySublist.Invoices = invoiceSummaries;
                                    },
                                    NotFound: () => {
                                        const invoiceSummaryTab = new TransactionSummaryTab_1.TransactionSummaryTab(this.context, this.form, -1, -1);
                                    }
                                });
                            }
                            if (subsidiaryId) {
                                (0, InvoiceList_1.getInvoiceList)({
                                    recordId: recordId,
                                    recordType: recordType,
                                    subsidiaryId: subsidiaryId,
                                    currencyId: currencyId,
                                    pageIndex: pageId,
                                    searchPageSize: this.pageListSize,
                                    Found: invoiceLists => {
                                        const pageCount = Math.ceil(invoiceLists.length / this.pageListSize);
                                        const invoiceListTab = new TransactionListTab_1.TransactionListTab(this.context, this.form, stripe);
                                        invoiceListTab.TransactionListSublist.Invoices = invoiceLists;
                                        const invoice = invoiceLists.pop();
                                        if (invoice.amountremaining > 0) {
                                            this.subtotalField.defaultValue = `Total: ${format.getCurrencyFormatter({ currency: currency }).format({ number: invoice.amountremaining })} ${currency}`;
                                        }
                                        else {
                                            this.subtotalField.defaultValue = `This transaction has been paid.`;
                                        }
                                    },
                                    NotFound: () => {
                                        // Nothing to do here.
                                        this.subtotalField.defaultValue = `This transaction has been paid.`;
                                    }
                                });
                            }
                            else {
                                this.subtotalField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                            }
                        },
                        NotFound: () => {
                            this.returnInvalidLink(true);
                            return;
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
            let message = `Invalid Link. Please contact support at ${this.stripeBundleConfiguration.PAYMENTLINK_SUPPORTEMAIL}.`;
            if (notFoundInStripe) {
                message = `No customer found. Please contact support at ${this.stripeBundleConfiguration.PAYMENTLINK_SUPPORTEMAIL}.`;
            }
            // @ts-ignore
            this.form = `${message}`;
            this.entityNameField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
            this.subtotalField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
            this.cssField.defaultValue = message;
        }
    }
    exports.TransactionListForm = TransactionListForm;
});
