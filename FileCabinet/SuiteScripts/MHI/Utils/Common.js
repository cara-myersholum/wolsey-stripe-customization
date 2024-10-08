/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */
define(["require", "exports", "N/runtime", "N/search", "N/url", "N/file", "./crypto-js"], function (require, exports, runtime, search, url, file, CryptoJS) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isPaymentCreditChargeExcluded = exports.isDirectRevenuePosting = exports.redirectToScript = exports.getFileContent = exports.parseQueryString = exports.decode = exports.encode = exports.getCurrencyCode = exports.getInstallmentEntityDetails = exports.getEntityDetails = exports.getInvoiceGroupDetails = exports.getTransactionDetails = exports.getStripePortalField = exports.getStripeLink = exports.getAccountId = exports.isProduction = void 0;
    // Function to check if the current Netsuite environment is a Production Environment
    const isProduction = () => {
        let isProduction = false;
        // Check if environment type is production
        if (runtime.envType === runtime.EnvType.PRODUCTION) {
            isProduction = true;
        }
        return isProduction;
    };
    exports.isProduction = isProduction;
    // Get Current Netsuite Account ID
    const getAccountId = () => {
        return runtime.accountId.replace('_', '-').toLowerCase();
    };
    exports.getAccountId = getAccountId;
    // Get Current Stripe Link
    const getStripeLink = (domain, id) => {
        let url = `https://dashboard.stripe.com/`;
        if (!(0, exports.isProduction)()) {
            url += `test/`;
        }
        url += `${domain}/${id}`;
        return url;
    };
    exports.getStripeLink = getStripeLink;
    // Get the Stripe Portal Field
    const getStripePortalField = (recordType) => {
        let paymentPortalField = null;
        switch (recordType) {
            case 'invoicegroup':
                paymentPortalField = 'custrecord_mhi_stripe_payment_portal';
                break;
            case 'customer':
            case 'partner':
                paymentPortalField = 'custentity_mhi_stripe_payment_portal';
                break;
            default:
                paymentPortalField = 'custbody_mhi_stripe_payment_portal';
                break;
        }
        return paymentPortalField;
    };
    exports.getStripePortalField = getStripePortalField;
    const getTransactionDetails = (options) => {
        let transactionDetails;
        if (+options.transactionId > 0) {
            search.create({
                type: search.Type.TRANSACTION,
                filters: [
                    ['internalidnumber', 'equalto', options.transactionId]
                ],
                columns: [
                    'entity',
                    'currency',
                    'fxamountremaining',
                    'subsidiary',
                    'transactionname',
                    'fxamount',
                    'custbody_stripe_chargeid',
                    'createdfrom.custbody_stripe_payment_intentid',
                    'customer.custentity_mhi_stripeid',
                    search.createColumn({
                        name: 'formulanumeric',
                        formula: 'CASE WHEN {recordType} = \'invoice\' THEN {fxamountremaining} WHEN  {recordType} = \'salesorder\' THEN {fxamountunbilled} ELSE {fxamount} END',
                        label: 'amountremaining'
                    })
                ]
            }).run().each(result => {
                transactionDetails = {
                    internalid: +result.id,
                    recordtype: result.recordType,
                    transactionname: result.getValue('transactionname'),
                    entity: {
                        value: result.getValue('entity'),
                        text: result.getText('entity')
                    },
                    currency: {
                        value: result.getValue('currency'),
                        text: result.getText('currency')
                    },
                    subsidiary: {
                        value: result.getValue('subsidiary'),
                        text: result.getText('subsidiary')
                    },
                    amountremaining: +result.getValue(search.createColumn({
                        name: 'formulanumeric',
                        formula: 'CASE WHEN {recordType} = \'invoice\' THEN {fxamountremaining} WHEN  {recordType} = \'salesorder\' THEN {fxamountunbilled} ELSE {fxamount} END',
                        label: 'amountremaining'
                    })),
                    amount: Math.abs(+result.getValue('fxamount')),
                    chargeid: result.getValue('custbody_stripe_chargeid'),
                    payment_intentid: result.getValue({ name: 'custbody_stripe_payment_intentid', join: 'createdfrom' }),
                    customerstripeid: result.getValue({ name: 'custentity_mhi_stripeid', join: 'customer' })
                };
                return false;
            });
        }
        return transactionDetails;
    };
    exports.getTransactionDetails = getTransactionDetails;
    const getInvoiceGroupDetails = (options) => {
        let transactionDetails;
        if (+options.transactionId > 0) {
            search.create({
                type: search.Type.INVOICE_GROUP,
                filters: [
                    ['internalidnumber', 'equalto', options.transactionId]
                ],
                columns: [
                    'customer',
                    'currency',
                    'subsidiary',
                    'invoicegroupnumber',
                    'fxamount',
                    'fxamountdue',
                    'custrecord_stripe_payment_intentid',
                    'custrecord_stripe_chargeid',
                ]
            }).run().each(result => {
                transactionDetails = {
                    internalid: +result.id,
                    recordtype: result.recordType,
                    transactionname: result.getValue('invoicegroupnumber'),
                    entity: {
                        value: result.getValue('customer'),
                        text: result.getText('customer')
                    },
                    currency: {
                        value: result.getValue('currency'),
                        text: result.getText('currency')
                    },
                    subsidiary: {
                        value: result.getValue('subsidiary'),
                        text: result.getText('subsidiary')
                    },
                    amountremaining: +result.getValue('fxamountdue'),
                    amount: Math.abs(+result.getValue('fxamount')),
                    chargeid: result.getValue('custrecord_stripe_chargeid'),
                    payment_intentid: result.getValue({ name: 'custrecord_stripe_payment_intentid' }),
                    customerstripeid: ''
                };
                return false;
            });
        }
        return transactionDetails;
    };
    exports.getInvoiceGroupDetails = getInvoiceGroupDetails;
    const getEntityDetails = (options) => {
        let entityDetails;
        if (+options.entityId > 0) {
            search.create({
                type: search.Type.CUSTOMER,
                filters: [
                    ['internalidnumber', 'equalto', options.entityId],
                    'AND',
                    ['isinactive', 'is', 'F']
                ],
                columns: [
                    'companyname',
                    'entityid',
                    'subsidiary',
                    'custentity_mhi_stripe_payment_expiry',
                    'email',
                    'custentity_mhi_stripe_pincode',
                    'custentity_mhi_stripeid'
                ]
            }).run().each(result => {
                entityDetails = {
                    internalid: +result.id,
                    recordtype: result.recordType,
                    subsidiary: +result.getValue('subsidiary'),
                    name: (result.getValue('companyname') || result.getValue('altname')),
                    email: result.getValue('email'),
                    expiry: result.getValue('custentity_mhi_stripe_payment_expiry'),
                    pin: result.getValue('custentity_mhi_stripe_pincode'),
                    netsuiteStripeId: result.getValue('custentity_mhi_stripeid')
                };
                return false;
            });
        }
        return entityDetails;
    };
    exports.getEntityDetails = getEntityDetails;
    const getInstallmentEntityDetails = (options) => {
        let entityDetails;
        if (+options.entityId > 0) {
            search.create({
                type: search.Type.CUSTOMER,
                filters: [
                    ['internalidnumber', 'equalto', options.entityId],
                    'AND',
                    ['isinactive', 'is', 'F']
                ],
                columns: [
                    'companyname',
                    'entityid',
                    'subsidiary'
                ]
            }).run().each(result => {
                entityDetails = {
                    internalid: +result.id,
                    recordtype: result.recordType,
                    subsidiary: +result.getValue('subsidiary'),
                    name: (result.getValue('companyname') || result.getValue('altname'))
                };
                return false;
            });
        }
        return entityDetails;
    };
    exports.getInstallmentEntityDetails = getInstallmentEntityDetails;
    const getCurrencyCode = (currencyId) => {
        let currencyCode = 'USD';
        if (+currencyId > 0) {
            search.create({
                type: search.Type.CURRENCY,
                filters: [
                    ['internalidnumber', 'equalto', currencyId]
                ],
                columns: [
                    'symbol'
                ]
            }).run().each(result => {
                currencyCode = result.getValue('symbol');
                return false;
            });
        }
        return currencyCode;
    };
    exports.getCurrencyCode = getCurrencyCode;
    const SECRET = 'Sd4y5';
    const encode = (plainText) => {
        let eHex = '';
        try {
            const b64 = CryptoJS.AES.encrypt(plainText, SECRET).toString();
            const e64 = CryptoJS.enc.Base64.parse(b64);
            eHex = e64.toString(CryptoJS.enc.Hex);
        }
        catch (e) {
        }
        return eHex;
    };
    exports.encode = encode;
    const decode = (cipherText) => {
        let plain = '';
        try {
            const reb64 = CryptoJS.enc.Hex.parse(cipherText);
            const bytes = reb64.toString(CryptoJS.enc.Base64);
            const decrypt = CryptoJS.AES.decrypt(bytes, SECRET);
            plain = decrypt.toString(CryptoJS.enc.Utf8);
        }
        catch (e) {
        }
        return plain;
    };
    exports.decode = decode;
    const parseQueryString = query => {
        const vars = query.split('&');
        const queryObject = {};
        for (let i = 0; i < vars.length; i += 1) {
            const pair = vars[i].split('=');
            const key = decodeURIComponent(pair.shift());
            const value = decodeURIComponent(pair.join('='));
            // If first entry with this name
            if (typeof queryObject[key] === 'undefined') {
                queryObject[key] = value;
                // If second entry with this name
            }
            else if (typeof queryObject[key] === 'string') {
                const arr = [queryObject[key], value];
                queryObject[key] = arr;
                // If third or later entry with this name
            }
            else {
                queryObject[key].push(value);
            }
        }
        return queryObject;
    };
    exports.parseQueryString = parseQueryString;
    const getFileContent = (options) => {
        // Load the HTML
        search.create({
            type: 'file',
            filters: [
                ['name', 'is', `${options.fileName}`]
            ]
        }).run().each(result => {
            const fileObj = file.load({ id: +result.id });
            options.Found(fileObj.getContents());
            return false;
        });
        options.NotFound();
    };
    exports.getFileContent = getFileContent;
    const redirectToScript = (params) => {
        const paramString = Object.keys(params).map(key => `${key}=${params[key]}`).join('&');
        const externalURL = url.resolveScript({
            scriptId: 'customscript_mhi_stripe_payment_portal',
            deploymentId: 'customdeploy_mhi_stripe_payment_portal',
            params: params,
            returnExternalUrl: true
        });
        return `${externalURL}`;
    };
    exports.redirectToScript = redirectToScript;
    const isDirectRevenuePosting = (itemId) => {
        let isDirectPosting = false;
        try {
            if (+itemId > 0) {
                search.create({
                    type: search.Type.ITEM,
                    filters: [
                        ['internalidnumber', 'equalto', itemId]
                    ],
                    columns: [
                        'directrevenueposting'
                    ]
                }).run().each(result => {
                    isDirectPosting = result.getValue('directrevenueposting');
                    return false;
                });
            }
        }
        catch (err) { }
        return isDirectPosting;
    };
    exports.isDirectRevenuePosting = isDirectRevenuePosting;
    const isPaymentCreditChargeExcluded = (transactionId, recordType) => {
        let isExcluded = false;
        try {
            if (+transactionId > 0) {
                search.create({
                    type: search.Type.TRANSACTION,
                    filters: [
                        ['internalidnumber', 'equalto', transactionId]
                    ],
                    columns: [
                        'custbody_mhi_stripe_exclude_cc_fee'
                    ]
                }).run().each(result => {
                    isExcluded = result.getValue('custbody_mhi_stripe_exclude_cc_fee');
                    return false;
                });
            }
        }
        catch (err) {
        }
        return isExcluded;
    };
    exports.isPaymentCreditChargeExcluded = isPaymentCreditChargeExcluded;
});
