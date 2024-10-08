/**
 * @copyright 2022 Myers-Holum Inc.
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 */
define(["require", "exports", "N/record", "N/log", "N/search"], function (require, exports, record, log, search) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.generateInvoice = void 0;
    // This function transforms an invoice to a customer payment
    const generateInvoice = (options) => {
        var _a, _b, _c, _d;
        let invoiceId = null;
        if (+options.recordId) {
            try {
                switch (options.recordType) {
                    case 'invoice':
                        invoiceId = options.recordId;
                        break;
                    default:
                        search.create({
                            type: search.Type.TRANSACTION,
                            filters: [
                                ['externalid', 'is', `inv_${(_a = options.charge) === null || _a === void 0 ? void 0 : _a.id}`]
                            ]
                        }).run().each(result => {
                            invoiceId = result.id;
                            return false;
                        });
                        if (!invoiceId) {
                            const invoice = record.transform({
                                fromType: options.recordType,
                                fromId: options.recordId,
                                toType: record.Type.INVOICE,
                                isDynamic: true
                            });
                            invoice.setValue({ fieldId: 'custbody_stripe_chargeid', value: (_b = options.charge) === null || _b === void 0 ? void 0 : _b.latest_charge });
                            invoice.setValue({ fieldId: 'custbody_stripe_payment_intentid', value: (_c = options.charge) === null || _c === void 0 ? void 0 : _c.id });
                            invoice.setValue({ fieldId: 'externalid', value: `inv_${(_d = options.charge) === null || _d === void 0 ? void 0 : _d.id}` });
                            invoice.setValue({ fieldId: 'custbody_mhi_stripe_payment_portal', value: '' });
                            invoice.save({ ignoreMandatoryFields: true });
                            invoiceId = invoice.id;
                        }
                        break;
                }
            }
            catch (err) {
                log.debug('err', err);
            }
        }
        // Return the customer payment id if successful
        if (+invoiceId > 0) {
            options.Success(invoiceId);
        }
        else {
            options.Failed();
        }
    };
    exports.generateInvoice = generateInvoice;
});
