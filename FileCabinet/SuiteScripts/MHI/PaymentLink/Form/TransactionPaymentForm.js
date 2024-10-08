/**
 * @copyright 2022 Myers-Holum Inc.
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 */
define(["require", "exports", "N/ui/serverWidget", "N/log", "N/url", "N/format/i18n", "N/currency", "../../StripeAPI/Stripe", "../Constants/InvoiceReviewFormConstants", "../../Utils/Common", "../Constants/TransactionListConstants", "../Stripe/Customer", "../Stripe/Payment_Intent", "../../Record/Stripe_Bundles_Configuration"], function (require, exports, serverWidget, log, url, format, currency, Stripe_1, InvoiceReviewFormConstants_1, Common_1, TransactionListConstants_1, Customer_1, Payment_Intent_1, Stripe_Bundles_Configuration_1) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TransactionPaymentForm = void 0;
    class TransactionPaymentForm {
        constructor(context) {
            this.context = context;
            this.formName = 'Review and Complete';
            this.form = serverWidget.createForm({
                title: this.formName
            });
            this.stripeBundleConfiguration = new Stripe_Bundles_Configuration_1.Stripe_Bundles_Configuration();
            // Subtotal section
            this.form.addFieldGroup({
                id: InvoiceReviewFormConstants_1.InvoiceReviewFormConstants.FIELD_GROUP.SUBTOTAL,
                label: ' '
            });
            this.entityNameField = this.form.addField({
                id: InvoiceReviewFormConstants_1.InvoiceReviewFormConstants.FIELDID.ENTITY,
                type: serverWidget.FieldType.TEXT,
                label: ' ',
                container: InvoiceReviewFormConstants_1.InvoiceReviewFormConstants.FIELD_GROUP.SUBTOTAL
            });
            this.entityNameField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
            this.subtotalField = this.form.addField({
                id: InvoiceReviewFormConstants_1.InvoiceReviewFormConstants.FIELDID.SUBTOTAL,
                type: serverWidget.FieldType.INLINEHTML,
                label: ' ',
                container: InvoiceReviewFormConstants_1.InvoiceReviewFormConstants.FIELD_GROUP.SUBTOTAL,
            });
            // Payment method section
            this.form.addFieldGroup({
                id: InvoiceReviewFormConstants_1.InvoiceReviewFormConstants.FIELD_GROUP.PAYMENTMETHODS,
                label: ' '
            });
            this.paymentMethodField = this.form.addField({
                id: InvoiceReviewFormConstants_1.InvoiceReviewFormConstants.FIELDID.PAYMENTMETHODS,
                type: serverWidget.FieldType.INLINEHTML,
                label: ' ',
                container: InvoiceReviewFormConstants_1.InvoiceReviewFormConstants.FIELD_GROUP.PAYMENTMETHODS
            });
            // Invoices section
            this.form.addFieldGroup({
                id: InvoiceReviewFormConstants_1.InvoiceReviewFormConstants.FIELD_GROUP.INVOICES,
                label: 'Transaction Summary'
            });
            this.invoiceSummaryField = this.form.addField({
                id: InvoiceReviewFormConstants_1.InvoiceReviewFormConstants.FIELDID.INVOICES,
                type: serverWidget.FieldType.INLINEHTML,
                label: ' ',
                container: InvoiceReviewFormConstants_1.InvoiceReviewFormConstants.FIELD_GROUP.INVOICES,
            });
            this.form.addButton({ functionName: `window.onbeforeunload = null;history.go(-1);`, id: 'custpage_back_btn', label: 'Back' });
        }
        get FORM() {
            return this.form;
        }
        set InvoiceReview(options) {
            const parameters = this.context.request.parameters.entryformquerystring ? (0, Common_1.parseQueryString)(this.context.request.parameters.entryformquerystring).p : this.context.request.parameters.p;
            const decrypted = (0, Common_1.decode)(parameters);
            const parsed = (0, Common_1.parseQueryString)(decrypted);
            const recordId = +parsed.a; // internalid of the record
            const recordType = parsed.t; // type of the record
            let netsuiteCustomerId = +parsed.a;
            let subsidiaryId = +parsed.b;
            // const parsed = parseQueryString(decrypted);
            log.debug('parsed ', parsed);
            if (recordId > 0) { // If we have entityId
                let recordDetails = null;
                switch (recordType) {
                    case 'customer':
                    case 'partner': // If it is a customer or partner, get the entity details
                        recordDetails = (0, Common_1.getEntityDetails)({ entityId: recordId });
                        break;
                    default: // If it is a transaction, get the transaction details
                        recordDetails = (0, Common_1.getTransactionDetails)({ transactionId: recordId });
                        netsuiteCustomerId = recordDetails.entity.value;
                        break;
                }
                const currencyId = recordDetails.currency.value;
                const currencyCode = (0, Common_1.getCurrencyCode)(currencyId);
                log.debug('currencyId', currencyId);
                log.debug('currencyCode', currencyCode);
                let total = 0;
                const lines = this.context.request.getLineCount({ group: TransactionListConstants_1.TransactionListConstants.ID });
                const invoices = [];
                for (let i = 0; i < lines; i = i + 1) {
                    const select = this.context.request.getSublistValue({ group: TransactionListConstants_1.TransactionListConstants.ID, name: TransactionListConstants_1.TransactionListConstants.FIELDID.SELECT, line: i });
                    const amount = this.context.request.getSublistValue({ group: TransactionListConstants_1.TransactionListConstants.ID, name: TransactionListConstants_1.TransactionListConstants.FIELDID.PAYMENTAMOUNT, line: i });
                    const name = this.context.request.getSublistValue({ group: TransactionListConstants_1.TransactionListConstants.ID, name: TransactionListConstants_1.TransactionListConstants.FIELDID.NAME, line: i });
                    const invoiceId = this.context.request.getSublistValue({ group: TransactionListConstants_1.TransactionListConstants.ID, name: TransactionListConstants_1.TransactionListConstants.FIELDID.ID, line: i });
                    if (select === 'T') {
                        invoices.push({
                            name: name,
                            invoiceId: invoiceId,
                            amount: +amount,
                            currency: currencyCode
                        });
                    }
                }
                if (invoices.length > 0) {
                    invoices.forEach(invoice => {
                        total += +invoice.amount;
                    });
                }
                subsidiaryId = recordDetails.subsidiary.value;
                const stripe = new Stripe_1.Stripe({ subsidiary: recordDetails.subsidiary.value });
                const subtotalHTML = [`<script>jQuery("head").append("<meta http-equiv='Cache-Control' content='no-cache, no-store, must-revalidate'/><meta http-equiv='Pragma' content='no-cache' /><meta http-equiv='Expires' content='0' />");jQuery('#detail_table_lay').addClass('payment-stripe-content');jQuery("<link/>", {rel: "stylesheet",type: "text/css",href: "${this.stripeBundleConfiguration.PAYMENTLINK_STYLES_CSS}"}).appendTo("head");jQuery('#main_form').removeAttr('onsubmit');</script><table class="summary-table">`];
                subtotalHTML.push(`
            <table>
                <tr>
                <td>Invoice Amount:</td>
                <td>${this.formatCurrency(total, currencyCode)} ${currencyCode}</td
              </tr>`);
                let threshold = true;
                // If threshold amount is set
                if (stripe.BUNDLESCONFIGURATION.PAYMENTLINK_CREDITCARD_FEE_THRESHOLD_AMOUNT > 0) {
                    // Declare the USD amount
                    let usdAmount = total;
                    // If currency is not USD, convert it
                    if (currencyCode !== 'USD') {
                        const rate = currency.exchangeRate({
                            source: currencyCode,
                            target: 'USD',
                            date: new Date()
                        });
                        usdAmount = total * rate;
                    }
                    // Dont add fee if amt <= threshold
                    if (usdAmount <= stripe.BUNDLESCONFIGURATION.PAYMENTLINK_CREDITCARD_FEE_THRESHOLD_AMOUNT) {
                        threshold = false;
                    }
                }
                const isCreditChargeExcluded = (0, Common_1.isPaymentCreditChargeExcluded)(recordId);
                log.debug('threshold', threshold);
                log.debug('isCreditChargeExcluded', isCreditChargeExcluded);
                // If we are charging stripe fee, add rows
                if (stripe.BUNDLESCONFIGURATION.PAYMENTLINK_CHARGE_CREDITCARD_FEE && threshold && !isCreditChargeExcluded) {
                    subtotalHTML.push(`
                  <tr id='surchargeAmt'>
                    <td>${stripe.BUNDLESCONFIGURATION.PAYMENTLINK_STRIPE_FEE_LABEL}: </td>
                    <td>${this.formatCurrency(+stripe.BUNDLESCONFIGURATION.GENERAL_CALCULATE_STRIPE_FEES_ONLY(total * 100) / 100, currencyCode)} ${currencyCode} </td>
                  </tr>
                    <tr id='totalAmt'>
                    <td>Total Amount:</td>
                    <td>${this.formatCurrency(+stripe.BUNDLESCONFIGURATION.GENERAL_CALCULATE_STRIPE_FEES(total * 100) / 100, currencyCode)} ${currencyCode} </td>
                  </tr>
                  `);
                }
                else {
                    subtotalHTML.push(`
                  <tr id='surchargeAmt'>
                  </tr>
                  <tr id='totalAmt'>
                  </tr>
                `);
                }
                subtotalHTML.push(`</table>`);
                this.subtotalField.defaultValue = `${subtotalHTML.join('')}`;
                this.entityNameField.defaultValue = `${recordDetails.entity.text}`;
                const invoiceSummaryHTML = [`<table class="summary-table">`];
                invoices.forEach(invoice => {
                    invoiceSummaryHTML.push(`<tr class='summary-tr'>`);
                    invoiceSummaryHTML.push(`<td class='summary-td'>${invoice.name}</td>`);
                    invoiceSummaryHTML.push(`<td class='summary-td'>&emsp;&emsp;</td>`);
                    invoiceSummaryHTML.push(`<td class='summary-td'>${this.formatCurrency(invoice.amount, invoice.currency)} ${invoice.currency}</td>`);
                    invoiceSummaryHTML.push('</tr>');
                });
                invoiceSummaryHTML.push('</table><br>');
                this.invoiceSummaryField.defaultValue = `${invoiceSummaryHTML.join('')}`;
                let paymentIntentClientSecret = '';
                let paymentIntentId = '';
                // Get the Customer's Stripe ID
                (0, Customer_1.upsertCustomer)({
                    netsuiteId: netsuiteCustomerId,
                    netsuiteStripeId: recordDetails.netsuiteStripeId,
                    stripe: stripe,
                    Found: stripeCustomerId => {
                        // Create the payment intent
                        (0, Payment_Intent_1.createPaymentIntent)({
                            amount: total,
                            currencyCode: currencyCode,
                            recordType: recordType,
                            recordId: recordId,
                            stripe: stripe,
                            stripeCustomerId: stripeCustomerId,
                            Success: payment_intent => {
                                paymentIntentId = payment_intent.id;
                                paymentIntentClientSecret = payment_intent.client_secret;
                            },
                            Failed: () => {
                                // Return Invalid Link
                                this.returnInvalidLink();
                            }
                        });
                    },
                    NotFound: () => {
                        // Return Invalid Link
                        this.returnInvalidLink();
                    }
                });
                let savedPaymentMethods = [];
                (0, Customer_1.getAllPaymentMethods)({
                    netsuiteId: netsuiteCustomerId,
                    netsuiteStripeId: recordDetails.netsuiteStripeId,
                    stripe: stripe,
                    Found: paymentMethods => {
                        savedPaymentMethods = paymentMethods;
                    },
                    NotFound: () => {
                        // Nothing to do here.
                    }
                });
                (0, Common_1.getFileContent)({
                    fileName: `stripe_payment_portal.html`,
                    Found: fileContent => {
                        fileContent = fileContent.replace('${CSS}', this.stripeBundleConfiguration.PAYMENTLINK_PORTAL_CSS);
                        // Replace the clientSecret and pubKey
                        fileContent = fileContent.replace('${clientSecret}', paymentIntentClientSecret);
                        fileContent = fileContent.replace('${publishableKey}', stripe.SETUP.appid);
                        let savedCardSelection = `<option value="new_card">New Payment Method</option>`;
                        savedPaymentMethods.forEach(savedPaymentMethod => {
                            if (savedPaymentMethod.card) {
                                savedCardSelection += `<option data-type='card' ${savedPaymentMethod.default ? 'selected' : ''} value="${savedPaymentMethod.id}">${savedPaymentMethod.card.brand.toUpperCase()}  ****${savedPaymentMethod.card.last4}  ${savedPaymentMethod.card.exp_month}/${savedPaymentMethod.card.exp_year}</option>`;
                            }
                            else if (savedPaymentMethod.us_bank_account) {
                                savedCardSelection += `<option data-type='us_bank_account' ${savedPaymentMethod.default ? 'selected' : ''} value="${savedPaymentMethod.id}">${savedPaymentMethod.us_bank_account.bank_name.toUpperCase()}  ****${savedPaymentMethod.us_bank_account.last4} ${savedPaymentMethod.us_bank_account.account_type.toUpperCase()}</option>`;
                            }
                            else if (savedPaymentMethod.acss_debit) {
                                savedCardSelection += `<option data-type='acss_debit' ${savedPaymentMethod.default ? 'selected' : ''} value="${savedPaymentMethod.id}">${savedPaymentMethod.acss_debit.bank_name.toUpperCase()}  ****${savedPaymentMethod.acss_debit.last4} CANADA</option>`;
                            }
                            else if (savedPaymentMethod.au_becs_debit) {
                                savedCardSelection += `<option data-type='au_becs_debit' ${savedPaymentMethod.default ? 'selected' : ''} value="${savedPaymentMethod.id}">${savedPaymentMethod.au_becs_debit.bsb_number.toUpperCase()}  ****${savedPaymentMethod.au_becs_debit.last4} BECS</option>`;
                            }
                            else if (savedPaymentMethod.sepa_debit) {
                                savedCardSelection += `<option data-type='sepa_debit' ${savedPaymentMethod.default ? 'selected' : ''} value="${savedPaymentMethod.id}">${savedPaymentMethod.sepa_debit.bank_code.toUpperCase()}  ****${savedPaymentMethod.sepa_debit.last4} ${savedPaymentMethod.sepa_debit.country.toUpperCase()}</option>`;
                            }
                            else if (savedPaymentMethod.bacs_debit) {
                                savedCardSelection += `<option data-type='bacs_debit' ${savedPaymentMethod.default ? 'selected' : ''} value="${savedPaymentMethod.id}">${savedPaymentMethod.bacs_debit.fingerprint.toUpperCase()}  ****${savedPaymentMethod.bacs_debit.last4} BACS</option>`;
                            }
                        });
                        // Add the saved card selection
                        fileContent = fileContent.replace('${savedCards}', savedCardSelection);
                        // Change the default email  and name
                        fileContent = fileContent.replace('${name}', 'name');
                        fileContent = fileContent.replace('${email}', 'email');
                        // Create the return URL
                        const link = url.resolveScript({
                            scriptId: 'customscript_mhi_stripe_payment_portal',
                            deploymentId: 'customdeploy_mhi_stripe_payment_portal',
                            returnExternalUrl: true
                        });
                        // Replace the return URL
                        fileContent = fileContent.replace('${returnUrl}', `${link}&p=${parameters}`);
                        // Create the fee URL
                        const feeURL = url.resolveScript({
                            scriptId: 'customscript_mhi_stripe_payment_fee_su',
                            deploymentId: 'customdeploy_mhi_stripe_payment_fee_su',
                            returnExternalUrl: true
                        });
                        // Replace the return URL
                        fileContent = fileContent.replace('${feeURL}', `${feeURL}&si=${subsidiaryId}&pi=${paymentIntentId}&ti=${recordId}`);
                        this.paymentMethodField.defaultValue = fileContent;
                    },
                    NotFound: () => {
                        // Nothing to do here.
                    }
                });
            }
        }
        formatCurrency(amount, currencyCode) {
            const curFormatter = format.getCurrencyFormatter({ currency: currencyCode });
            return curFormatter.format({ number: amount });
        }
        returnInvalidLink(notFoundInStripe) {
            let message = `Please try refreshing the page. If it does not work, please contact support at ${this.stripeBundleConfiguration.PAYMENTLINK_SUPPORTEMAIL}.`;
            if (notFoundInStripe) {
                message = `No customer found. Please contact support at ${this.stripeBundleConfiguration.PAYMENTLINK_SUPPORTEMAIL}.`;
            }
            // @ts-ignore
            this.form = `${message}`;
            this.entityNameField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
            this.subtotalField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
            this.subtotalField.defaultValue = message;
        }
    }
    exports.TransactionPaymentForm = TransactionPaymentForm;
});
