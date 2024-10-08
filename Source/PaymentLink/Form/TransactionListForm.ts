/**
 * @copyright 2022 Myers-Holum Inc.
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 */

import {EntryPoints} from 'N/types';
import * as serverWidget from 'N/ui/serverWidget';
import * as log from 'N/log';
import * as format from 'N/format/i18n';
import * as record from 'N/record';
import {InvoiceSummaryFormConstants} from '../Constants/InvoiceSummaryFormConstants';
import {TransactionListTab} from './Tab/TransactionListTab';
import {decode, encode, getCurrencyCode, getEntityDetails, getFileContent, getTransactionDetails, parseQueryString} from '../../Utils/Common';
import {getInvoiceSummary} from '../NetSuite/InvoiceSummary';
import {TransactionSummaryTab} from './Tab/TransactionSummaryTab';
import {getInvoiceList} from '../NetSuite/InvoiceList';
import {Stripe} from '../../StripeAPI/Stripe';
import {upsertCustomer} from '../Stripe/Customer';
import {Stripe_Bundles_Configuration} from '../../Record/Stripe_Bundles_Configuration';
import {Stripe_Pending_Payment, Stripe_Pending_Payment_Status} from '../Record/Stripe_Pending_Payment';
import {updateChargeMetadata} from '../Stripe/Charge';
export class TransactionListForm {
    private form: serverWidget.Form;
    private readonly stripeBundleConfiguration: Stripe_Bundles_Configuration;
    private formName = 'Stripe Payment Link';
    private readonly entityNameField: serverWidget.Field;
    private readonly entityIdField: serverWidget.Field;
    private readonly subtotalField: serverWidget.Field;
    private readonly summaryField: serverWidget.Field;
    private readonly cssField: serverWidget.Field;
    private readonly currencyField: serverWidget.Field;
    private readonly pageSize = 10;
    private readonly pageListSize = 4000;

    constructor(private readonly context: EntryPoints.Suitelet.onRequestContext) {
        this.stripeBundleConfiguration = new Stripe_Bundles_Configuration();
        if (this.stripeBundleConfiguration.PAYMENTLINK_FORM_LABEL) {
            this.formName = this.stripeBundleConfiguration.PAYMENTLINK_FORM_LABEL;
        }

        this.form = serverWidget.createForm({
            title: this.formName
        });

        // region Transaction Group
        const fieldGroup = this.form.addFieldGroup({
            id: InvoiceSummaryFormConstants.FIELD_GROUP.FILTERS,
            label: ' '
        });

        fieldGroup.isSingleColumn = true;

        this.entityNameField = this.form.addField({
            id: InvoiceSummaryFormConstants.FIELDID.ENTITY,
            type: serverWidget.FieldType.TEXT,
            label: ' ',
            container: InvoiceSummaryFormConstants.FIELD_GROUP.FILTERS
        });

        this.entityNameField.updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});

        this.entityIdField = this.form.addField({
            id: InvoiceSummaryFormConstants.FIELDID.ENTITYID,
            type: serverWidget.FieldType.INTEGER,
            label: 'EntityId',
            container: InvoiceSummaryFormConstants.FIELD_GROUP.FILTERS
        });

        this.entityIdField.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});

        this.subtotalField = this.form.addField({
            id: InvoiceSummaryFormConstants.FIELDID.SUBTOTAL,
            type: serverWidget.FieldType.TEXT,
            label: ' ',
            container: InvoiceSummaryFormConstants.FIELD_GROUP.FILTERS
        });

        this.subtotalField.updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});

        this.summaryField = this.form.addField({
            id: InvoiceSummaryFormConstants.FIELDID.SUMMARY,
            type: serverWidget.FieldType.TEXT,
            label: 'SUMMARY',
            container: InvoiceSummaryFormConstants.FIELD_GROUP.FILTERS
        });

        this.summaryField.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});

        this.currencyField = this.form.addField({
            id: InvoiceSummaryFormConstants.FIELDID.CURRENCY,
            type: serverWidget.FieldType.TEXT,
            label: 'Currency',
            container: InvoiceSummaryFormConstants.FIELD_GROUP.FILTERS
        });

        this.currencyField.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});

        this.cssField = this.form.addField({
            id: InvoiceSummaryFormConstants.FIELDID.CSS,
            type: serverWidget.FieldType.INLINEHTML,
            label: ' '
        });

        this.cssField.defaultValue = `<script>jQuery("head").append("<meta http-equiv='Cache-Control' content='no-cache, no-store, must-revalidate'/><meta http-equiv='Pragma' content='no-cache' /><meta http-equiv='Expires' content='0' />");jQuery("<link/>", {rel: "stylesheet",type: "text/css",href: "${this.stripeBundleConfiguration.PAYMENTLINK_STYLES_CSS}"}).appendTo("head");jQuery('#main_form').attr('action', '#');</script>`;

        this.InvoiceList = context;
    }

    get FORM() {
        let form: string | serverWidget.Form = this.form;

        // if payment_intent is present, return success page
        if (this.context.request.parameters.payment_intent) {
            log.debug('this.context.request.parameters', this.context.request.parameters);
            try {

                const decrypted = decode(this.context.request.parameters.p);
                const parsed = parseQueryString(decrypted);
                const recordDetails = getTransactionDetails({transactionId: +parsed.a});

                const stripe = new Stripe({subsidiary: +recordDetails.subsidiary.value});
                const paymentResponse = stripe.API.createApiRequest({id: this.context.request.parameters.payment_intent}, 'get', 'v1/payment_intents');

                let netsuiteAmt = paymentResponse.amount / 100;
                const currencyId = +recordDetails.currency.value;
                if (getCurrencyCode(currencyId) !== 'JPY') {
                    netsuiteAmt = paymentResponse.amount / 100;
                }

                new Stripe_Pending_Payment({values: {PaymentIntent: paymentResponse.id, StatusId: Stripe_Pending_Payment_Status.PENDINGPAYMENT, TransactionId: +parsed.a, Amount: netsuiteAmt, CurrencyId: currencyId, Type: this.context.request.parameters.type}});

                if (paymentResponse?.latest_charge) {

                    updateChargeMetadata({
                        recordId: recordDetails.internalid,
                        recordType: recordDetails.recordtype,
                        stripe: stripe,
                        stripeChargeId: paymentResponse.latest_charge,
                        stripePaymentIntentId: paymentResponse.id,
                        Found(charge: any): void {
                        }, NotFound(response: any): void {

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
                        invoice_settings: {default_payment_method: paymentResponse.payment_method}
                    }, 'update', 'v1/customers');
                    log.debug('updateResponse', updateResponse);
                }

            } catch (err) {
                log.error('err', err);
            }

            getFileContent({
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

    set InvoiceList(context: any) {
        try {

            const parameters = this.context.request.parameters.p;
            const decrypted = decode(parameters);
            const parsed = parseQueryString(decrypted);
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
                    case 'customer': case 'partner': // If it is a customer or partner, get the entity details
                        recordDetails = getEntityDetails({entityId: recordId});

                        if (parsed.b) {
                            skipSummaryPage = true;
                        }

                        break;
                    default: // If it is a transaction, get the transaction details
                        recordDetails = getTransactionDetails({transactionId: recordId});
                        netsuiteCustomerId = recordDetails.entity.value;
                        skipSummaryPage = true;
                        break;

                }
                log.debug('recordDetails', recordDetails);
                this.entityNameField.defaultValue = `${recordDetails.entity.text}`;
                this.entityIdField.defaultValue = `${recordDetails.entity.value}`;
                let currencyId = +recordDetails.currency.value;
                let currency = getCurrencyCode(currencyId); // 3 letter ISO code
                let subsidiaryId = +recordDetails.subsidiary.value; // internalid of the subsidiary

                if (currencyId > 0) {
                    this.currencyField.defaultValue = currency;
                }

                const stripe = new Stripe({subsidiary: parsed.b ?  parsed.b : subsidiaryId });

                upsertCustomer({
                    netsuiteId: netsuiteCustomerId,
                    netsuiteStripeId: recordDetails.netsuiteStripeId,
                    stripe: stripe,
                    Found: stripeId => {

                        if (!skipSummaryPage) {
                            getInvoiceSummary({
                                recordId: recordId,
                                recordType: recordType,
                                pageIndex: pageId,
                                searchPageSize: this.pageSize,
                                FoundOne: invoiceSummary => {
                                    // Go straight to list

                                    subsidiaryId = invoiceSummary.subsidiaryid;
                                    currencyId = invoiceSummary.currencyid;
                                    currency = getCurrencyCode(invoiceSummary.currencyid);

                                    const summary = encode(`${decrypted}&b=${invoiceSummary.subsidiaryid}&c=${invoiceSummary.currencyid}&e=${invoiceSummary.customerid}&g=T`);
                                    this.summaryField.defaultValue = `${summary}`;
                                    this.currencyField.defaultValue = currency;

                                },
                                Found: invoiceSummaries => {
                                    const pageCount = Math.ceil(invoiceSummaries.length / this.pageSize);

                                    const invoiceSummaryTab = new TransactionSummaryTab(this.context, this.form, pageCount, pageId);
                                    invoiceSummaryTab.InvoiceSummarySublist.Invoices = invoiceSummaries;
                                },
                                NotFound: () => {
                                    const invoiceSummaryTab = new TransactionSummaryTab(this.context, this.form, -1, -1);

                                }
                            });
                        }

                        if (subsidiaryId) {

                            getInvoiceList({
                                recordId: recordId,
                                recordType: recordType,
                                subsidiaryId: subsidiaryId,
                                currencyId: currencyId,
                                pageIndex: pageId,
                                searchPageSize: this.pageListSize,
                                Found: invoiceLists => {

                                    const pageCount = Math.ceil(invoiceLists.length / this.pageListSize);
                                    const invoiceListTab = new TransactionListTab(this.context, this.form, stripe);
                                    invoiceListTab.TransactionListSublist.Invoices = invoiceLists;
                                    const invoice = invoiceLists.pop();

                                    if (invoice.amountremaining > 0 ) {

                                        this.subtotalField.defaultValue = `Total: ${format.getCurrencyFormatter({currency: currency}).format({number: invoice.amountremaining})} ${currency}`;
                                    } else {
                                        this.subtotalField.defaultValue = `This transaction has been paid.`;
                                    }
                                },
                                NotFound: () => {
                                    // Nothing to do here.
                                    this.subtotalField.defaultValue = `This transaction has been paid.`;
                                }
                            });
                        } else {
                            this.subtotalField.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});

                        }
                    },
                    NotFound: () => {
                        this.returnInvalidLink(true);
                        return;
                    }
                });

            } else {

                this.returnInvalidLink();
            }
        } catch (err) {
            log.debug('err', err);
            this.returnInvalidLink();
        }
    }

    public returnInvalidLink(notFoundInStripe?: boolean) {

        let message = `Invalid Link. Please contact support at ${this.stripeBundleConfiguration.PAYMENTLINK_SUPPORTEMAIL}.`;

        if (notFoundInStripe) {
            message = `No customer found. Please contact support at ${this.stripeBundleConfiguration.PAYMENTLINK_SUPPORTEMAIL}.`;
        }
        // @ts-ignore
        this.form = `${message}`;
        this.entityNameField.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
        this.subtotalField.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
        this.cssField.defaultValue = message;

    }

}
